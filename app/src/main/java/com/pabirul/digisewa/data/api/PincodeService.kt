package com.pabirul.digisewa.data.api

import com.pabirul.digisewa.data.model.PincodeResponseItem
import retrofit2.http.GET
import retrofit2.http.Path

interface PincodeService {
    @GET("pincode/{pincode}")
    suspend fun getPincodeDetails(@Path("pincode") pincode: String): List<PincodeResponseItem>
}
