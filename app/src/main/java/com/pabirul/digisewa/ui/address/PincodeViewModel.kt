package com.pabirul.digisewa.ui.address

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pabirul.digisewa.data.model.PostOffice
import com.pabirul.digisewa.data.repository.PincodeRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class PincodeUiState {
    object Idle : PincodeUiState()
    object Loading : PincodeUiState()
    data class Success(
        val state: String,
        val district: String,
        val postOffices: List<PostOffice>
    ) : PincodeUiState()
    data class Error(val message: String) : PincodeUiState()
}

class PincodeViewModel(private val repository: PincodeRepository = PincodeRepository()) : ViewModel() {
    private val _uiState = MutableStateFlow<PincodeUiState>(PincodeUiState.Idle)
    val uiState = _uiState.asStateFlow()

    fun fetchPincodeDetails(pincode: String) {
        if (pincode.length != 6) return

        viewModelScope.launch {
            _uiState.value = PincodeUiState.Loading
            val result = repository.getPincodeDetails(pincode)
            result.onSuccess { response ->
                if (response.isNotEmpty() && response[0].status == "Success") {
                    val postOffices = response[0].postOffice ?: emptyList()
                    if (postOffices.isNotEmpty()) {
                        _uiState.value = PincodeUiState.Success(
                            state = postOffices[0].state,
                            district = postOffices[0].district,
                            postOffices = postOffices
                        )
                    } else {
                        _uiState.value = PincodeUiState.Error("No post office found for this PIN code")
                    }
                } else {
                    _uiState.value = PincodeUiState.Error(response.getOrNull(0)?.message ?: "Invalid PIN code")
                }
            }.onFailure {
                _uiState.value = PincodeUiState.Error(it.message ?: "Network failure")
            }
        }
    }

    fun resetState() {
        _uiState.value = PincodeUiState.Idle
    }
}
