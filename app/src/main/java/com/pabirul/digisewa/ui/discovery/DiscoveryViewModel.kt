package com.pabirul.digisewa.ui.discovery

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pabirul.digisewa.Category
import com.pabirul.digisewa.ServiceGallery
import com.pabirul.digisewa.ServiceWithProvider
import com.pabirul.digisewa.data.repository.DiscoveryRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class DiscoveryState {
    object Idle : DiscoveryState()
    object Loading : DiscoveryState()
    object Success : DiscoveryState()
    data class Error(val message: String) : DiscoveryState()
}

class DiscoveryViewModel(private val repository: DiscoveryRepository = DiscoveryRepository()) : ViewModel() {
    private val _categories = MutableStateFlow<List<Category>>(emptyList())
    val categories = _categories.asStateFlow()

    private val _services = MutableStateFlow<List<ServiceWithProvider>>(emptyList())
    val services = _services.asStateFlow()

    private val _gallery = MutableStateFlow<List<ServiceGallery>>(emptyList())
    val gallery = _gallery.asStateFlow()

    private val _reviews = MutableStateFlow<List<com.pabirul.digisewa.Review>>(emptyList())
    val reviews = _reviews.asStateFlow()

    private val _state = MutableStateFlow<DiscoveryState>(DiscoveryState.Idle)
    val state = _state.asStateFlow()

    init {
        loadCategories()
    }

    fun loadCategories() {
        viewModelScope.launch {
            _state.value = DiscoveryState.Loading
            _categories.value = repository.getCategories()
            _state.value = DiscoveryState.Success
        }
    }

    fun loadServices(categoryId: Int) {
        viewModelScope.launch {
            _state.value = DiscoveryState.Loading
            val result = repository.getServicesByCategory(categoryId)
            _services.value = result
            if (result.isEmpty()) {
                _state.value = DiscoveryState.Error("No services found for category $categoryId")
            } else {
                _state.value = DiscoveryState.Success
            }
        }
    }

    fun loadServiceDetails(serviceId: String) {
        viewModelScope.launch {
            _state.value = DiscoveryState.Loading
            _gallery.value = repository.getServiceGallery(serviceId)
            _reviews.value = repository.getServiceReviews(serviceId)
            _state.value = DiscoveryState.Success
        }
    }
}
