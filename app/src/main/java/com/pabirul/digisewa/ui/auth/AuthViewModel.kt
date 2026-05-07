package com.pabirul.digisewa.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pabirul.digisewa.Profile
import com.pabirul.digisewa.UserRole
import com.pabirul.digisewa.data.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

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

    init {
        checkSession()
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
                // With email verification enabled, we won't get a profile immediately
                val profile = repository.getCurrentProfile()
                if (profile != null) {
                    _authState.value = AuthState.Authenticated(profile)
                } else {
                    _authState.value = AuthState.VerificationSent(email)
                }
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
                // Keep the VerificationSent state so user can retry, but maybe with an error
                // Actually, let's keep it simple for now
            }
        }
    }
}
