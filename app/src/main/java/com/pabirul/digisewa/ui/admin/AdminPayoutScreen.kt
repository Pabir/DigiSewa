package com.pabirul.digisewa.ui.admin

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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.pabirul.digisewa.BookingStatus
import com.pabirul.digisewa.BookingWithDetails
import com.pabirul.digisewa.Profile
import com.pabirul.digisewa.ui.bookings.BookingState
import com.pabirul.digisewa.ui.bookings.BookingViewModel
import kotlinx.coroutines.launch

@Composable
fun AdminPayoutScreen(
    viewModel: BookingViewModel
) {
    val bookings by viewModel.bookings.collectAsState()
    val state by viewModel.state.collectAsState()
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        // In a real app, we'd have a separate loadAllBookings for Admin
        // For now, we'll assume the viewModel can fetch everything
        viewModel.loadBookings("", false) // Admin fetch logic placeholder
    }

    Scaffold { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Only show bookings that are PAID or COMPLETED
                val payoutBookings = bookings.filter { 
                    it.status == BookingStatus.PAID || it.status == BookingStatus.COMPLETED 
                }

                if (payoutBookings.isEmpty()) {
                    item {
                        Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                            Text("No payout records found.")
                        }
                    }
                }

                items(payoutBookings) { booking ->
                    PayoutItem(
                        booking = booking,
                        onVerify = { viewModel.markAsVerified(booking.id) },
                        onMarkPaid = { viewModel.markAsPaidToProvider(booking.id) }
                    )
                }
            }

            if (state is BookingState.Loading) {
                CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
            }
        }
    }
}

@Composable
fun PayoutItem(
    booking: BookingWithDetails,
    onVerify: () -> Unit,
    onMarkPaid: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(text = "Order #${booking.id.take(8)}", fontWeight = FontWeight.Bold)
                StatusChip(status = booking.status)
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            Text(text = "Service: ${booking.service?.title}", style = MaterialTheme.typography.bodyMedium)
            Text(text = "Customer: ${booking.customer?.fullName} (${booking.customer?.phoneNumber})", style = MaterialTheme.typography.bodySmall)
            Text(text = "Provider: ${booking.provider?.fullName}", style = MaterialTheme.typography.bodySmall)
            
            HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))
            
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Column {
                    Text(text = "Total: ₹${booking.totalPrice}", style = MaterialTheme.typography.labelSmall)
                    Text(text = "Fee (15%): ₹${booking.platformFee}", color = Color.Red, style = MaterialTheme.typography.labelSmall)
                    Text(text = "Payout: ₹${booking.payoutAmount}", color = Color(0xFF4CAF50), fontWeight = FontWeight.Bold)
                }
                
                Column(horizontalAlignment = Alignment.End) {
                    Text(text = "Verified: ${if (booking.isVerifiedByCall) "✅ Yes" else "❌ No"}", style = MaterialTheme.typography.labelSmall)
                    Text(text = "Payout: ${booking.payoutStatus.uppercase()}", style = MaterialTheme.typography.labelSmall)
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
            
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                if (!booking.isVerifiedByCall) {
                    Button(
                        onClick = onVerify,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                    ) {
                        Text("Verify Call", style = MaterialTheme.typography.labelSmall)
                    }
                }
                
                if (booking.payoutStatus == "pending") {
                    Button(
                        onClick = onMarkPaid,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF4CAF50))
                    ) {
                        Text("Release Payout", style = MaterialTheme.typography.labelSmall)
                    }
                }
            }
        }
    }
}

@Composable
fun StatusChip(status: BookingStatus) {
    Surface(
        color = MaterialTheme.colorScheme.secondaryContainer,
        shape = RoundedCornerShape(8.dp)
    ) {
        Text(
            text = status.name,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            style = MaterialTheme.typography.labelSmall
        )
    }
}
