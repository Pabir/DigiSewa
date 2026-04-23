package com.pabirul.digisewa

import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.realtime.Realtime
import io.github.jan.supabase.storage.Storage
import kotlinx.serialization.Serializable

object Supabase {
    val client = createSupabaseClient(
        supabaseUrl = "https://yovucharoswrgpklvdbx.supabase.co",
        supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdnVjaGFyb3N3cmdwa2x2ZGJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NDQ4MjgsImV4cCI6MjA5MjUyMDgyOH0.rfEn9SK75QggQ5JdzHFgIa-ctHS3Iwp_tTGDBaRVpOA",
    ) {
        install(Postgrest)
        install(Auth)
        install(Realtime)
        install(Storage)
    }
}

@Serializable
enum class UserRole {
    @kotlinx.serialization.SerialName("customer") CUSTOMER,
    @kotlinx.serialization.SerialName("provider") PROVIDER
}

@Serializable
data class Profile(
    val id: String,
    @kotlinx.serialization.SerialName("full_name") val fullName: String,
    @kotlinx.serialization.SerialName("phone_number") val phoneNumber: String? = null,
    val role: UserRole,
    @kotlinx.serialization.SerialName("avatar_url") val avatarUrl: String? = null,
    val gender: String? = null,
    val address: String? = null,
    val city: String? = null,
    @kotlinx.serialization.SerialName("created_at") val createdAt: String? = null
)

@Serializable
data class Category(
    val id: Int? = null,
    val name: String,
    val description: String? = null,
    @kotlinx.serialization.SerialName("icon_url") val iconUrl: String? = null
)

@Serializable
data class ProviderDetails(
    val id: String,
    @kotlinx.serialization.SerialName("category_id") val categoryId: Int? = null,
    val bio: String? = null,
    @kotlinx.serialization.SerialName("experience_years") val experienceYears: Int? = null,
    @kotlinx.serialization.SerialName("location_lat") val locationLat: Double? = null,
    @kotlinx.serialization.SerialName("location_lng") val locationLng: Double? = null,
    @kotlinx.serialization.SerialName("is_verified") val isVerified: Boolean = false,
    @kotlinx.serialization.SerialName("working_hours") val workingHours: String? = null,
    @kotlinx.serialization.SerialName("per_session_fee") val perSessionFee: Int? = null
)
