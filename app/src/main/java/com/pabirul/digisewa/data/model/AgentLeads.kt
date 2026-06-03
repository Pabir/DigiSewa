package com.pabirul.digisewa.data.model

import kotlinx.serialization.Serializable
import kotlinx.serialization.SerialName

@Serializable
data class OnboardingLead(
    val id: String? = null,
    @SerialName("agent_id") val agentId: String,
    @SerialName("provider_email") val providerEmail: String,
    @SerialName("provider_name") val providerName: String,
    @SerialName("provider_phone") val providerPhone: String,
    @SerialName("category_id") val categoryId: Int,
    val status: String = "pending",
    @SerialName("created_at") val createdAt: String? = null
)
