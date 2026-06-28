package com.pabirul.digisewa

import android.content.Context
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.functions.Functions
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
        install(Functions)
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
    @kotlinx.serialization.SerialName("provider") PROVIDER,
    @kotlinx.serialization.SerialName("shopkeeper") SHOPKEEPER,
    @kotlinx.serialization.SerialName("agent") AGENT,
    @kotlinx.serialization.SerialName("admin") ADMIN
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
    @kotlinx.serialization.SerialName("onboarding_completed") val onboardingCompleted: Boolean = true,
    @kotlinx.serialization.SerialName("created_at") val createdAt: String? = null,
    @kotlinx.serialization.SerialName("provider_details") val providerDetails: ProviderDetails? = null,
    @kotlinx.serialization.SerialName("store_details") val storeDetails: Store? = null
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
    @kotlinx.serialization.SerialName("onboarding_completed") val onboardingCompleted: Boolean = true,
    @kotlinx.serialization.SerialName("created_at") val createdAt: String? = null,
    @kotlinx.serialization.SerialName("provider_details") val providerDetails: ProviderDetails? = null,
    @kotlinx.serialization.SerialName("store_details") val storeDetails: Store? = null,
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
    val type: String = "service",
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
    @kotlinx.serialization.SerialName("per_session_fee") val perSessionFee: Int? = null,
    @kotlinx.serialization.SerialName("bank_account_number") val bankAccountNumber: String? = null,
    @kotlinx.serialization.SerialName("bank_ifsc") val bankIfsc: String? = null,
    @kotlinx.serialization.SerialName("bank_account_name") val bankAccountName: String? = null,
    @kotlinx.serialization.SerialName("razorpay_account_id") val razorpayAccountId: String? = null
)

@Serializable
data class Store(
    val id: String? = null,
    @kotlinx.serialization.SerialName("owner_id") val ownerId: String? = null,
    val name: String,
    val description: String? = null,
    @kotlinx.serialization.SerialName("category_id") val categoryId: Int? = null,
    val address: String? = null,
    @kotlinx.serialization.SerialName("phone_number") val phoneNumber: String? = null,
    val lat: Double? = null,
    val lng: Double? = null,
    @kotlinx.serialization.SerialName("is_verified") val isVerified: Boolean = false,
    @kotlinx.serialization.SerialName("created_at") val createdAt: String? = null
)

@Serializable
data class Product(
    val id: String? = null,
    @kotlinx.serialization.SerialName("store_id") val storeId: String? = null,
    val title: String,
    val description: String? = null,
    val price: Int? = null,
    @kotlinx.serialization.SerialName("is_in_stock") val isInStock: Boolean = true,
    @kotlinx.serialization.SerialName("main_image_url") val mainImageUrl: String? = null,
    @kotlinx.serialization.SerialName("created_at") val createdAt: String? = null
)

@Serializable
data class ProductGallery(
    val id: Long? = null,
    @kotlinx.serialization.SerialName("product_id") val productId: String,
    @kotlinx.serialization.SerialName("image_url") val imageUrl: String,
    @kotlinx.serialization.SerialName("created_at") val createdAt: String? = null
)

@Serializable
data class StoreWithProducts(
    val id: String,
    val name: String,
    val description: String? = null,
    val address: String? = null,
    val lat: Double? = null,
    val lng: Double? = null,
    val products: List<Product> = emptyList()
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
    @kotlinx.serialization.SerialName("duration_unit") val durationUnit: String? = "Minutes",
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
    @kotlinx.serialization.SerialName("duration_unit") val durationUnit: String = "Minutes",
    @kotlinx.serialization.SerialName("main_image_url") val mainImageUrl: String? = null,
    val provider: ProfileWithDetails
) {
    val customerPrice: Int get() = (basePrice * 1.15).toInt()
}

@Serializable
enum class BookingStatus {
    @kotlinx.serialization.SerialName("requested") REQUESTED,
    @kotlinx.serialization.SerialName("confirmed") CONFIRMED,
    @kotlinx.serialization.SerialName("paid") PAID,
    @kotlinx.serialization.SerialName("completed") COMPLETED,
    @kotlinx.serialization.SerialName("cancelled") CANCELLED
}

@Serializable
enum class RequirementStatus {
    @kotlinx.serialization.SerialName("open") OPEN,
    @kotlinx.serialization.SerialName("closed") CLOSED,
    @kotlinx.serialization.SerialName("completed") COMPLETED
}

