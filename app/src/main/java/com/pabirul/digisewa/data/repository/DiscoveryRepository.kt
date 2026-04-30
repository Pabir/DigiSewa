package com.pabirul.digisewa.data.repository

import com.pabirul.digisewa.Category
import com.pabirul.digisewa.ServiceGallery
import com.pabirul.digisewa.ServiceWithProvider
import com.pabirul.digisewa.Supabase
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Columns

class DiscoveryRepository {
    private val postgrest = Supabase.client.postgrest

    suspend fun getCategories(): List<Category> {
        return try {
            val columns = Columns.raw("id, name, name_bn, name_hi, description, icon_url")
            postgrest.from("categories").select(columns).decodeList<Category>()
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }

    suspend fun getServicesByCategory(categoryId: Int): List<ServiceWithProvider> {
        return try {
            val columns = Columns.raw("""
                *,
                provider:profiles(*, provider_details:provider_details(*))
            """.trimIndent())
            
            val response = postgrest.from("services").select(columns) {
                filter {
                    eq("category_id", categoryId)
                    eq("is_active", true)
                }
            }
            response.decodeList<ServiceWithProvider>()
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }

    suspend fun getServiceGallery(serviceId: String): List<ServiceGallery> {
        return try {
            postgrest.from("service_gallery").select {
                filter {
                    eq("service_id", serviceId)
                }
            }.decodeList<ServiceGallery>()
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }

    suspend fun getServiceReviews(serviceId: String): List<com.pabirul.digisewa.Review> {
        return try {
            postgrest.from("reviews").select {
                filter {
                    eq("service_id", serviceId)
                }
            }.decodeList<com.pabirul.digisewa.Review>()
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }
}
