package com.pabirul.digisewa.data.model

import com.google.gson.annotations.SerializedName

data class PincodeResponse(
    @SerializedName("state") val state: String,
    @SerializedName("district") val district: String,
    @SerializedName("offices") val offices: List<PostOffice>
)

data class PostOffice(
    @SerializedName("officeName") val officeName: String,
    @SerializedName("deliveryStatus") val deliveryStatus: String?,
    @SerializedName("latitude") val latitude: Double?,
    @SerializedName("longitude") val longitude: Double?
)
