package com.pabirul.digisewa.ui.store

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pabirul.digisewa.Order
import com.pabirul.digisewa.OrderItem
import com.pabirul.digisewa.Product
import com.pabirul.digisewa.data.repository.StoreRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch

data class CartItem(
    val product: Product,
    val quantity: Int = 1
)

sealed class CheckoutState {
    object Idle : CheckoutState()
    object Loading : CheckoutState()
    data class Success(val orderId: String) : CheckoutState()
    data class Error(val message: String) : CheckoutState()
}

class CartViewModel(private val repository: StoreRepository = StoreRepository()) : ViewModel() {
    private val _cartItems = MutableStateFlow<Map<String, CartItem>>(emptyMap())
    val cartItems = _cartItems.asStateFlow()

    private val _checkoutState = MutableStateFlow<CheckoutState>(CheckoutState.Idle)
    val checkoutState = _checkoutState.asStateFlow()

    val totalAmount: Int
        get() = _cartItems.value.values.sumOf { (it.product.price ?: 0) * it.quantity }

    val itemCount = _cartItems.map { it.values.sumOf { item -> item.quantity } }

    fun addToCart(product: Product) {
        val current = _cartItems.value.toMutableMap()
        val productId = product.id!!
        if (current.containsKey(productId)) {
            current[productId] = current[productId]!!.copy(quantity = current[productId]!!.quantity + 1)
        } else {
            current[productId] = CartItem(product)
        }
        _cartItems.value = current
    }

    fun removeFromCart(productId: String) {
        val current = _cartItems.value.toMutableMap()
        if (current.containsKey(productId)) {
            val item = current[productId]!!
            if (item.quantity > 1) {
                current[productId] = item.copy(quantity = item.quantity - 1)
            } else {
                current.remove(productId)
            }
        }
        _cartItems.value = current
    }

    fun clearCart() {
        _cartItems.value = emptyMap()
    }

    fun placeOrder(customerId: String, address: String?, lat: Double?, lng: Double?) {
        val items = _cartItems.value.values.toList()
        if (items.isEmpty()) return

        val storeId = items.first().product.storeId!!
        
        viewModelScope.launch {
            _checkoutState.value = CheckoutState.Loading
            
            val order = Order(
                customerId = customerId,
                storeId = storeId,
                totalAmount = totalAmount,
                deliveryAddress = address,
                lat = lat,
                lng = lng
            )
            
            val orderItems = items.map { 
                OrderItem(
                    orderId = "", // Will be set in repository
                    productId = it.product.id!!,
                    quantity = it.quantity,
                    priceAtOrder = it.product.price ?: 0
                )
            }
            
            val result = repository.placeOrder(order, orderItems)
            result.onSuccess {
                _checkoutState.value = CheckoutState.Success(it)
                clearCart()
            }.onFailure {
                _checkoutState.value = CheckoutState.Error(it.message ?: "Failed to place order")
            }
        }
    }

    fun resetCheckoutState() {
        _checkoutState.value = CheckoutState.Idle
    }
}
