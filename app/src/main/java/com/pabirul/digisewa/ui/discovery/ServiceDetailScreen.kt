package com.pabirul.digisewa.ui.discovery

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.pabirul.digisewa.ServiceWithProvider

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ServiceDetailScreen(
    serviceWithProvider: ServiceWithProvider,
    viewModel: DiscoveryViewModel,
    onBack: () -> Unit
) {
    val provider = serviceWithProvider.provider
    val details = provider.providerDetails
    
    val gallery by viewModel.gallery.collectAsState()

    LaunchedEffect(serviceWithProvider.id) {
        viewModel.loadServiceDetails(serviceWithProvider.id)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Service Details") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
        ) {
            // Gallery Swiper (Simple LazyRow for now)
            Box(modifier = Modifier.fillMaxWidth().height(250.dp)) {
                if (gallery.isEmpty()) {
                    AsyncImage(
                        model = serviceWithProvider.mainImageUrl ?: "https://via.placeholder.com/400x250?text=No+Image",
                        contentDescription = null,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                } else {
                    LazyRow(modifier = Modifier.fillMaxSize()) {
                        items(gallery) { item ->
                            AsyncImage(
                                model = item.imageUrl,
                                contentDescription = null,
                                modifier = Modifier.fillParentMaxWidth().fillMaxHeight(),
                                contentScale = ContentScale.Crop
                            )
                        }
                    }
                }
            }

            Column(modifier = Modifier.padding(16.dp)) {
                Text(text = serviceWithProvider.title, style = MaterialTheme.typography.headlineMedium)
                Text(
                    text = "₹${serviceWithProvider.basePrice} for ${serviceWithProvider.durationMinutes} min",
                    style = MaterialTheme.typography.titleLarge,
                    color = MaterialTheme.colorScheme.primary
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                Text(text = "Description", style = MaterialTheme.typography.titleMedium)
                Text(text = serviceWithProvider.description ?: "No description provided.", style = MaterialTheme.typography.bodyLarge)

                Spacer(modifier = Modifier.height(24.dp))
                Divider()
                Spacer(modifier = Modifier.height(24.dp))

                // Provider Card
                Text(text = "About the Provider", style = MaterialTheme.typography.titleLarge)
                Spacer(modifier = Modifier.height(16.dp))
                
                Row(verticalAlignment = Alignment.CenterVertically) {
                    AsyncImage(
                        model = provider.avatarUrl ?: "https://via.placeholder.com/100?text=User",
                        contentDescription = null,
                        modifier = Modifier.size(64.dp).clip(CircleShape),
                        contentScale = ContentScale.Crop
                    )
                    Spacer(modifier = Modifier.width(16.dp))
                    Column {
                        Text(text = provider.fullName, style = MaterialTheme.typography.titleMedium)
                        Text(text = "${details?.experienceYears ?: 0} Years Experience", style = MaterialTheme.typography.bodyMedium)
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))
                
                if (details?.bio != null) {
                    Text(text = details.bio, style = MaterialTheme.typography.bodyMedium)
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.LocationOn, contentDescription = null, modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(text = "${provider.address}, ${provider.city}", style = MaterialTheme.typography.bodyMedium)
                }

                Spacer(modifier = Modifier.height(32.dp))
                
                Button(
                    onClick = { /* Future: Implement Booking */ },
                    modifier = Modifier.fillMaxWidth(),
                    shape = CircleShape
                ) {
                    Icon(Icons.Default.Call, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Contact Provider")
                }
            }
        }
    }
}
