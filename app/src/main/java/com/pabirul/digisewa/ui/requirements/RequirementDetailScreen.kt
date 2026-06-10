package com.pabirul.digisewa.ui.requirements

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.pabirul.digisewa.*
import com.pabirul.digisewa.R
import com.pabirul.digisewa.ui.bookings.BookingViewModel
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RequirementDetailScreen(
    requirement: RequirementWithDetails,
    profile: Profile,
    viewModel: RequirementViewModel,
    bookingViewModel: BookingViewModel, // Added
    onBack: () -> Unit
) {
    val isCustomer = profile.role == UserRole.CUSTOMER
    val state by viewModel.state.collectAsState()
    
    // Provider State
    var quoteAmount by remember { mutableStateOf("") }
    var quoteMessage by remember { mutableStateOf("") }
    var selectedServiceId by remember { mutableStateOf<String?>(null) }
    var overridenScheduledAt by remember { mutableStateOf<String?>(requirement.scheduledAt) }
    
    val providerServices by viewModel.providerServices.collectAsState()
    val hasAlreadyResponded = requirement.responses.any { it.providerId == profile.id }

    LaunchedEffect(profile.id, isCustomer) {
        if (!isCustomer) {
            viewModel.loadProviderServices(profile.id)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(requirement.category?.name ?: "Detail") },
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
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            // Photos
            if (requirement.photos.isNotEmpty()) {
                Box(modifier = Modifier.fillMaxWidth().height(200.dp)) {
                    AsyncImage(
                        model = requirement.photos.first().imageUrl,
                        contentDescription = null,
                        modifier = Modifier.fillMaxSize().clip(RoundedCornerShape(16.dp)),
                        contentScale = ContentScale.Crop
                    )
                }
                Spacer(modifier = Modifier.height(16.dp))
            }

            Text(text = stringResource(R.string.requirement_details), style = MaterialTheme.typography.titleLarge)
            Spacer(modifier = Modifier.height(8.dp))
            Text(text = requirement.description, style = MaterialTheme.typography.bodyLarge)
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Column {
                    Text(text = stringResource(R.string.location), style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.secondary)
                    Text(text = requirement.locationName ?: "N/A", style = MaterialTheme.typography.bodyMedium)
                }
                if (requirement.scheduledAt != null) {
                    Column(horizontalAlignment = Alignment.End) {
                        Text(text = stringResource(R.string.proposed_time), style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.secondary)
                        Text(text = requirement.scheduledAt.replace("T", " ").replace("Z", ""), style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
            
            if (requirement.budget != null) {
                Text(text = stringResource(R.string.budget), style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.secondary)
                Text(text = "₹${requirement.budget}", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold)
            }

            Spacer(modifier = Modifier.height(24.dp))
            HorizontalDivider()
            Spacer(modifier = Modifier.height(24.dp))

            if (isCustomer) {
                // Customer View: Show Responses
                Text(text = stringResource(R.string.responses), style = MaterialTheme.typography.titleLarge)
                Spacer(modifier = Modifier.height(16.dp))
                
                if (requirement.responses.isEmpty()) {
                    Text(text = stringResource(R.string.no_quotes_received))
                } else {
                    requirement.responses.forEach { response ->
                        ResponseItem(
                            response = response,
                            onAccept = {
                                viewModel.acceptResponse(requirement.id, response.id, profile.id)
                            }
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                    }
                }
            } else {
                // Provider View: Send Quote
                if (hasAlreadyResponded) {
                    Text(text = stringResource(R.string.already_responded), color = MaterialTheme.colorScheme.primary)
                } else if (requirement.status != RequirementStatus.OPEN) {
                    Text(text = stringResource(R.string.requirement_closed), color = MaterialTheme.colorScheme.error)
                } else {
                    Text(text = stringResource(R.string.send_quote), style = MaterialTheme.typography.titleLarge)
                    Spacer(modifier = Modifier.height(16.dp))

                    // Service Selection
                    var serviceExpanded by remember { mutableStateOf(false) }
                    ExposedDropdownMenuBox(
                        expanded = serviceExpanded,
                        onExpandedChange = { serviceExpanded = !serviceExpanded }
                    ) {
                        OutlinedTextField(
                            value = providerServices.find { it.id == selectedServiceId }?.title ?: stringResource(R.string.select_your_service),
                            onValueChange = {},
                            readOnly = true,
                            label = { Text(stringResource(R.string.service_to_provide)) },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = serviceExpanded) },
                            modifier = Modifier.menuAnchor().fillMaxWidth()
                        )
                        ExposedDropdownMenu(
                            expanded = serviceExpanded,
                            onDismissRequest = { serviceExpanded = false }
                        ) {
                            providerServices.forEach { service ->
                                DropdownMenuItem(
                                    text = { Text(service.title ?: "Untitled") },
                                    onClick = {
                                        selectedServiceId = service.id
                                        serviceExpanded = false
                                    }
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))
                    
                    OutlinedTextField(
                        value = quoteAmount,
                        onValueChange = { quoteAmount = it },
                        label = { Text(stringResource(R.string.quote_amount)) },
                        modifier = Modifier.fillMaxWidth(),
                        prefix = { Text("₹") }
                    )
                    
                    Spacer(modifier = Modifier.height(12.dp))

                    // Date & Time Picker for Override
                    val context = LocalContext.current
                    val calendar = Calendar.getInstance()
                    val datePickerDialog = DatePickerDialog(
                        context,
                        { _, y, m, d ->
                            TimePickerDialog(context, { _, hh, mm ->
                                overridenScheduledAt = String.format(Locale.US, "%04d-%02d-%02dT%02d:%02d:00Z", y, m + 1, d, hh, mm)
                            }, calendar.get(Calendar.HOUR_OF_DAY), calendar.get(Calendar.MINUTE), true).show()
                        },
                        calendar.get(Calendar.YEAR),
                        calendar.get(Calendar.MONTH),
                        calendar.get(Calendar.DAY_OF_MONTH)
                    )

                    OutlinedTextField(
                        value = overridenScheduledAt?.replace("T", " ")?.replace("Z", "") ?: stringResource(R.string.as_proposed_by_customer),
                        onValueChange = {},
                        readOnly = true,
                        label = { Text(stringResource(R.string.preferred_date_time)) },
                        modifier = Modifier.fillMaxWidth(),
                        trailingIcon = {
                            IconButton(onClick = { datePickerDialog.show() }) {
                                Icon(Icons.Default.CalendarToday, contentDescription = "Pick Date")
                            }
                        }
                    )

                    Spacer(modifier = Modifier.height(12.dp))
                    
                    OutlinedTextField(
                        value = quoteMessage,
                        onValueChange = { quoteMessage = it },
                        label = { Text(stringResource(R.string.quote_message)) },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 2
                    )
                    
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    Button(
                        onClick = {
                            val amount = quoteAmount.toIntOrNull() ?: return@Button
                            if (selectedServiceId == null) return@Button
                            
                            val response = RequirementResponse(
                                requirementId = requirement.id,
                                providerId = profile.id,
                                serviceId = selectedServiceId,
                                quoteAmount = amount,
                                message = quoteMessage,
                                scheduledAt = overridenScheduledAt
                            )
                            viewModel.submitResponse(response)
                        },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = state !is RequirementState.Loading
                    ) {
                        if (state is RequirementState.Loading) {
                            CircularProgressIndicator(modifier = Modifier.size(24.dp))
                        } else {
                            Text(stringResource(R.string.submit_quote))
                        }
                    }
                }
            }
            
            if (state is RequirementState.Error) {
                Text(
                    text = (state as RequirementState.Error).message,
                    color = MaterialTheme.colorScheme.error,
                    modifier = Modifier.padding(top = 8.dp)
                )
            }
        }
    }
}

@Composable
fun ResponseItem(
    response: RequirementResponseWithProvider,
    onAccept: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                AsyncImage(
                    model = response.provider?.avatarUrl,
                    contentDescription = null,
                    modifier = Modifier.size(40.dp).clip(RoundedCornerShape(20.dp)),
                    contentScale = ContentScale.Crop
                )
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(text = response.provider?.fullName ?: "Provider", fontWeight = FontWeight.Bold)
                    Text(text = "₹${response.customerPrice}", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.primary)
                    if (response.scheduledAt != null) {
                        Text(
                            text = stringResource(R.string.proposed_time_label, response.scheduledAt.replace("T", " ").replace("Z", "")),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.tertiary
                        )
                    }
                    if (response.service != null) {
                        Text(
                            text = stringResource(R.string.service_label, response.service.title ?: ""),
                            style = MaterialTheme.typography.labelSmall
                        )
                    }
                }
            }
            
            if (!response.message.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(12.dp))
                Text(text = response.message, style = MaterialTheme.typography.bodyMedium)
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            if (response.status == ResponseStatus.PENDING) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                    TextButton(onClick = { /* Reject logic if needed */ }) {
                        Text(stringResource(R.string.reject), color = MaterialTheme.colorScheme.error)
                    }
                    Button(onClick = onAccept) {
                        Text(stringResource(R.string.accept))
                    }
                }
            } else {
                Text(
                    text = response.status.name.uppercase(),
                    style = MaterialTheme.typography.labelLarge,
                    color = if (response.status == ResponseStatus.ACCEPTED) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error,
                    modifier = Modifier.align(Alignment.End)
                )
            }
        }
    }
}
