package com.pabirul.digisewa.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pabirul.digisewa.Profile
import com.pabirul.digisewa.UserRole
import com.pabirul.digisewa.data.repository.AuthRepository
import android.content.Context
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetCredentialResponse
import androidx.credentials.exceptions.GetCredentialException
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.security.MessageDigest
import java.util.UUID

sealed class AuthState {
    object Idle : AuthState()
    object Loading : AuthState()
    data class Authenticated(val profile: Profile) : AuthState()
    data class Error(val message: String) : AuthState()
    data class VerificationSent(val email: String) : AuthState()
    object Unauthenticated : AuthState()
}

class AuthViewModel(private val repository: AuthRepository = AuthRepository()) : ViewModel() {
    private val _authState = MutableStateFlow<AuthState>(AuthState.Idle)
    val authState = _authState.asStateFlow()

    private val WEB_CLIENT_ID = "593490873040-2ea33pv6euvgn6kafsag0poknomtbb3c.apps.googleusercontent.com"

    init {
        checkSession()
    }

    private fun createNonce(): String {
        val rawNonce = UUID.randomUUID().toString()
        val bytes = rawNonce.toByteArray()
        val md = MessageDigest.getInstance("SHA-256")
        val digest = md.digest(bytes)

        return digest.fold("") { str, it ->
            str + "%02x".format(it)
        }
    }

    fun signInWithGoogle(context: Context, role: UserRole) {
        val credentialManager = CredentialManager.create(context)
        
        val hashedNonce = createNonce()
        
        val googleIdOption = GetGoogleIdOption.Builder()
            .setServerClientId(WEB_CLIENT_ID)
            .setNonce(hashedNonce)
            .setAutoSelectEnabled(false)
            .setFilterByAuthorizedAccounts(false)
            .build()

        val request = GetCredentialRequest.Builder()
            .addCredentialOption(googleIdOption)
            .build()

        viewModelScope.launch {
            try {
                _authState.value = AuthState.Loading
                val result = credentialManager.getCredential(context = context, request = request)
                handleGoogleSignIn(result, role, hashedNonce)
            } catch (e: GetCredentialException) {
                android.util.Log.e("AuthViewModel", "Google Sign-In failed with exception: ${e.type}", e)
                _authState.value = AuthState.Error(e.message ?: "Google Sign-In failed")
            } catch (e: Exception) {
                android.util.Log.e("AuthViewModel", "Unexpected error during Google Sign-In", e)
                _authState.value = AuthState.Error(e.message ?: "An unexpected error occurred")
            }
        }
    }

    private suspend fun handleGoogleSignIn(result: GetCredentialResponse, role: UserRole, nonce: String) {
        val credential = result.credential
        
        try {
            // More robust parsing using createFrom as shown in the example
            val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.data)
            val idToken = googleIdTokenCredential.idToken
            
            android.util.Log.d("AuthViewModel", "ID Token obtained, signing in with Supabase...")
            val loginResult = repository.signInWithGoogle(idToken, role, nonce)
            loginResult.onSuccess {
                android.util.Log.d("AuthViewModel", "Supabase sign-in successful")
                checkSession()
            }.onFailure {
                android.util.Log.e("AuthViewModel", "Supabase sign-in failed: ${it.message}", it)
                _authState.value = AuthState.Error(it.message ?: "Sign-in with Google failed")
            }
        } catch (e: Exception) {
            android.util.Log.e("AuthViewModel", "Error parsing Google credential", e)
            _authState.value = AuthState.Error("Error parsing Google credential: ${e.message}")
        }
    }

    private fun checkSession() {
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            val profile = repository.getCurrentProfile()
            if (profile != null) {
                _authState.value = AuthState.Authenticated(profile)
            } else {
                _authState.value = AuthState.Unauthenticated
            }
        }
    }

    fun signUp(email: String, password: String, fullName: String, role: UserRole) {
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            val result = repository.signUp(email, password, fullName, role)
            result.onSuccess {
                // Since email confirmation is enabled, always go to OTP screen
                _authState.value = AuthState.VerificationSent(email)
            }.onFailure {
                _authState.value = AuthState.Error(it.message ?: "Sign up failed")
            }
        }
    }

    fun signIn(email: String, password: String) {
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            val result = repository.signIn(email, password)
            result.onSuccess {
                checkSession()
            }.onFailure {
                val message = it.message ?: "Sign in failed"
                if (message.contains("Email not confirmed", ignoreCase = true)) {
                    _authState.value = AuthState.VerificationSent(email)
                } else {
                    _authState.value = AuthState.Error(message)
                }
            }
        }
    }

    fun signOut() {
        viewModelScope.launch {
            repository.signOut()
            _authState.value = AuthState.Unauthenticated
        }
    }

    fun refreshProfile() {
        checkSession()
    }

    fun verifyOtp(email: String, token: String) {
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            val result = repository.verifyEmailOtp(email, token)
            result.onSuccess {
                checkSession()
            }.onFailure {
                _authState.value = AuthState.Error(it.message ?: "OTP Verification failed")
            }
        }
    }
}
