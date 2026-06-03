package com.pabirul.digisewa.data.repository

import com.pabirul.digisewa.Supabase
import com.pabirul.digisewa.data.model.OnboardingLead
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.builtin.Email
import android.util.Log
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

class AgentRepository {
    private val postgrest = Supabase.client.postgrest
    private val auth = Supabase.client.auth

    suspend fun onboardProvider(lead: OnboardingLead): Result<Unit> {
        return try {
            // 1. Check if email already exists in our leads tracking
            // This is handled by the UNIQUE constraint in DB, but we can catch it specifically
            
            // 2. We use 'signUpWith(Email)' to create the account. 
            // The provider will receive a confirmation email.
            auth.signUpWith(Email) {
                email = lead.providerEmail
                // Set a random password that the user will change/override
                password = "TEMP_" + java.util.UUID.randomUUID().toString().substring(0, 8)
                data = buildJsonObject {
                    put("full_name", lead.providerName)
                    put("role", "provider")
                    put("onboarded_by", lead.agentId)
                    put("assigned_category", lead.categoryId)
                }
            }
            
            // 3. Create the lead record for tracking only after successful account creation
            postgrest.from("onboarding_leads").insert(lead)

            Result.success(Unit)
        } catch (e: Exception) {
            val errorMessage = when {
                e.message?.contains("already registered", ignoreCase = true) == true -> 
                    "This email is already registered as a user in DigiSewa."
                e.message?.contains("unique_provider_email", ignoreCase = true) == true ->
                    "This email has already been onboarded by another agent."
                else -> e.message ?: "Error onboarding provider"
            }
            Log.e("AgentRepo", "Error onboarding provider: $errorMessage", e)
            Result.failure(Exception(errorMessage))
        }
    }

    suspend fun getMyLeads(agentId: String): List<OnboardingLead> {
        return try {
            postgrest.from("onboarding_leads").select {
                filter {
                    eq("agent_id", agentId)
                }
            }.decodeList<OnboardingLead>()
        } catch (e: Exception) {
            Log.e("AgentRepo", "Error fetching leads", e)
            emptyList()
        }
    }
}
