package com.pabirul.digisewa.ui.service

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.pabirul.digisewa.Profile
import com.pabirul.digisewa.Service

@Composable
fun ManageServicesScreen(
    profile: Profile,
    viewModel: ServiceViewModel,
    onAddService: () -> Unit,
    onEditService: (Service) -> Unit
) {
    val services by viewModel.services.collectAsState()
    val state by viewModel.serviceState.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.loadServices(profile.id)
    }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(onClick = onAddService) {
                Icon(Icons.Default.Add, contentDescription = "Add Service")
            }
        }
    ) { padding ->
        Box(modifier = Modifier.padding(padding)) {
            if (state is ServiceState.Loading && services.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            } else if (services.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("No services listed yet.")
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp)
                ) {
                    items(services) { service ->
                        ServiceItem(
                            service = service,
                            onEdit = { onEditService(service) },
                            onDelete = { viewModel.deleteService(service.id!!, profile.id) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun ServiceItem(service: Service, onEdit: () -> Unit, onDelete: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp)
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(text = service.title, style = MaterialTheme.typography.titleLarge)
                Text(text = "₹${service.basePrice} | ${service.durationMinutes} min", style = MaterialTheme.typography.bodyMedium)
            }
            Row {
                IconButton(onClick = onEdit) {
                    Icon(Icons.Default.Edit, contentDescription = "Edit")
                }
                IconButton(onClick = onDelete) {
                    Icon(Icons.Default.Delete, contentDescription = "Delete")
                }
            }
        }
    }
}
