package com.pabirul.digisewa.data.repository

import com.pabirul.digisewa.Profile
import com.pabirul.digisewa.ProfileWithDetails
import com.pabirul.digisewa.Supabase
import com.pabirul.digisewa.UserRole
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.postgrest.postgrest

class AuthRepository {
    private val auth = Supabase.client.auth
    private val postgrest = Supabase.client.postgrest

    suspend fun signUp(email: String, password: String, fullName: String, role: UserRole): Result<Unit> {
        return try {
            auth.signUpWith(Email) {
                this.email = email
                this.password = password
            }
            
            val userId = auth.currentUserOrNull()?.id ?: return Result.failure(Exception("User ID not found after signup"))
            
            val profile = Profile(
                id = userId,
                fullName = fullName,
                role = role
            )
            
            postgrest.from("profiles").insert(profile)
            Result.success(Unit)
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }

    suspend fun signIn(email: String, password: String): Result<Unit> {
        return try {
            auth.signInWith(Email) {
                this.email = email
                this.password = password
            }
            Result.success(Unit)
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }

    suspend fun signOut(): Result<Unit> {
        return try {
            auth.signOut()
            Result.success(Unit)
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }

    suspend fun getCurrentProfile(): Profile? {
        val userId = auth.currentUserOrNull()?.id ?: return null
        return try {
            postgrest.from("profiles").select {
                filter {
                    eq("id", userId)
                }
            }.decodeSingle<ProfileWithDetails>().let {
                Profile(
                    id = it.id,
                    fullName = it.fullName,
                    phoneNumber = it.phoneNumber,
                    role = it.role,
                    avatarUrl = it.avatarUrl,
                    gender = it.gender,
                    address = it.address,
                    city = it.city,
                    createdAt = it.createdAt
                )
            }
        } catch (e: Exception) {
            null
        }
    }
}
