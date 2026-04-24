package com.pabirul.digisewa.ui.service

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pabirul.digisewa.Service
import com.pabirul.digisewa.ServiceGallery
import com.pabirul.digisewa.data.repository.ServiceRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class ServiceState {
    object Idle : ServiceState()
    object Loading : ServiceState()
    object Success : ServiceState()
    data class Error(val message: String) : ServiceState()
}

class ServiceViewModel(private val repository: ServiceRepository = ServiceRepository()) : ViewModel() {
    private val _services = MutableStateFlow<List<Service>>(emptyList())
    val services = _services.asStateFlow()

    private val _gallery = MutableStateFlow<List<ServiceGallery>>(emptyList())
    val gallery = _gallery.asStateFlow()

    private val _serviceState = MutableStateFlow<ServiceState>(ServiceState.Idle)
    val serviceState = _serviceState.asStateFlow()

    fun resetState() {
        _serviceState.value = ServiceState.Idle
        _gallery.value = emptyList()
    }

    fun loadServices(providerId: String) {
        viewModelScope.launch {
            _serviceState.value = ServiceState.Loading
            val result = repository.getServicesByProvider(providerId)
            _services.value = result
            _serviceState.value = ServiceState.Success
        }
    }

    fun loadGallery(serviceId: String) {
        viewModelScope.launch {
            _gallery.value = repository.getGalleryByService(serviceId)
        }
    }

    fun saveService(
        service: Service,
        mainImageBytes: ByteArray?,
        galleryImages: List<ByteArray>
    ) {
        viewModelScope.launch {
            _serviceState.value = ServiceState.Loading
            
            val isUpdating = service.id != null
            var finalService = service
            
            // 1. Create or Update the service record
            val serviceResult = if (isUpdating) {
                repository.updateService(service).map { service }
            } else {
                repository.createService(service)
            }
            
            serviceResult.onSuccess { createdService ->
                val serviceId = createdService.id!!
                var mainImageUrl = createdService.mainImageUrl
                
                // 2. Upload main image if provided
                if (mainImageBytes != null) {
                    val uploadResult = repository.uploadServiceImage(
                        service.providerId, serviceId, "main.jpg", mainImageBytes
                    )
                    uploadResult.onSuccess {
                        mainImageUrl = it
                        // Update service with the new image URL
                        repository.updateService(createdService.copy(mainImageUrl = mainImageUrl))
                    }
                }
                
                // 3. Upload gallery images
                galleryImages.forEachIndexed { index, bytes ->
                    val uploadResult = repository.uploadServiceImage(
                        service.providerId, serviceId, "gallery_$index.jpg", bytes
                    )
                    uploadResult.onSuccess {
                        repository.addGalleryImage(serviceId, it)
                    }
                }
                
                _serviceState.value = ServiceState.Success
                loadServices(service.providerId)
            }.onFailure {
                _serviceState.value = ServiceState.Error(it.message ?: "Failed to save service")
            }
        }
    }

    fun deleteService(serviceId: String, providerId: String) {
        viewModelScope.launch {
            _serviceState.value = ServiceState.Loading
            val result = repository.deleteService(serviceId)
            result.onSuccess {
                _serviceState.value = ServiceState.Success
                loadServices(providerId)
            }.onFailure {
                _serviceState.value = ServiceState.Error(it.message ?: "Failed to delete service")
            }
        }
    }
}
