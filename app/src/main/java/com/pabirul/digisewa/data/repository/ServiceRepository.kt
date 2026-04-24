package com.pabirul.digisewa.data.repository

import com.pabirul.digisewa.Service
import com.pabirul.digisewa.ServiceGallery
import com.pabirul.digisewa.Supabase
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.storage.storage

class ServiceRepository {
    private val postgrest = Supabase.client.postgrest
    private val storage = Supabase.client.storage

    suspend fun getServicesByProvider(providerId: String): List<Service> {
        return try {
            postgrest.from("services").select {
                filter {
                    eq("provider_id", providerId)
                }
            }.decodeList<Service>()
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }

    suspend fun createService(service: Service): Result<Service> {
        return try {
            val response = postgrest.from("services").insert(service) {
                select()
            }.decodeSingle<Service>()
            Result.success(response)
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }

    suspend fun updateService(service: Service): Result<Unit> {
        return try {
            postgrest.from("services").update(service) {
                filter {
                    eq("id", service.id!!)
                }
            }
            Result.success(Unit)
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }

    suspend fun uploadServiceImage(providerId: String, serviceId: String, fileName: String, bytes: ByteArray): Result<String> {
        return try {
            val path = "$providerId/$serviceId/$fileName"
            val bucket = storage.from("service-images")
            bucket.upload(path, bytes) {
                upsert = true
            }
            Result.success(bucket.publicUrl(path))
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }

    suspend fun addGalleryImage(serviceId: String, imageUrl: String): Result<Unit> {
        return try {
            postgrest.from("service_gallery").insert(ServiceGallery(serviceId = serviceId, imageUrl = imageUrl))
            Result.success(Unit)
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }

    suspend fun getGalleryByService(serviceId: String): List<ServiceGallery> {
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

    suspend fun deleteService(serviceId: String): Result<Unit> {
        return try {
            postgrest.from("services").delete {
                filter {
                    eq("id", serviceId)
                }
            }
            Result.success(Unit)
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }
}