@Serializable
enum class ResponseStatus {
    @kotlinx.serialization.SerialName("pending") PENDING,
    @kotlinx.serialization.SerialName("accepted") ACCEPTED,
    @kotlinx.serialization.SerialName("rejected") REJECTED
}

@Serializable
data class Requirement(
    val id: String? = null,
    @kotlinx.serialization.SerialName("customer_id") val customerId: String,
    @kotlinx.serialization.SerialName("category_id") val categoryId: Int,
    val description: String,
    val budget: Int? = null,
    @kotlinx.serialization.SerialName("location_name") val locationName: String? = null,
    val lat: Double? = null,
    val lng: Double? = null,
    @kotlinx.serialization.SerialName("scheduled_at") val scheduledAt: String? = null,
    val status: RequirementStatus = RequirementStatus.OPEN,
    @kotlinx.serialization.SerialName("created_at") val createdAt: String? = null
)

@Serializable
data class RequirementPhoto(
    val id: String? = null,
    @kotlinx.serialization.SerialName("requirement_id") val requirementId: String,
    @kotlinx.serialization.SerialName("image_url") val imageUrl: String
)

@Serializable
data class RequirementResponse(
    val id: String? = null,
    @kotlinx.serialization.SerialName("requirement_id") val requirementId: String,
    @kotlinx.serialization.SerialName("provider_id") val providerId: String,
    @kotlinx.serialization.SerialName("service_id") val serviceId: String? = null,
    @kotlinx.serialization.SerialName("quote_amount") val quoteAmount: Int,
    val message: String? = null,
    @kotlinx.serialization.SerialName("scheduled_at") val scheduledAt: String? = null,
    val status: ResponseStatus = ResponseStatus.PENDING,
    @kotlinx.serialization.SerialName("created_at") val createdAt: String? = null
)

@Serializable
data class RequirementWithDetails(
    val id: String,
    @kotlinx.serialization.SerialName("customer_id") val customerId: String,
    @kotlinx.serialization.SerialName("category_id") val categoryId: Int,
    val description: String,
    val budget: Int? = null,
    @kotlinx.serialization.SerialName("location_name") val locationName: String? = null,
    val lat: Double? = null,
    val lng: Double? = null,
    @kotlinx.serialization.SerialName("scheduled_at") val scheduledAt: String? = null,
    val status: RequirementStatus,
    @kotlinx.serialization.SerialName("created_at") val createdAt: String,
    val category: Category? = null,
    val customer: Profile? = null,
    @kotlinx.serialization.SerialName("requirement_photos") val photos: List<RequirementPhoto> = emptyList(),
    @kotlinx.serialization.SerialName("requirement_responses") val responses: List<RequirementResponseWithProvider> = emptyList()
)

@Serializable
data class RequirementResponseWithProvider(
    val id: String,
    @kotlinx.serialization.SerialName("requirement_id") val requirementId: String,
    @kotlinx.serialization.SerialName("provider_id") val providerId: String,
    @kotlinx.serialization.SerialName("service_id") val serviceId: String? = null,
    @kotlinx.serialization.SerialName("quote_amount") val quoteAmount: Int,
    val message: String? = null,
    @kotlinx.serialization.SerialName("scheduled_at") val scheduledAt: String? = null,
    val status: ResponseStatus,
    @kotlinx.serialization.SerialName("created_at") val createdAt: String,
    val provider: ProfileWithDetails? = null,
    val service: Service? = null,
    val requirement: Requirement? = null
) {
    val customerPrice: Int get() = (quoteAmount * 1.15).toInt()
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
    @kotlinx.serialization.SerialName("service_location_name") val serviceLocationName: String? = null,
    @kotlinx.serialization.SerialName("payment_id") val paymentId: String? = null,
    @kotlinx.serialization.SerialName("platform_fee") val platformFee: Int = 0,
    @kotlinx.serialization.SerialName("payout_amount") val payoutAmount: Int = 0,
    @kotlinx.serialization.SerialName("is_verified_by_call") val isVerifiedByCall: Boolean = false,
    @kotlinx.serialization.SerialName("payout_status") val payoutStatus: String = "pending"
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
    @kotlinx.serialization.SerialName("payment_id") val paymentId: String? = null,
    @kotlinx.serialization.SerialName("platform_fee") val platformFee: Int = 0,
    @kotlinx.serialization.SerialName("payout_amount") val payoutAmount: Int = 0,
    @kotlinx.serialization.SerialName("is_verified_by_call") val isVerifiedByCall: Boolean = false,
    @kotlinx.serialization.SerialName("payout_status") val payoutStatus: String = "pending",
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
