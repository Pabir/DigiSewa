package com.pabirul.digisewa.data.repository

import android.util.Log
import com.pabirul.digisewa.*
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Columns
import io.github.jan.supabase.storage.storage

class RequirementRepository {
    private val postgrest = Supabase.client.postgrest
    private val storage = Supabase.client.storage

    suspend fun createRequirement(requirement: Requirement, photos: List<ByteArray>): Result<Unit> {
        return try {
            val response = postgrest.from("requirements").insert(requirement) {
                select()
            }.decodeSingle<Requirement>()
            
            val requirementId = response.id!!
            
            photos.forEachIndexed { index, bytes ->
                val fileName = "photo_${index}_${System.currentTimeMillis()}.jpg"
                val path = "${requirement.customerId}/$requirementId/$fileName"
                val bucket = storage.from("requirement-images")
                try {
                    bucket.upload(path, bytes) {
                        upsert = true
                    }
                    val imageUrl = bucket.publicUrl(path)
                    postgrest.from("requirement_photos").insert(
                        RequirementPhoto(requirementId = requirementId, imageUrl = imageUrl)
                    )
                } catch (e: Exception) {
                    Log.e("RequirementRepo", "Error uploading photo $index", e)
                }
            }
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e("RequirementRepo", "Error creating requirement", e)
            Result.failure(e)
        }
    }

    suspend fun getOpenRequirements(categoryId: Int? = null): List<RequirementWithDetails> {
        return try {
            val columns = Columns.raw("""
                *,
                category:categories(*),
                customer:profiles(*),
                requirement_photos(*),
                requirement_responses(*, provider:profiles(*, provider_details:provider_details(*)), service:services(*))
            """.trimIndent())
            
            postgrest.from("requirements").select(columns) {
                filter {
                    eq("status", RequirementStatus.OPEN.name.lowercase())
                    if (categoryId != null) {
                        eq("category_id", categoryId)
                    }
                }
                order("created_at", io.github.jan.supabase.postgrest.query.Order.DESCENDING)
            }.decodeList<RequirementWithDetails>()
        } catch (e: Exception) {
            Log.e("RequirementRepo", "Error fetching open requirements", e)
            emptyList()
        }
    }

    suspend fun getMyRequirements(customerId: String): List<RequirementWithDetails> {
        return try {
            val columns = Columns.raw("""
                *,
                category:categories(*),
                requirement_photos(*),
                requirement_responses(*, provider:profiles(*, provider_details:provider_details(*)), service:services(*))
            """.trimIndent())
            
            postgrest.from("requirements").select(columns) {
                filter {
                    eq("customer_id", customerId)
                }
                order("created_at", io.github.jan.supabase.postgrest.query.Order.DESCENDING)
            }.decodeList<RequirementWithDetails>()
        } catch (e: Exception) {
            Log.e("RequirementRepo", "Error fetching my requirements", e)
            emptyList()
        }
    }

    suspend fun submitResponse(response: RequirementResponse): Result<Unit> {
        return try {
            postgrest.from("requirement_responses").insert(response)
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e("RequirementRepo", "Error submitting response", e)
            Result.failure(e)
        }
    }

    suspend fun updateResponseStatus(responseId: String, status: ResponseStatus): Result<Unit> {
        return try {
            postgrest.from("requirement_responses").update(mapOf("status" to status.name.lowercase())) {
                filter {
                    eq("id", responseId)
                }
            }
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e("RequirementRepo", "Error updating response status", e)
            Result.failure(e)
        }
    }

    suspend fun acceptResponse(requirementId: String, responseId: String): Result<Unit> {
        return try {
            // 1. Update response status to accepted
            postgrest.from("requirement_responses").update(mapOf("status" to ResponseStatus.ACCEPTED.name.lowercase())) {
                filter { eq("id", responseId) }
            }

            // 2. Fetch full details to create booking
            val columns = Columns.raw("""
                *,
                requirement:requirements(*),
                service:services(*)
            """.trimIndent())
            
            val responseWithDetails = postgrest.from("requirement_responses").select(columns) {
                filter { eq("id", responseId) }
            }.decodeSingle<RequirementResponseWithProvider>()

            val req = responseWithDetails.requirement ?: throw Exception("Requirement not found")
            val service = responseWithDetails.service ?: throw Exception("Service not found")

            // 3. Create Booking
            val booking = Booking(
                customerId = req.customerId,
                providerId = responseWithDetails.providerId,
                serviceId = responseWithDetails.serviceId!!,
                scheduledAt = responseWithDetails.scheduledAt ?: req.scheduledAt ?: throw Exception("No date/time specified"),
                totalPrice = responseWithDetails.quoteAmount,
                lat = req.lat,
                lng = req.lng,
                serviceLocationName = req.locationName
            )

            val bookingRepo = BookingRepository()
            val bookingResult = bookingRepo.createBooking(booking)
            
            if (bookingResult.isFailure) {
                // Rollback response status if booking fails (e.g. sandwich conflict)
                postgrest.from("requirement_responses").update(mapOf("status" to ResponseStatus.PENDING.name.lowercase())) {
                    filter { eq("id", responseId) }
                }
                return bookingResult
            }

            // 4. Close Requirement
            closeRequirement(requirementId)
            
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e("RequirementRepo", "Error accepting response", e)
            Result.failure(e)
        }
    }

    suspend fun closeRequirement(requirementId: String): Result<Unit> {
        return try {
            postgrest.from("requirements").update(mapOf("status" to RequirementStatus.CLOSED.name.lowercase())) {
                filter {
                    eq("id", requirementId)
                }
            }
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e("RequirementRepo", "Error closing requirement", e)
            Result.failure(e)
        }
    }
}
