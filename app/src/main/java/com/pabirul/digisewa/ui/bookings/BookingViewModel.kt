package com.pabirul.digisewa.ui.bookings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pabirul.digisewa.Booking
import com.pabirul.digisewa.BookingStatus
import com.pabirul.digisewa.BookingWithDetails
import com.pabirul.digisewa.data.repository.BookingRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

import com.pabirul.digisewa.data.repository.BookingSlot

sealed class BookingState {
    object Idle : BookingState()
    object Loading : BookingState()
    object Success : BookingState()
    data class Error(val message: String) : BookingState()
}

class BookingViewModel(private val repository: BookingRepository = BookingRepository()) : ViewModel() {
    private val _bookings = MutableStateFlow<List<BookingWithDetails>>(emptyList())
    val bookings = _bookings.asStateFlow()

    private val _state = MutableStateFlow<BookingState>(BookingState.Idle)
    val state = _state.asStateFlow()

    private val _unavailableSlots = MutableStateFlow<List<BookingSlot>>(emptyList())
    val unavailableSlots = _unavailableSlots.asStateFlow()

    private val _loadingSlots = MutableStateFlow(false)
    val loadingSlots = _loadingSlots.asStateFlow()

    fun loadUnavailableSlots(providerId: String, date: String) {
        viewModelScope.launch {
            if (date.isEmpty()) {
                _unavailableSlots.value = emptyList()
                return@launch
            }
            _loadingSlots.value = true
            try {
                _unavailableSlots.value = repository.getUnavailableSlots(providerId, date)
            } catch (e: Exception) {
                _unavailableSlots.value = emptyList()
            } finally {
                _loadingSlots.value = false
            }
        }
    }

    fun loadBookings(userId: String, isProvider: Boolean) {
        viewModelScope.launch {
            _state.value = BookingState.Loading
            _bookings.value = repository.getBookingsForUser(userId, isProvider)
            _state.value = BookingState.Idle
        }
    }

    fun requestService(booking: Booking) {
        viewModelScope.launch {
            _state.value = BookingState.Loading
            val result = repository.createBooking(booking)
            result.onSuccess {
                _state.value = BookingState.Success
            }.onFailure {
                _state.value = BookingState.Error(it.message ?: "Failed to request service")
            }
        }
    }

    fun confirmBooking(bookingId: String, userId: String) {
        viewModelScope.launch {
            _state.value = BookingState.Loading
            val result = repository.confirmBooking(bookingId)
            result.onSuccess {
                loadBookings(userId, true)
            }.onFailure {
                _state.value = BookingState.Error(it.message ?: "Failed to confirm")
            }
        }
    }

    fun payForBooking(bookingId: String, userId: String) {
        viewModelScope.launch {
            _state.value = BookingState.Loading
            val result = repository.updateBookingStatus(bookingId, BookingStatus.PAID)
            result.onSuccess {
                loadBookings(userId, false)
            }.onFailure {
                _state.value = BookingState.Error(it.message ?: "Payment failed")
            }
        }
    }

    fun cancelBooking(booking: BookingWithDetails, userId: String) {
        viewModelScope.launch {
            _state.value = BookingState.Loading
            val result = repository.cancelBooking(
                booking.id, 
                booking.totalPrice, 
                booking.status == BookingStatus.PAID
            )
            result.onSuccess {
                loadBookings(userId, false)
            }.onFailure {
                _state.value = BookingState.Error(it.message ?: "Cancellation failed")
            }
        }
    }

    fun resetState() {
        _state.value = BookingState.Idle
    }
}
