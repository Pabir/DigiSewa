package com.pabirul.digisewa

import android.content.Context
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.realtime.Realtime
import io.github.jan.supabase.storage.Storage
import io.github.jan.supabase.serializer.KotlinXSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.decodeFromJsonElement
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject

object Supabase {
    val client = createSupabaseClient(
        supabaseUrl = "https://yovucharoswrgpklvdbx.supabase.co",
        supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdnVjaGFyb3N3cmdwa2x2ZGJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NDQ4MjgsImV4cCI6MjA5MjUyMDgyOH0.rfEn9SK75QggQ5JdzHFgIa-ctHS3Iwp_tTGDBaRVpOA",
    ) {
        install(Postgrest)
        install(Auth)
        install(Realtime)
        install(Storage)
        
        defaultSerializer = KotlinXSerializer(Json {
            ignoreUnknownKeys = true
            coerceInputValues = true
            encodeDefaults = false
        })
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
    val vtc: String? = null,
    @kotlinx.serialization.SerialName("post_office") val postOffice: String? = null,
    @kotlinx.serialization.SerialName("police_station") val policeStation: String? = null,
    val district: String? = null,
    val state: String? = null,
    @kotlinx.serialization.SerialName("pin_code") val pinCode: String? = null,
    @kotlinx.serialization.SerialName("created_at") val createdAt: String? = null,
    @kotlinx.serialization.SerialName("provider_details") val providerDetails: ProviderDetails? = null
)

@Serializable
data class ProfileWithDetails(
    val id: String,
    @kotlinx.serialization.SerialName("full_name") val fullName: String,
    @kotlinx.serialization.SerialName("phone_number") val phoneNumber: String? = null,
    val role: UserRole,
    @kotlinx.serialization.SerialName("avatar_url") val avatarUrl: String? = null,
    val gender: String? = null,
    val address: String? = null,
    val city: String? = null,
    val vtc: String? = null,
    @kotlinx.serialization.SerialName("post_office") val postOffice: String? = null,
    @kotlinx.serialization.SerialName("police_station") val policeStation: String? = null,
    val district: String? = null,
    val state: String? = null,
    @kotlinx.serialization.SerialName("pin_code") val pinCode: String? = null,
    @kotlinx.serialization.SerialName("created_at") val createdAt: String? = null,
    @kotlinx.serialization.SerialName("provider_details") val providerDetails: ProviderDetails? = null,
    @kotlinx.serialization.SerialName("private_profile") val privateProfile: PrivateProfile? = null
)

@Serializable
data class PrivateProfile(
    val id: String,
    @kotlinx.serialization.SerialName("phone_number") val phoneNumber: String? = null,
    @kotlinx.serialization.SerialName("full_address") val fullAddress: String? = null,
    val vtc: String? = null,
    @kotlinx.serialization.SerialName("post_office") val postOffice: String? = null,
    @kotlinx.serialization.SerialName("police_station") val policeStation: String? = null,
    val district: String? = null,
    val state: String? = null,
    @kotlinx.serialization.SerialName("pin_code") val pinCode: String? = null
)

@Serializable
data class Category(
    val id: Int? = null,
    val name: String,
    @kotlinx.serialization.SerialName("name_bn") val nameBn: String? = null,
    @kotlinx.serialization.SerialName("name_hi") val nameHi: String? = null,
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

@Serializable
data class Service(
    val id: String? = null,
    @kotlinx.serialization.SerialName("provider_id") val providerId: String? = null,
    @kotlinx.serialization.SerialName("category_id") val categoryId: Int? = null,
    val title: String? = null,
    val description: String? = null,
    @kotlinx.serialization.SerialName("base_price") val basePrice: Int? = null,
    @kotlinx.serialization.SerialName("duration_minutes") val durationMinutes: Int? = null,
    @kotlinx.serialization.SerialName("main_image_url") val mainImageUrl: String? = null,
    @kotlinx.serialization.SerialName("is_active") val isActive: Boolean? = null,
    @kotlinx.serialization.SerialName("created_at") val createdAt: String? = null
)

@Serializable
data class ServiceGallery(
    val id: Int? = null,
    @kotlinx.serialization.SerialName("service_id") val serviceId: String,
    @kotlinx.serialization.SerialName("image_url") val imageUrl: String,
    @kotlinx.serialization.SerialName("created_at") val createdAt: String? = null
)

@Serializable
data class ServiceWithProvider(
    val id: String,
    val title: String,
    val description: String? = null,
    @kotlinx.serialization.SerialName("base_price") val basePrice: Int,
    @kotlinx.serialization.SerialName("duration_minutes") val durationMinutes: Int,
    @kotlinx.serialization.SerialName("main_image_url") val mainImageUrl: String? = null,
    val provider: ProfileWithDetails
)

@Serializable
enum class BookingStatus {
    @kotlinx.serialization.SerialName("requested") REQUESTED,
    @kotlinx.serialization.SerialName("confirmed") CONFIRMED,
    @kotlinx.serialization.SerialName("paid") PAID,
    @kotlinx.serialization.SerialName("completed") COMPLETED,
    @kotlinx.serialization.SerialName("cancelled") CANCELLED
}

@Serializable
data class Booking(
    val id: String? = null,
    @kotlinx.serialization.SerialName("customer_id") val customerId: String,
    @kotlinx.serialization.SerialName("provider_id") val providerId: String,
    @kotlinx.serialization.SerialName("service_id") val serviceId: String,
    @kotlinx.serialization.SerialName("scheduled_at") val scheduledAt: String,
    @kotlinx.serialization.SerialName("total_price") val totalPrice: Int,
    val status: BookingStatus = BookingStatus.REQUESTED,
    @kotlinx.serialization.SerialName("cancellation_fee") val cancellationFee: Int = 0,
    @kotlinx.serialization.SerialName("refund_amount") val refundAmount: Int = 0,
    @kotlinx.serialization.SerialName("confirmed_at") val confirmedAt: String? = null,
    @kotlinx.serialization.SerialName("created_at") val createdAt: String? = null,
    val lat: Double? = null,
    val lng: Double? = null,
    @kotlinx.serialization.SerialName("service_location_name") val serviceLocationName: String? = null
)

@Serializable
data class BookingWithDetails(
    val id: String,
    @kotlinx.serialization.SerialName("scheduled_at") val scheduledAt: String = "",
    @kotlinx.serialization.SerialName("total_price") val totalPrice: Int = 0,
    val status: BookingStatus = BookingStatus.REQUESTED,
    @kotlinx.serialization.SerialName("confirmed_at") val confirmedAt: String? = null,
    val service: Service? = null,
    val customer: ProfileWithDetails? = null,
    val provider: ProfileWithDetails? = null,
    @kotlinx.serialization.SerialName("reviews") val reviewsRaw: JsonElement? = null
) {
    val review: Review? get() = try {
        reviewsRaw?.let { raw ->
            when {
                raw is kotlinx.serialization.json.JsonArray -> {
                    if (raw.isNotEmpty()) Json.decodeFromJsonElement<Review>(raw[0]) else null
                }
                raw is kotlinx.serialization.json.JsonObject -> {
                    Json.decodeFromJsonElement<Review>(raw)
                }
                else -> null
            }
        }
    } catch (e: Exception) { null }
}

@Serializable
data class Review(
    val id: String? = null,
    @kotlinx.serialization.SerialName("booking_id") val bookingId: String,
    @kotlinx.serialization.SerialName("customer_id") val customerId: String,
    @kotlinx.serialization.SerialName("provider_id") val providerId: String,
    @kotlinx.serialization.SerialName("service_id") val serviceId: String,
    val rating: Int,
    val comment: String? = null,
    @kotlinx.serialization.SerialName("created_at") val createdAt: String? = null
)
