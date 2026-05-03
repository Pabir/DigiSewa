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
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.StarOutline
import com.pabirul.digisewa.BookingStatus
import com.pabirul.digisewa.BookingWithDetails
import com.pabirul.digisewa.Profile
import com.pabirul.digisewa.UserRole
import com.pabirul.digisewa.R
import com.pabirul.digisewa.Review
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.Duration
import androidx.compose.ui.window.Dialog
import androidx.compose.foundation.clickable
import androidx.compose.material3.OutlinedTextField
import com.pabirul.digisewa.ui.components.AdMobBanner

@Composable
fun MyBookingsScreen(
    profile: Profile,
    viewModel: BookingViewModel,
    isProvider: Boolean
) {
    val bookings by viewModel.bookings.collectAsState()
    val state by viewModel.state.collectAsState()
    val context = androidx.compose.ui.platform.LocalContext.current
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
        snackbarHost = { SnackbarHost(hostState = snackbarHostState) },
        bottomBar = {
            AdMobBanner()
        }
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
                            onComplete = { viewModel.completeBooking(booking.id, profile.id) },
                            onCancel = { viewModel.cancelBooking(booking, profile.id) },
                            onSubmitReview = { review -> viewModel.submitReview(review, profile.id, isProvider) }
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
    onComplete: () -> Unit,
    onCancel: () -> Unit,
    onSubmitReview: (Review) -> Unit
) {
    var showCancelDialog by remember { mutableStateOf(false) }
    var showCompleteDialog by remember { mutableStateOf(false) }
    var showReviewDialog by remember { mutableStateOf(false) }

    if (showReviewDialog) {
        ReviewDialog(
            onDismiss = { showReviewDialog = false },
            onSubmit = { rating, comment ->
                onSubmitReview(
                    Review(
                        bookingId = booking.id,
                        customerId = booking.customer?.id ?: "",
                        providerId = booking.provider?.id ?: "",
                        serviceId = booking.service?.id ?: "",
                        rating = rating,
                        comment = comment
                    )
                )
                showReviewDialog = false
            }
        )
    }

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

    if (showCompleteDialog) {
        AlertDialog(
            onDismissRequest = { showCompleteDialog = false },
            title = { Text(stringResource(R.string.confirm_completion_title)) },
            text = { Text(stringResource(R.string.confirm_completion_msg)) },
            confirmButton = {
                Button(
                    onClick = {
                        showCompleteDialog = false
                        onComplete()
                    }
                ) {
                    Text(stringResource(R.string.confirm))
                }
            },
            dismissButton = {
                TextButton(onClick = { showCompleteDialog = false }) {
                    Text(stringResource(R.string.cancel))
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
                    text = booking.service?.title ?: "Service",
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

            // User Info
            val otherUser = if (isProvider) booking.customer else booking.provider
            if (otherUser != null) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Person, contentDescription = null, modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Column {
                        Text(text = otherUser.fullName, style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold))
                        Text(text = otherUser.city ?: "Unknown City", style = MaterialTheme.typography.bodySmall)
                    }
                }
            }

            // Reveal sensitive info only if CONFIRMED/COMPLETED
            if (booking.status == BookingStatus.CONFIRMED || booking.status == BookingStatus.PAID || booking.status == BookingStatus.COMPLETED) {
                Spacer(modifier = Modifier.height(12.dp))
                Surface(
                    color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.4f),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp).fillMaxWidth()) {
                        val displayUser = if (isProvider) booking.customer else booking.provider
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Call, contentDescription = null, modifier = Modifier.size(16.dp))
                            Text(text = " ${displayUser?.privateProfile?.phoneNumber ?: "N/A"}", style = MaterialTheme.typography.bodySmall)
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.LocationOn, contentDescription = null, modifier = Modifier.size(16.dp))
                            Text(text = " ${displayUser?.privateProfile?.fullAddress ?: "N/A"}", style = MaterialTheme.typography.bodySmall)
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
                if (!isProvider && (booking.status == BookingStatus.REQUESTED || booking.status == BookingStatus.CONFIRMED)) {
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

                if (!isProvider && (booking.status == BookingStatus.CONFIRMED || booking.status == BookingStatus.PAID)) {
                    Button(
                        onClick = { showCompleteDialog = true },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF4CAF50)),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text(stringResource(R.string.complete_service))
                    }
                }

                if (!isProvider && booking.status == BookingStatus.COMPLETED && booking.review == null) {
                    Button(
                        onClick = { showReviewDialog = true },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text(stringResource(R.string.rate_service))
                    }
                }

                // Show existing rating if present
                val existingReview = booking.review
                if (existingReview != null) {
                    Spacer(modifier = Modifier.height(16.dp))
                    Surface(
                        color = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.4f),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                repeat(5) { index ->
                                    Icon(
                                        imageVector = if (index < existingReview.rating) Icons.Default.Star else Icons.Default.StarOutline,
                                        contentDescription = null,
                                        tint = if (index < existingReview.rating) Color(0xFFFFB300) else Color.Gray,
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(text = "Your Review", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                            }
                            if (!existingReview.comment.isNullOrBlank()) {
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(text = existingReview.comment, style = MaterialTheme.typography.bodySmall)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ReviewDialog(
    onDismiss: () -> Unit,
    onSubmit: (Int, String) -> Unit
) {
    var rating by remember { mutableIntStateOf(5) }
    var comment by remember { mutableStateOf("") }

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(24.dp),
            color = MaterialTheme.colorScheme.surface,
            modifier = Modifier.fillMaxWidth().padding(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = stringResource(R.string.rate_service),
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(text = stringResource(R.string.how_was_your_experience))
                Spacer(modifier = Modifier.height(16.dp))
                
                Row {
                    repeat(5) { index ->
                        val starIndex = index + 1
                        Icon(
                            imageVector = if (starIndex <= rating) Icons.Default.Star else Icons.Default.StarOutline,
                            contentDescription = null,
                            tint = if (starIndex <= rating) Color(0xFFFFB300) else Color.Gray,
                            modifier = Modifier
                                .size(40.dp)
                                .clickable { rating = starIndex }
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(24.dp))
                
                OutlinedTextField(
                    value = comment,
                    onValueChange = { comment = it },
                    label = { Text(stringResource(R.string.share_details_optional)) },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3
                )
                
                Spacer(modifier = Modifier.height(24.dp))
                
                Button(
                    onClick = { onSubmit(rating, comment) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(stringResource(R.string.submit_review))
                }
                TextButton(onClick = onDismiss, modifier = Modifier.fillMaxWidth()) {
                    Text(stringResource(R.string.cancel))
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
