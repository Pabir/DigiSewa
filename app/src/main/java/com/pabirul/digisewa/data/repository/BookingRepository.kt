package com.pabirul.digisewa.data.repository

import android.util.Log
import com.pabirul.digisewa.Booking
import com.pabirul.digisewa.BookingStatus
import com.pabirul.digisewa.BookingWithDetails
import com.pabirul.digisewa.Supabase
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Columns
import io.github.jan.supabase.functions.functions

import com.pabirul.digisewa.Service
import io.ktor.client.statement.bodyAsText
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

@Serializable
data class BookingSlot(
    @kotlinx.serialization.SerialName("scheduled_at") val scheduledAt: String,
    val lat: Double? = null,
    val lng: Double? = null,
    @kotlinx.serialization.SerialName("service_id") val serviceId: String? = null,
    val service: Service? = null
)

class BookingRepository {
    private val postgrest = Supabase.client.postgrest
    private val functions = Supabase.client.functions

    private fun parseIso(dateStr: String): java.time.Instant {
        val cleaned = dateStr.replace(" ", "T")
        val withZ = if (!cleaned.endsWith("Z") && !cleaned.contains("+")) "${cleaned}Z" else cleaned
        
        // Handle +00 (Supabase default) vs Z
        val normalized = withZ.replace(Regex("\\+\\d{2}$"), "Z")
        return java.time.Instant.parse(normalized)
    }

    suspend fun createBooking(booking: Booking): Result<Unit> {
        return try {
            val requestedTime = parseIso(booking.scheduledAt)
            val startTime = requestedTime.minusSeconds(2 * 3600).toString()
            val endTime = requestedTime.plusSeconds(2 * 3600).toString()

            // Check if provider has any active booking within the 4-hour window (2h before and 2h after)
            val existing = postgrest.from("bookings").select {
                filter {
                    eq("provider_id", booking.providerId)
                    neq("status", "cancelled")
                    gte("scheduled_at", startTime)
                    lte("scheduled_at", endTime)
                }
            }.decodeList<Booking>()

            if (existing.isNotEmpty()) {
                return Result.failure(Exception("This provider is unavailable around this time (2h buffer required). Please choose another slot."))
            }

            // Calculate platform fee and payout amount (15% commission)
            val platformFee = (booking.totalPrice * 0.15).toInt()
            val payoutAmount = booking.totalPrice - platformFee
            
            val bookingWithFees = booking.copy(
                platformFee = platformFee,
                payoutAmount = payoutAmount
            )

            postgrest.from("bookings").insert(bookingWithFees)
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e("BookingRepo", "Error creating booking", e)
            Result.failure(e)
        }
    }


    suspend fun confirmBooking(bookingId: String): Result<Unit> {
        return try {
            val now = java.time.Instant.now().toString()
            postgrest.from("bookings").update(
                mapOf(
                    "status" to BookingStatus.CONFIRMED.name.lowercase(),
                    "confirmed_at" to now
                )
            ) {
                filter {
                    eq("id", bookingId)
                }
            }
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e("BookingRepo", "Error confirming booking", e)
            Result.failure(e)
        }
    }

    suspend fun getBookingsForUser(userId: String, isProvider: Boolean): Result<List<BookingWithDetails>> {
        return try {
            val filterColumn = if (isProvider) "provider_id" else "customer_id"
            val columns = Columns.raw("""
                *,
                service:services(*),
                customer:profiles!customer_id(*, private_profile:private_profiles(*)),
                provider:profiles!provider_id(*, private_profile:private_profiles(*)),
                reviews:reviews(*)
            """.trimIndent())
            
            val response = postgrest.from("bookings").select(columns) {
                if (userId.isNotEmpty()) {
                    filter {
                        eq(filterColumn, userId)
                    }
                }
                order("scheduled_at", io.github.jan.supabase.postgrest.query.Order.DESCENDING)
            }
            
            Result.success(response.decodeList<BookingWithDetails>())
        } catch (e: Exception) {
            Log.e("BookingRepo", "Error fetching bookings: ${e.message}", e)
            Result.failure(e)
        }
    }

    suspend fun updateBookingStatus(bookingId: String, status: BookingStatus): Result<Unit> {
        return try {
            val statusStr = status.name.lowercase()
            postgrest.from("bookings").update(mapOf("status" to statusStr)) {
                filter { eq("id", bookingId) }
            }
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e("BookingRepo", "Error updating status", e)
            Result.failure(e)
        }
    }

    suspend fun markAsVerified(bookingId: String): Result<Unit> {
        return try {
            postgrest.from("bookings").update(mapOf("is_verified_by_call" to true)) {
                filter { eq("id", bookingId) }
            }
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun markAsPaidToProvider(bookingId: String): Result<Unit> {
        return try {
            postgrest.from("bookings").update(mapOf("payout_status" to "paid")) {
                filter { eq("id", bookingId) }
            }
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun cancelBooking(bookingId: String, totalPrice: Int, isPaid: Boolean): Result<Unit> {
        return try {
            val statusStr = BookingStatus.CANCELLED.name.lowercase()
            
            if (isPaid) {
                val fee = (totalPrice * 0.1).toInt()
                val refund = totalPrice - fee
                
                // Use a concrete Map with explicit types to avoid 'Any' serialization issues
                val updateData = mapOf(
                    "status" to statusStr,
                    "cancellation_fee" to fee.toString(),
                    "refund_amount" to refund.toString()
                )

                postgrest.from("bookings").update(updateData) {
                    filter { eq("id", bookingId) }
                }
            } else {
                // Simpler update if not paid
                postgrest.from("bookings").update(mapOf("status" to statusStr)) {
                    filter { eq("id", bookingId) }
                }
            }
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e("BookingRepo", "Error cancelling booking", e)
            Result.failure(e)
        }
    }

    suspend fun getUnavailableSlots(providerId: String, date: String): List<BookingSlot> {
        return try {
            // Fetch bookings with service details (to get duration) and location
            val response = postgrest.from("bookings").select(io.github.jan.supabase.postgrest.query.Columns.raw("scheduled_at, lat, lng, service_id, service:services(duration_minutes)")) {
                filter {
                    eq("provider_id", providerId)
                    neq("status", "cancelled")
                }
            }
            
            val allSlots = response.decodeList<BookingSlot>()
            
            val daySlots = allSlots.filter { slot ->
                slot.scheduledAt.contains(date) || 
                (slot.scheduledAt.contains("Apr") && date.contains("04"))
            }
            
            daySlots
        } catch (e: Exception) {
            Log.e("BookingRepo", "Error in getUnavailableSlots", e)
            emptyList()
        }
    }

    suspend fun submitReview(review: com.pabirul.digisewa.Review): Result<Unit> {
        return try {
            postgrest.from("reviews").insert(review)
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e("BookingRepo", "Error submitting review", e)
            Result.failure(e)
        }
    }
}
