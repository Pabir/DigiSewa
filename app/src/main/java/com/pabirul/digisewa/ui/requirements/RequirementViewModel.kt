package com.pabirul.digisewa.ui.requirements

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pabirul.digisewa.*
import com.pabirul.digisewa.data.repository.RequirementRepository
import com.pabirul.digisewa.data.repository.ServiceRepository
import com.pabirul.digisewa.data.repository.BookingRepository
import com.pabirul.digisewa.data.repository.BookingSlot
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class RequirementState {
    object Idle : RequirementState()
    object Loading : RequirementState()
    object Success : RequirementState()
    data class Error(val message: String) : RequirementState()
}

class RequirementViewModel(
    private val repository: RequirementRepository = RequirementRepository(),
    private val serviceRepository: ServiceRepository = ServiceRepository()
) : ViewModel() {
    private val _state = MutableStateFlow<RequirementState>(RequirementState.Idle)
    val state = _state.asStateFlow()

    private val _myRequirements = MutableStateFlow<List<RequirementWithDetails>>(emptyList())
    val myRequirements = _myRequirements.asStateFlow()

    private val _leads = MutableStateFlow<List<RequirementWithDetails>>(emptyList())
    val leads = _leads.asStateFlow()

    private val _providerServices = MutableStateFlow<List<Service>>(emptyList())
    val providerServices = _providerServices.asStateFlow()

    fun resetState() {
        _state.value = RequirementState.Idle
    }

    fun setError(message: String) {
        _state.value = RequirementState.Error(message)
    }
    
    fun loadProviderServices(providerId: String) {
        viewModelScope.launch {
            _providerServices.value = serviceRepository.getServicesByProvider(providerId)
        }
    }

    fun postRequirement(requirement: Requirement, photos: List<ByteArray>) {
        viewModelScope.launch {
            _state.value = RequirementState.Loading
            val result = repository.createRequirement(requirement, photos)
            result.onSuccess {
                _state.value = RequirementState.Success
                loadMyRequirements(requirement.customerId)
            }.onFailure {
                _state.value = RequirementState.Error(it.message ?: "Failed to post requirement")
            }
        }
    }

    fun loadMyRequirements(customerId: String) {
        viewModelScope.launch {
            _state.value = RequirementState.Loading
            _myRequirements.value = repository.getMyRequirements(customerId)
            _state.value = RequirementState.Success
        }
    }

    fun loadLeads(categoryId: Int? = null) {
        viewModelScope.launch {
            _state.value = RequirementState.Loading
            _leads.value = repository.getOpenRequirements(categoryId)
            _state.value = RequirementState.Success
        }
    }

    fun submitResponse(response: RequirementResponse) {
        viewModelScope.launch {
            _state.value = RequirementState.Loading
            
            // Optional: Check for sandwich conflict before bidding
            if (response.scheduledAt != null) {
                val bookingRepo = BookingRepository()
                val date = response.scheduledAt.split("T")[0]
                val unavailable = bookingRepo.getUnavailableSlots(response.providerId, date)
                
                // Construct a dummy booking to use existing logic if possible, 
                // but getUnavailableSlots returns slots, we need to check manual overlap.
                // For now, let's keep it simple and just submit. 
                // The hard check happens on Acceptance.
            }

            val result = repository.submitResponse(response)
            result.onSuccess {
                _state.value = RequirementState.Success
            }.onFailure {
                _state.value = RequirementState.Error(it.message ?: "Failed to submit response")
            }
        }
    }

    fun acceptResponse(requirementId: String, responseId: String, customerId: String) {
        viewModelScope.launch {
            _state.value = RequirementState.Loading
            val result = repository.acceptResponse(requirementId, responseId)
            result.onSuccess {
                _state.value = RequirementState.Success
                loadMyRequirements(customerId)
            }.onFailure {
                _state.value = RequirementState.Error(it.message ?: "Failed to accept response")
            }
        }
    }
}
