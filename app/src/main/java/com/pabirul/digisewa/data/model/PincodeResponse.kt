package com.pabirul.digisewa.data.model

import com.google.gson.annotations.SerializedName

data class PincodeResponseItem(
    @SerializedName("Message") val message: String,
    @SerializedName("Status") val status: String,
    @SerializedName("PostOffice") val postOffice: List<PostOffice>?
)

data class PostOffice(
    @SerializedName("Name") val name: String,
    @SerializedName("Description") val description: String?,
    @SerializedName("BranchType") val branchType: String,
    @SerializedName("DeliveryStatus") val deliveryStatus: String,
    @SerializedName("Circle") val circle: String,
    @SerializedName("District") val district: String,
    @SerializedName("Division") val division: String,
    @SerializedName("Region") val region: String,
    @SerializedName("Block") val block: String,
    @SerializedName("State") val state: String,
    @SerializedName("Country") val country: String,
    @SerializedName("Pincode") val pincode: String
)
