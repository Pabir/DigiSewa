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

    fun setError(message: String) {
        _serviceState.value = ServiceState.Error(message)
    }

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
            android.util.Log.d("ServiceVM", "Starting saveService for: ${service.title}")
            
            val isUpdating = service.id != null
            val providerId = service.providerId ?: ""
            
            // 1. Create or Update the service record
            val serviceResult = if (isUpdating) {
                android.util.Log.d("ServiceVM", "Step 1: Updating existing service")
                repository.updateService(service).map { service }
            } else {
                android.util.Log.d("ServiceVM", "Step 1: Creating new service")
                repository.createService(service)
            }
            
            serviceResult.onSuccess { createdService ->
                android.util.Log.d("ServiceVM", "Step 1 Success: Service ID is ${createdService.id}")
                val serviceId = createdService.id!!
                var mainImageUrl = createdService.mainImageUrl
                
                // 2. Upload main image if provided
                if (mainImageBytes != null) {
                    android.util.Log.d("ServiceVM", "Step 2: Uploading main image")
                    val uploadResult = repository.uploadServiceImage(
                        providerId, serviceId, "main_${System.currentTimeMillis()}.jpg", mainImageBytes
                    )
                    uploadResult.onSuccess {
                        android.util.Log.d("ServiceVM", "Step 2 Success: URL $it")
                        mainImageUrl = it
                        // Update service with the new image URL
                        val updateResult = repository.updateService(createdService.copy(mainImageUrl = mainImageUrl))
                        if (updateResult.isFailure) {
                            android.util.Log.e("ServiceVM", "Step 2 Error: Failed to update service with URL", updateResult.exceptionOrNull())
                        }
                    }.onFailure {
                        android.util.Log.e("ServiceVM", "Step 2 Error: Image upload failed", it)
                    }
                }
                
                // 3. Upload gallery images
                if (galleryImages.isNotEmpty()) {
                    android.util.Log.d("ServiceVM", "Step 3: Uploading ${galleryImages.size} gallery images")
                    galleryImages.forEachIndexed { index, bytes ->
                        val uploadResult = repository.uploadServiceImage(
                            providerId, serviceId, "gallery_${index}_${System.currentTimeMillis()}.jpg", bytes
                        )
                        uploadResult.onSuccess {
                            repository.addGalleryImage(serviceId, it)
                        }
                    }
                }
                
                android.util.Log.d("ServiceVM", "All Steps Completed. Refreshing list.")
                _serviceState.value = ServiceState.Success
                loadServices(providerId)
            }.onFailure {
                android.util.Log.e("ServiceVM", "Step 1 Error: Base service creation failed", it)
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
