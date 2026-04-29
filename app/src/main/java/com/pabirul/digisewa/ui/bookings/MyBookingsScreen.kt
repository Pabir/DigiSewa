package com.pabirul.digisewa.ui.bookings

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.res.stringResource
import com.pabirul.digisewa.BookingStatus
import com.pabirul.digisewa.BookingWithDetails
import com.pabirul.digisewa.Profile
import com.pabirul.digisewa.UserRole
import com.pabirul.digisewa.R
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.Duration

@Composable
fun MyBookingsScreen(
    profile: Profile,
    viewModel: BookingViewModel,
    isProvider: Boolean
) {
    val bookings by viewModel.bookings.collectAsState()
    val state by viewModel.state.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        viewModel.loadBookings(profile.id, isProvider)
    }

    LaunchedEffect(state) {
        if (state is BookingState.Error) {
            scope.launch {
                snackbarHostState.showSnackbar("Error: ${(state as BookingState.Error).message}")
            }
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(hostState = snackbarHostState) }
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            if (bookings.isEmpty() && state is BookingState.Idle) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(text = "No bookings found.", style = MaterialTheme.typography.titleMedium)
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    items(bookings) { booking ->
                        BookingItem(
                            booking = booking,
                            isProvider = isProvider,
                            onConfirm = { viewModel.confirmBooking(booking.id, profile.id) },
                            onPay = { viewModel.payForBooking(booking.id, profile.id) },
                            onCancel = { viewModel.cancelBooking(booking, profile.id) }
                        )
                    }
                }
            }

            if (state is BookingState.Loading) {
                CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
            }
        }
    }
}

@Composable
fun BookingItem(
    booking: BookingWithDetails,
    isProvider: Boolean,
    onConfirm: () -> Unit,
    onPay: () -> Unit,
    onCancel: () -> Unit
) {
    var showCancelDialog by remember { mutableStateOf(false) }

    if (showCancelDialog) {
        AlertDialog(
            onDismissRequest = { showCancelDialog = false },
            title = { Text(stringResource(R.string.cancel)) },
            text = { Text("Are you sure you want to cancel this booking request?") },
            confirmButton = {
                Button(
                    onClick = {
                        showCancelDialog = false
                        onCancel()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                ) {
                    Text(stringResource(R.string.cancel))
                }
            },
            dismissButton = {
                TextButton(onClick = { showCancelDialog = false }) {
                    Text("No")
                }
            }
        )
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = booking.service.title ?: "Service",
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                )
                StatusBadge(status = booking.status)
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Event, contentDescription = null, modifier = Modifier.size(18.dp), tint = MaterialTheme.colorScheme.primary)
                Text(text = " ${booking.scheduledAt.split("T")[0]}", style = MaterialTheme.typography.bodyMedium)
                Spacer(modifier = Modifier.width(16.dp))
                Icon(Icons.Default.Schedule, contentDescription = null, modifier = Modifier.size(18.dp), tint = MaterialTheme.colorScheme.primary)
                Text(text = " ${booking.scheduledAt.split("T")[1].substring(0, 5)}", style = MaterialTheme.typography.bodyMedium)
            }

            Spacer(modifier = Modifier.height(16.dp))
            HorizontalDivider(modifier = Modifier.alpha(0.1f))
            Spacer(modifier = Modifier.height(16.dp))

            // Timer for Confirmed Status
            if (booking.status == BookingStatus.CONFIRMED && booking.confirmedAt != null) {
                PaymentTimer(confirmedAt = booking.confirmedAt)
                Spacer(modifier = Modifier.height(16.dp))
            }

            // User Info
            val otherUser = if (isProvider) booking.customer else booking.provider
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Person, contentDescription = null, modifier = Modifier.size(20.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Column {
                    Text(text = otherUser.fullName, style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold))
                    Text(text = otherUser.city ?: "Unknown City", style = MaterialTheme.typography.bodySmall)
                }
            }

            // Reveal sensitive info only if PAID/COMPLETED
            if (isProvider && (booking.status == BookingStatus.PAID || booking.status == BookingStatus.COMPLETED)) {
                Spacer(modifier = Modifier.height(12.dp))
                Surface(
                    color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.4f),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp).fillMaxWidth()) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Call, contentDescription = null, modifier = Modifier.size(16.dp))
                            Text(text = " ${booking.customer.privateProfile?.phoneNumber ?: "N/A"}", style = MaterialTheme.typography.bodySmall)
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.LocationOn, contentDescription = null, modifier = Modifier.size(16.dp))
                            Text(text = " ${booking.customer.privateProfile?.fullAddress ?: "N/A"}", style = MaterialTheme.typography.bodySmall)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Actions
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                // Provider can cancel a request
                if (isProvider && booking.status == BookingStatus.REQUESTED) {
                    OutlinedButton(
                        onClick = { showCancelDialog = true },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.error),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text(stringResource(R.string.cancel))
                    }
                }

                // Customer can cancel
                if (!isProvider && (booking.status == BookingStatus.REQUESTED || booking.status == BookingStatus.CONFIRMED || booking.status == BookingStatus.PAID)) {
                    OutlinedButton(
                        onClick = { showCancelDialog = true },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.error),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text(stringResource(R.string.cancel))
                    }
                }

                if (isProvider && booking.status == BookingStatus.REQUESTED) {
                    Button(
                        onClick = onConfirm,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text(stringResource(R.string.confirm))
                    }
                }

                if (!isProvider && booking.status == BookingStatus.CONFIRMED) {
                    Button(
                        onClick = onPay,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF4CAF50)),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text(stringResource(R.string.pay, booking.totalPrice))
                    }
                }
            }
        }
    }
}

@Composable
fun PaymentTimer(confirmedAt: String) {
    var timeLeft by remember { mutableStateOf("") }
    
    LaunchedEffect(confirmedAt) {
        val confirmedTime = Instant.parse(confirmedAt)
        val expireTime = confirmedTime.plus(Duration.ofMinutes(15))
        
        while (true) {
            val now = Instant.now()
            val remaining = Duration.between(now, expireTime)
            
            if (remaining.isNegative || remaining.isZero) {
                timeLeft = "Expired"
                break
            } else {
                val minutes = remaining.toMinutes()
                val seconds = remaining.minusMinutes(minutes).seconds
                timeLeft = String.format("%02d:%02d", minutes, seconds)
            }
            delay(1000)
        }
    }

    Surface(
        color = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.5f),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                Icons.Default.Timer,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.error,
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.width(12.dp))
            Text(
                text = "Payment required in: $timeLeft",
                style = MaterialTheme.typography.titleMedium.copy(
                    color = MaterialTheme.colorScheme.error,
                    fontWeight = FontWeight.Bold
                )
            )
        }
    }
}

@Composable
fun StatusBadge(status: BookingStatus) {
    val color = when (status) {
        BookingStatus.REQUESTED -> Color(0xFF2196F3)
        BookingStatus.CONFIRMED -> Color(0xFFFF9800)
        BookingStatus.PAID -> Color(0xFF4CAF50)
        BookingStatus.COMPLETED -> Color(0xFF9E9E9E)
        BookingStatus.CANCELLED -> Color(0xFFF44336)
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
