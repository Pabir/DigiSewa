package com.pabirul.digisewa.data.repository

import com.pabirul.digisewa.Category
import com.pabirul.digisewa.Profile
import com.pabirul.digisewa.ProviderDetails
import com.pabirul.digisewa.Supabase
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.storage.storage

class ProfileRepository {
    private val postgrest = Supabase.client.postgrest
    private val storage = Supabase.client.storage

    suspend fun updateProfile(profile: Profile): Result<Unit> {
        return try {
            postgrest.from("profiles").update(profile) {
                filter {
                    eq("id", profile.id)
                }
            }
            
            // Sync sensitive data to private_profiles for the contact reveal feature
            val privateData = mapOf(
                "id" to profile.id,
                "phone_number" to profile.phoneNumber,
                "full_address" to profile.address,
                "vtc" to profile.vtc,
                "post_office" to profile.postOffice,
                "police_station" to profile.policeStation,
                "district" to profile.district,
                "state" to profile.state,
                "pin_code" to profile.pinCode
            )
            postgrest.from("private_profiles").upsert(privateData)

            Result.success(Unit)
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }

    suspend fun updateProviderDetails(details: ProviderDetails): Result<Unit> {
        return try {
            postgrest.from("provider_details").upsert(details)
            Result.success(Unit)
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }

    suspend fun uploadAvatar(userId: String, bytes: ByteArray): Result<String> {
        return try {
            val fileName = "$userId/avatar.jpg"
            val bucket = storage.from("avatars")
            bucket.upload(fileName, bytes) {
                upsert = true
            }
            val url = bucket.publicUrl(fileName)
            Result.success(url)
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }

    suspend fun completeOnboarding(userId: String): Result<Unit> {
        return try {
            postgrest.from("profiles").update(mapOf("onboarding_completed" to true)) {
                filter { eq("id", userId) }
            }
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getCategories(): List<Category> {
        return try {
            postgrest.from("categories").select().decodeList<Category>()
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }
}
