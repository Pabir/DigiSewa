package com.pabirul.digisewa.ui.discovery

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.pabirul.digisewa.Category
import com.pabirul.digisewa.ServiceWithProvider

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ServiceListingScreen(
    category: Category,
    viewModel: DiscoveryViewModel,
    onServiceClick: (ServiceWithProvider) -> Unit,
    onBack: () -> Unit
) {
    val services by viewModel.services.collectAsState()
    val state by viewModel.state.collectAsState()

    LaunchedEffect(category.id) {
        category.id?.let { viewModel.loadServices(it) }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(category.name) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Box(modifier = Modifier.padding(padding)) {
            if (state is DiscoveryState.Loading && services.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            } else if (services.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("No services available in this category yet.")
                }
            } else {
                LazyColumn(modifier = Modifier.fillMaxSize()) {
                    items(services) { serviceWithProvider ->
                        ServiceCard(
                            serviceWithProvider = serviceWithProvider,
                            onClick = { onServiceClick(serviceWithProvider) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun ServiceCard(serviceWithProvider: ServiceWithProvider, onClick: () -> Unit) {
    val provider = serviceWithProvider.provider

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
            .clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column {
            AsyncImage(
                model = serviceWithProvider.mainImageUrl ?: "https://via.placeholder.com/400x200?text=No+Image",
                contentDescription = null,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(180.dp),
                contentScale = ContentScale.Crop
            )
            
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(text = serviceWithProvider.title, style = MaterialTheme.typography.titleLarge)
                    Text(
                        text = "₹${serviceWithProvider.basePrice}",
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
                
                Spacer(modifier = Modifier.height(4.dp))
                
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "By ${provider.fullName}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.outline
                    )
                    if (provider.providerDetails?.isVerified == true) {
                        Icon(
                            Icons.Default.Star,
                            contentDescription = "Verified",
                            modifier = Modifier.size(16.dp).padding(start = 4.dp),
                            tint = MaterialTheme.colorScheme.primary
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                Text(
                    text = "${serviceWithProvider.durationMinutes} Minutes",
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
    }
}
