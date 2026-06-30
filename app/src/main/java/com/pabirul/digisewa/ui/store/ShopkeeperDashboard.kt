package com.pabirul.digisewa.ui.store

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Inventory
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.ShoppingBag
import androidx.compose.material.icons.filled.Store
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.pabirul.digisewa.Product
import com.pabirul.digisewa.Profile
import com.pabirul.digisewa.Store
import com.pabirul.digisewa.data.repository.StoreRepository
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ShopkeeperDashboard(
    profile: Profile,
    onManageProducts: (Product?) -> Unit,
    onViewOrders: (Store) -> Unit,
    onEditStore: () -> Unit
) {
    val repository = remember { StoreRepository() }
    val scope = rememberCoroutineScope()
    var store by remember { mutableStateOf<Store?>(null) }
    var products by remember { mutableStateOf<List<Product>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }

    fun loadData() {
        scope.launch {
            isLoading = true
            val s = repository.getStoreByOwner(profile.id)
            store = s
            if (s != null) {
                products = repository.getProductsByStore(s.id!!)
            }
            isLoading = false
        }
    }

    LaunchedEffect(profile.id) {
        loadData()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Shopkeeper Dashboard", fontWeight = FontWeight.Bold) },
                actions = {
                    IconButton(onClick = { loadData() }) {
                        androidx.compose.material3.Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Refresh",
                            modifier = Modifier.size(24.dp),
                            tint = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            )
        },
        floatingActionButton = {
            if (store != null) {
                ExtendedFloatingActionButton(
                    onClick = { onManageProducts(null) },
                    icon = { Icon(Icons.Default.Add, contentDescription = null) },
                    text = { Text("Add Product") },
                    containerColor = MaterialTheme.colorScheme.primary
                )
            }
        }
    ) { padding ->
        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else if (store == null) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(24.dp)) {
                    Icon(Icons.Default.Store, contentDescription = null, size = 64.dp, tint = MaterialTheme.colorScheme.outline)
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("You haven't set up your store yet.", style = MaterialTheme.typography.titleMedium)
                    Spacer(modifier = Modifier.height(24.dp))
                    Button(onClick = onEditStore) {
                        Text("Setup Store Now")
                    }
                }
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(16.dp)
            ) {
                StoreStatsSection(products.size, onViewOrders = { store?.let { onViewOrders(it) } })
                
                Spacer(modifier = Modifier.height(24.dp))
                
                Text(
                    text = "My Products",
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                if (products.isEmpty()) {
                    Box(modifier = Modifier.fillMaxWidth().weight(1f), contentAlignment = Alignment.Center) {
                        Text("No products added yet.")
                    }
                } else {
                    LazyVerticalGrid(
                        columns = GridCells.Fixed(2),
                        horizontalArrangement = Arrangement.spacedBy(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        items(products) { product ->
                            ProductDashboardCard(
                                product = product, 
                                onClick = { onManageProducts(product) },
                                onToggleStock = { newValue ->
                                    scope.launch {
                                        repository.saveProduct(product.copy(isInStock = newValue), null, emptyList())
                                        loadData()
                                    }
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun StoreStatsSection(productCount: Int, onViewOrders: () -> Unit) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
        StatCard(
            title = "Products",
            value = productCount.toString(),
            icon = Icons.Default.Inventory,
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier.weight(1f)
        )
        StatCard(
            title = "Orders",
            value = "View",
            icon = Icons.Default.ShoppingBag,
            color = MaterialTheme.colorScheme.secondary,
            modifier = Modifier.weight(1f).clickable { onViewOrders() }
        )
    }
}

@Composable
fun StatCard(title: String, value: String, icon: ImageVector, color: Color, modifier: Modifier) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = color.copy(alpha = 0.1f))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Icon(icon, contentDescription = null, tint = color)
            Spacer(modifier = Modifier.height(8.dp))
            Text(text = value, style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold, color = color))
            Text(text = title, style = MaterialTheme.typography.labelMedium, color = color.copy(alpha = 0.7f))
        }
    }
}

@Composable
fun ProductDashboardCard(product: Product, onClick: () -> Unit, onToggleStock: (Boolean) -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Box(modifier = Modifier.fillMaxWidth().clickable(onClick = onClick)) {
                Column {
                    Text(
                        text = product.title,
                        style = MaterialTheme.typography.titleSmall,
                        maxLines = 1,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "₹${product.price}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = if (product.isInStock) "In Stock" else "Out of Stock",
                    style = MaterialTheme.typography.labelSmall,
                    color = if (product.isInStock) Color(0xFF4CAF50) else Color.Red,
                    modifier = Modifier.weight(1f)
                )
                Switch(
                    checked = product.isInStock,
                    onCheckedChange = onToggleStock,
                    modifier = Modifier.scale(0.7f)
                )
            }
        }
    }
}

@Composable
private fun Icon(imageVector: ImageVector, contentDescription: String?, size: androidx.compose.ui.unit.Dp, tint: Color) {
    androidx.compose.material3.Icon(
        imageVector = imageVector,
        contentDescription = contentDescription,
        modifier = Modifier.size(size),
        tint = tint
    )
}
