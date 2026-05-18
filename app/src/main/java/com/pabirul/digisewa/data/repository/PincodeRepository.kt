package com.pabirul.digisewa.data.repository

import com.pabirul.digisewa.data.api.PincodeService
import com.pabirul.digisewa.data.model.PincodeResponseItem
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

class PincodeRepository {
    private val retrofit = Retrofit.Builder()
        .baseUrl("https://api.postalpincode.in/")
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    private val service = retrofit.create(PincodeService::class.java)

    suspend fun getPincodeDetails(pincode: String): Result<List<PincodeResponseItem>> {
        return try {
            val response = service.getPincodeDetails(pincode)
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
