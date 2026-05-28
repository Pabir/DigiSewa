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
                // The new API structure returns the object directly
                if (response.offices.isNotEmpty()) {
                    _uiState.value = PincodeUiState.Success(
                        state = response.state,
                        district = response.district,
                        postOffices = response.offices
                    )
                } else {
                    _uiState.value = PincodeUiState.Error("No details found for this PIN code")
                }
            }.onFailure {
                android.util.Log.e("PincodeVM", "Fetch failed", it)
                _uiState.value = PincodeUiState.Error("Invalid PIN or Network Error")
            }
        }
    }

    fun resetState() {
        _uiState.value = PincodeUiState.Idle
    }
}
