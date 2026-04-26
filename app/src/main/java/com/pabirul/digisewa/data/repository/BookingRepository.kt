package com.pabirul.digisewa.data.repository

import android.util.Log
import com.pabirul.digisewa.Booking
import com.pabirul.digisewa.BookingStatus
import com.pabirul.digisewa.BookingWithDetails
import com.pabirul.digisewa.Supabase
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Columns

class BookingRepository {
    private val postgrest = Supabase.client.postgrest

    suspend fun createBooking(booking: Booking): Result<Unit> {
        return try {
            // Check if slot is already occupied by an active booking
            val existing = postgrest.from("bookings").select {
                filter {
                    eq("service_id", booking.serviceId)
                    eq("scheduled_at", booking.scheduledAt)
                    neq("status", "cancelled")
                }
            }.decodeList<Booking>()

            if (existing.isNotEmpty()) {
                return Result.failure(Exception("This slot is already booked or requested. Please choose another time."))
            }

            postgrest.from("bookings").insert(booking)
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

    suspend fun getBookingsForUser(userId: String, isProvider: Boolean): List<BookingWithDetails> {
        return try {
            val filterColumn = if (isProvider) "provider_id" else "customer_id"
            val columns = Columns.raw("""
                *,
                service:services(*),
                customer:profiles!customer_id(*, private_profile:private_profiles(*)),
                provider:profiles!provider_id(*)
            """.trimIndent())
            
            postgrest.from("bookings").select(columns) {
                filter {
                    eq(filterColumn, userId)
                }
                order("scheduled_at", io.github.jan.supabase.postgrest.query.Order.DESCENDING)
            }.decodeList<BookingWithDetails>()
        } catch (e: Exception) {
            Log.e("BookingRepo", "Error fetching bookings", e)
            emptyList()
        }
    }

    suspend fun updateBookingStatus(bookingId: String, status: BookingStatus): Result<Unit> {
        return try {
            postgrest.from("bookings").update(mapOf("status" to status.name.lowercase())) {
                filter {
                    eq("id", bookingId)
                }
            }
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e("BookingRepo", "Error updating status", e)
            Result.failure(e)
        }
    }

    suspend fun cancelBooking(bookingId: String, totalPrice: Int, isPaid: Boolean): Result<Unit> {
        return try {
            val updateData = mutableMapOf<String, Any>(
                "status" to BookingStatus.CANCELLED.name.lowercase()
            )
            
            if (isPaid) {
                val fee = (totalPrice * 0.1).toInt()
                val refund = totalPrice - fee
                updateData["cancellation_fee"] = fee
                updateData["refund_amount"] = refund
            }

            postgrest.from("bookings").update(updateData) {
                filter {
                    eq("id", bookingId)
                }
            }
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e("BookingRepo", "Error cancelling booking", e)
            Result.failure(e)
        }
    }
}
