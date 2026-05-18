package com.pabirul.digisewa.data.repository

import com.pabirul.digisewa.Profile
import com.pabirul.digisewa.Supabase
import com.pabirul.digisewa.UserRole
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.auth.OtpType
import io.github.jan.supabase.auth.providers.Google
import io.github.jan.supabase.auth.providers.builtin.IDToken
import io.github.jan.supabase.postgrest.postgrest
import android.util.Log

class AuthRepository {
    private val auth = Supabase.client.auth
    private val postgrest = Supabase.client.postgrest

    suspend fun signInWithGoogle(idToken: String, role: UserRole, nonce: String? = null): Result<Unit> {
        return try {
            auth.signInWith(IDToken) {
                this.idToken = idToken
                this.nonce = nonce
                provider = Google
            }
            
            val user = auth.currentUserOrNull() ?: return Result.failure(Exception("Google Sign-in failed: No user session"))
            
            // Check if profile exists, if not create it
            val profile = getCurrentProfile()
            if (profile == null) {
                val profileData = mapOf(
                    "id" to user.id,
                    "full_name" to (user.userMetadata?.get("full_name")?.toString() ?: "Google User"),
                    "role" to role.name.lowercase()
                )
                postgrest.from("profiles").upsert(profileData)
            }
            
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e("AuthRepo", "Google SignIn Error: ${e.message}", e)
            Result.failure(e)
        }
    }

    suspend fun signUp(email: String, password: String, fullName: String, role: UserRole): Result<Unit> {
        return try {
            val response = auth.signUpWith(Email) {
                this.email = email
                this.password = password
            }
            
            // In Supabase-kt v3, signUpWith returns an User? or AuthResponse
            // Let's get the ID safely from the new user response ONLY
            val userId = response?.id
                ?: return Result.failure(Exception("Signup successful but User ID not yet available. Please check your email for OTP."))
            
            val profileData = mapOf(
                "id" to userId,
                "full_name" to fullName,
                "role" to role.name.lowercase()
            )
            
            // Use upsert to be safe in case user exists but unconfirmed
            postgrest.from("profiles").upsert(profileData)
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e("AuthRepo", "SignUp Error: ${e.message}", e)
            Result.failure(e)
        }
    }

    suspend fun verifyEmailOtp(email: String, token: String): Result<Unit> {
        return try {
            auth.verifyEmailOtp(
                type = OtpType.Email.SIGNUP,
                email = email,
                token = token
            )
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e("AuthRepo", "OTP Verification Error: ${e.message}", e)
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
            Log.e("AuthRepo", "SignIn Error", e)
            Result.failure(e)
        }
    }

    suspend fun signOut(): Result<Unit> {
        return try {
            auth.signOut()
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e("AuthRepo", "SignOut Error", e)
            Result.failure(e)
        }
    }

    suspend fun getCurrentProfile(): Profile? {
        val userId = auth.currentUserOrNull()?.id ?: return null
        return try {
            val columns = io.github.jan.supabase.postgrest.query.Columns.raw("*, provider_details(*)")
            postgrest.from("profiles").select(columns) {
                filter {
                    eq("id", userId)
                }
            }.decodeSingle<Profile>()
        } catch (e: Exception) {
            Log.e("AuthRepo", "GetProfile Error", e)
            null
        }
    }
}
