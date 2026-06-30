package com.pabirul.digisewa.ui.store

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.pabirul.digisewa.OrderStatus
import com.pabirul.digisewa.OrderWithDetails
import com.pabirul.digisewa.Store
import com.pabirul.digisewa.data.repository.StoreRepository
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ShopkeeperOrdersScreen(
    store: Store,
    onBack: () -> Unit
) {
    val repository = remember { StoreRepository() }
    val scope = rememberCoroutineScope()
    var orders by remember { mutableStateOf<List<OrderWithDetails>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }

    fun loadOrders() {
        scope.launch {
            isLoading = true
            orders = repository.getOrdersForStore(store.id!!)
            isLoading = false
        }
    }

    LaunchedEffect(store.id) {
        loadOrders()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Product Orders", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { loadOrders() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                }
            )
        }
    ) { padding ->
        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else if (orders.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.ShoppingBag, contentDescription = null, size = 64.dp, tint = MaterialTheme.colorScheme.outline)
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("No orders received yet.", color = MaterialTheme.colorScheme.outline)
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                items(orders) { order ->
                    ShopOrderCard(
                        order = order,
                        onStatusChange = { newStatus ->
                            scope.launch {
                                repository.updateOrderStatus(order.id, newStatus)
                                loadOrders()
                            }
                        }
                    )
                }
            }
        }
    }
}

@Composable
fun ShopOrderCard(
    order: OrderWithDetails,
    onStatusChange: (OrderStatus) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Column {
                    Text(text = "Customer: ${order.customer?.fullName ?: "Unknown"}", fontWeight = FontWeight.Bold)
                    Text(text = "Order ID: ${order.id.take(8)}...", style = MaterialTheme.typography.labelSmall)
                }
                StatusChip(order.status)
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            HorizontalDivider()
            Spacer(modifier = Modifier.height(12.dp))
            
            Text(text = "Items:", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.SemiBold)
            order.items.forEach { item ->
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(text = "${item.quantity}x ${item.product?.title ?: "Unknown Product"}", style = MaterialTheme.typography.bodySmall)
                    Text(text = "₹${item.priceAtOrder * item.quantity}", style = MaterialTheme.typography.bodySmall)
                }
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            HorizontalDivider()
            Spacer(modifier = Modifier.height(12.dp))
            
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(text = "Total Amount", fontWeight = FontWeight.Bold)
                Text(text = "₹${order.totalAmount}", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            Text(text = "Delivery Address:", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.outline)
            Text(text = order.deliveryAddress ?: "No address provided", style = MaterialTheme.typography.bodySmall)
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Action Buttons based on status
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                when (order.status) {
                    OrderStatus.PLACED -> {
                        TextButton(onClick = { onStatusChange(OrderStatus.CANCELLED) }, colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error)) {
                            Text("Reject")
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Button(onClick = { onStatusChange(OrderStatus.CONFIRMED) }) {
                            Text("Accept")
                        }
                    }
                    OrderStatus.CONFIRMED -> {
                        Button(onClick = { onStatusChange(OrderStatus.OUT_FOR_DELIVERY) }) {
                            Text("Out for Delivery")
                        }
                    }
                    OrderStatus.OUT_FOR_DELIVERY -> {
                        Button(onClick = { onStatusChange(OrderStatus.DELIVERED) }) {
                            Text("Mark Delivered")
                        }
                    }
                    else -> {}
                }
            }
        }
    }
}

@Composable
fun StatusChip(status: OrderStatus) {
    val color = when (status) {
        OrderStatus.PLACED -> Color.Blue
        OrderStatus.CONFIRMED -> Color(0xFF4CAF50)
        OrderStatus.OUT_FOR_DELIVERY -> Color(0xFFFF9800)
        OrderStatus.DELIVERED -> Color.Gray
        OrderStatus.CANCELLED -> Color.Red
    }
    
    Surface(
        color = color.copy(alpha = 0.1f),
        shape = RoundedCornerShape(8.dp)
    ) {
        Text(
            text = status.name,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            style = MaterialTheme.typography.labelSmall.copy(color = color, fontWeight = FontWeight.Bold)
        )
    }
}

@Composable
private fun Icon(imageVector: androidx.compose.ui.graphics.vector.ImageVector, contentDescription: String?, size: androidx.compose.ui.unit.Dp, tint: Color) {
    androidx.compose.material3.Icon(
        imageVector = imageVector,
        contentDescription = contentDescription,
        modifier = Modifier.size(size),
        tint = tint
    )
}
