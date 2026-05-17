package com.pabirul.digisewa.ui.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pabirul.digisewa.Category
import com.pabirul.digisewa.Profile
import com.pabirul.digisewa.ProviderDetails
import com.pabirul.digisewa.data.repository.ProfileRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class ProfileSetupState {
    object Idle : ProfileSetupState()
    object Loading : ProfileSetupState()
    object Success : ProfileSetupState()
    data class Error(val message: String) : ProfileSetupState()
}

class ProfileViewModel(private val repository: ProfileRepository = ProfileRepository()) : ViewModel() {
    private val _setupState = MutableStateFlow<ProfileSetupState>(ProfileSetupState.Idle)
    val setupState = _setupState.asStateFlow()

    private val _categories = MutableStateFlow<List<Category>>(emptyList())
    val categories = _categories.asStateFlow()

    fun resetState() {
        _setupState.value = ProfileSetupState.Idle
    }

    init {
        loadCategories()
    }

    private fun loadCategories() {
        viewModelScope.launch {
            _categories.value = repository.getCategories()
        }
    }

    fun completeProfile(
        profile: Profile,
        providerDetails: ProviderDetails? = null,
        avatarBytes: ByteArray? = null
    ) {
        viewModelScope.launch {
            _setupState.value = ProfileSetupState.Loading
            
            var currentAvatarUrl = profile.avatarUrl
            
            if (avatarBytes != null) {
                val uploadResult = repository.uploadAvatar(profile.id, avatarBytes)
                uploadResult.onSuccess {
                    currentAvatarUrl = it
                }.onFailure {
                    _setupState.value = ProfileSetupState.Error("Avatar upload failed: ${it.message}")
                    return@launch
                }
            }
            
            val updatedProfile = profile.copy(avatarUrl = currentAvatarUrl)
            val profileResult = repository.updateProfile(updatedProfile)
            
            if (profileResult.isFailure) {
                _setupState.value = ProfileSetupState.Error("Profile update failed: ${profileResult.exceptionOrNull()?.message}")
                return@launch
            }
            
            if (providerDetails != null) {
                val providerResult = repository.updateProviderDetails(providerDetails)
                if (providerResult.isFailure) {
                    _setupState.value = ProfileSetupState.Error("Provider details update failed: ${providerResult.exceptionOrNull()?.message}")
                    return@launch
                }
            }
            
            _setupState.value = ProfileSetupState.Success
        }
    }

    fun completeOnboarding(userId: String) {
        viewModelScope.launch {
            repository.completeOnboarding(userId)
        }
    }
}
