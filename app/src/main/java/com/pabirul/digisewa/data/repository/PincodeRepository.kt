package com.pabirul.digisewa.data.repository

import com.pabirul.digisewa.data.api.PincodeService
import com.pabirul.digisewa.data.model.PincodeResponse
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

class PincodeRepository {
    
    private val retrofit = Retrofit.Builder()
        .baseUrl("https://aniket-thapa.github.io/india-pincode-api/")
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    private val service = retrofit.create(PincodeService::class.java)

    suspend fun getPincodeDetails(pincode: String): Result<PincodeResponse> {
        return try {
            val response = service.getPincodeDetails(pincode)
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
