package com.pabirul.digisewa.data.repository

import android.util.Log
import com.pabirul.digisewa.Product
import com.pabirul.digisewa.ProductGallery
import com.pabirul.digisewa.Store
import com.pabirul.digisewa.Supabase
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.storage.storage

class StoreRepository {
    private val postgrest = Supabase.client.postgrest
    private val storage = Supabase.client.storage

    suspend fun createOrUpdateStore(store: Store): Result<Unit> {
        return try {
            postgrest.from("stores").upsert(store)
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e("StoreRepo", "Error saving store", e)
            Result.failure(e)
        }
    }

    suspend fun getStoreByOwner(ownerId: String): Store? {
        return try {
            postgrest.from("stores").select {
                filter { eq("owner_id", ownerId) }
            }.decodeSingleOrNull<Store>()
        } catch (e: Exception) {
            Log.e("StoreRepo", "Error fetching store", e)
            null
        }
    }

    suspend fun getStoreById(storeId: String): Store? {
        return try {
            postgrest.from("stores").select {
                filter { eq("id", storeId) }
            }.decodeSingleOrNull<Store>()
        } catch (e: Exception) {
            Log.e("StoreRepo", "Error fetching store by ID", e)
            null
        }
    }

    suspend fun getNearbyStores(): List<Store> {
        return try {
            postgrest.from("stores").select().decodeList<Store>()
        } catch (e: Exception) {
            Log.e("StoreRepo", "Error fetching stores", e)
            emptyList()
        }
    }

    suspend fun getStoreWithProducts(storeId: String): Store? {
        return try {
            val columns = io.github.jan.supabase.postgrest.query.Columns.raw("*, products(*)")
            postgrest.from("stores").select(columns) {
                filter { eq("id", storeId) }
            }.decodeSingleOrNull<Store>()
        } catch (e: Exception) {
            Log.e("StoreRepo", "Error fetching store details", e)
            null
        }
    }

    suspend fun getProductsByCategory(categoryId: Int, onlyInStock: Boolean = true): List<Product> {
        return try {
            // Find stores in this category first
            val stores = postgrest.from("stores").select {
                filter { eq("category_id", categoryId) }
            }.decodeList<Store>()
            
            if (stores.isEmpty()) return emptyList()
            
            val storeIds = stores.map { it.id }.filterNotNull()
            postgrest.from("products").select {
                filter {
                    or {
                        storeIds.forEach { eq("store_id", it) }
                    }
                    if (onlyInStock) {
                        eq("is_in_stock", true)
                    }
                }
            }.decodeList<Product>()
        } catch (e: Exception) {
            Log.e("StoreRepo", "Error fetching products by category", e)
            emptyList()
        }
    }

    suspend fun getProductsByStore(storeId: String, onlyInStock: Boolean = false): List<Product> {
        return try {
            postgrest.from("products").select {
                filter { 
                    eq("store_id", storeId)
                    if (onlyInStock) {
                        eq("is_in_stock", true)
                    }
                }
            }.decodeList<Product>()
        } catch (e: Exception) {
            Log.e("StoreRepo", "Error fetching products", e)
            emptyList()
        }
    }

    suspend fun saveProduct(product: Product, mainImage: ByteArray?, gallery: List<ByteArray>): Result<Unit> {
        return try {
            val savedProduct = postgrest.from("products").upsert(product) {
                select()
            }.decodeSingle<Product>()

            val productId = savedProduct.id!!

            // Upload main image
            mainImage?.let { bytes ->
                val fileName = "main_${System.currentTimeMillis()}.jpg"
                val path = "products/$productId/$fileName"
                storage.from("product-images").upload(path, bytes) { upsert = true }
                val url = storage.from("product-images").publicUrl(path)
                postgrest.from("products").update(mapOf("main_image_url" to url)) {
                    filter { eq("id", productId) }
                }
            }

            // Upload gallery
            gallery.forEachIndexed { index, bytes ->
                val fileName = "gallery_${index}_${System.currentTimeMillis()}.jpg"
                val path = "products/$productId/$fileName"
                storage.from("product-images").upload(path, bytes) { upsert = true }
                val url = storage.from("product-images").publicUrl(path)
                postgrest.from("product_gallery").insert(ProductGallery(productId = productId, imageUrl = url))
            }

            Result.success(Unit)
        } catch (e: Exception) {
            Log.e("StoreRepo", "Error saving product", e)
            Result.failure(e)
        }
    }

    suspend fun deleteProduct(productId: String): Result<Unit> {
        return try {
            postgrest.from("products").delete {
                filter { eq("id", productId) }
            }
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e("StoreRepo", "Error deleting product", e)
            Result.failure(e)
        }
    }
}
