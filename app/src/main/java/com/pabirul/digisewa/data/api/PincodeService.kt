package com.pabirul.digisewa.data.api

import com.pabirul.digisewa.data.model.PincodeResponse
import retrofit2.http.GET
import retrofit2.http.Path

interface PincodeService {
    // Using Aniket Thapa's India Pincode API hosted on GitHub
    @GET("pincodes/{pincode}.json")
    suspend fun getPincodeDetails(@Path("pincode") pincode: String): PincodeResponse
}
