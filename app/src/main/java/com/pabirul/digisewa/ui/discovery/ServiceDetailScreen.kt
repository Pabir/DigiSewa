package com.pabirul.digisewa.ui.discovery

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.pabirul.digisewa.Booking
import com.pabirul.digisewa.ServiceWithProvider
import com.pabirul.digisewa.ui.bookings.BookingRequestDialog
import com.pabirul.digisewa.ui.bookings.BookingViewModel

import androidx.compose.ui.res.stringResource
import com.pabirul.digisewa.R

import androidx.compose.ui.text.style.TextAlign
import androidx.compose.material.icons.filled.CheckCircle
import com.pabirul.digisewa.ui.bookings.BookingState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ServiceDetailScreen(
    serviceWithProvider: ServiceWithProvider,
    viewModel: DiscoveryViewModel,
    bookingViewModel: BookingViewModel,
    customerId: String,
    onBack: () -> Unit,
    onNavigateToBookings: () -> Unit // New callback
) {
    val provider = serviceWithProvider.provider
    val details = provider.providerDetails
    val gallery by viewModel.gallery.collectAsState()
    val unavailableSlots by bookingViewModel.unavailableSlots.collectAsState()
    val loadingSlots by bookingViewModel.loadingSlots.collectAsState()
    val bookingState by bookingViewModel.state.collectAsState()
    
    var showBookingDialog by remember { mutableStateOf(false) }
    var showSuccessDialog by remember { mutableStateOf(false) }

    LaunchedEffect(serviceWithProvider.id) {
        viewModel.loadServiceDetails(serviceWithProvider.id)
    }

    // React to booking success
    LaunchedEffect(bookingState) {
        if (bookingState is BookingState.Success) {
            showSuccessDialog = true
            bookingViewModel.resetState()
        }
    }

    if (showBookingDialog) {
        // ... (existing dialog logic)
        // Clear slots when dialog opens to ensure fresh fetch
        LaunchedEffect(showBookingDialog) {
            bookingViewModel.loadUnavailableSlots(provider.id, "") 
        }

        BookingRequestDialog(
            unavailableSlots = unavailableSlots,
            isLoading = loadingSlots,
            serviceDurationMinutes = serviceWithProvider.durationMinutes,
            onDateSelected = { date ->
                bookingViewModel.loadUnavailableSlots(provider.id, date)
            },
            onDismiss = { showBookingDialog = false },
            onConfirm = { scheduledAt, lat, lng, locName ->
                val booking = Booking(
                    customerId = customerId,
                    providerId = provider.id,
                    serviceId = serviceWithProvider.id,
                    scheduledAt = scheduledAt,
                    totalPrice = serviceWithProvider.basePrice,
                    lat = lat,
                    lng = lng,
                    serviceLocationName = locName
                )
                bookingViewModel.requestService(booking)
                showBookingDialog = false
            }
        )
    }

    if (showSuccessDialog) {
        AlertDialog(
            onDismissRequest = { showSuccessDialog = false },
            icon = { Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color(0xFF4CAF50), modifier = Modifier.size(48.dp)) },
            title = { Text(stringResource(R.string.booking_success_title), fontWeight = FontWeight.Bold, textAlign = TextAlign.Center) },
            text = { Text(stringResource(R.string.booking_success_message), textAlign = TextAlign.Center) },
            confirmButton = {
                Button(
                    onClick = {
                        showSuccessDialog = false
                        onNavigateToBookings()
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(stringResource(R.string.my_bookings))
                }
            },
            dismissButton = {
                TextButton(
                    onClick = { showSuccessDialog = false },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(stringResource(R.string.close))
                }
            }
        )
    }

    Scaffold(
        bottomBar = {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                tonalElevation = 8.dp,
                shadowElevation = 16.dp,
                color = MaterialTheme.colorScheme.surface
            ) {
                Row(
                    modifier = Modifier
                        .padding(16.dp)
                        .navigationBarsPadding(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(text = stringResource(R.string.total_price), style = MaterialTheme.typography.bodySmall)
                        Text(
                            text = "₹${serviceWithProvider.basePrice}",
                            style = MaterialTheme.typography.headlineSmall.copy(
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                        )
                    }
                    Button(
                        onClick = { showBookingDialog = true },
                        modifier = Modifier
                            .height(56.dp)
                            .weight(1.5f),
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.tertiary)
                    ) {
                        Icon(Icons.Default.Schedule, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(stringResource(R.string.book_now), style = MaterialTheme.typography.titleMedium)
                    }
                }
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(bottom = padding.calculateBottomPadding())
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
        ) {
            // Header with Back Button and Gallery
            Box(modifier = Modifier.fillMaxWidth().height(350.dp)) {
                if (gallery.isEmpty()) {
                    AsyncImage(
                        model = serviceWithProvider.mainImageUrl ?: "https://via.placeholder.com/400x350?text=No+Image",
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
                
                // Gradient Overlay
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            Brush.verticalGradient(
                                colors = listOf(Color.Black.copy(alpha = 0.4f), Color.Transparent, Color.Transparent),
                                startY = 0f,
                                endY = 500f
                            )
                        )
                )

                // Back Button
                IconButton(
                    onClick = onBack,
                    modifier = Modifier
                        .padding(top = 48.dp, start = 16.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.8f))
                ) {
                    Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.Black)
                }
            }

            // Content
            Surface(
                modifier = Modifier
                    .fillMaxSize()
                    .offset(y = (-32).dp),
                shape = RoundedCornerShape(topStart = 32.dp, topEnd = 32.dp),
                color = MaterialTheme.colorScheme.background
            ) {
                Column(modifier = Modifier.padding(24.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Top
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = serviceWithProvider.title ?: "Untitled",
                                style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold)
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Timer, contentDescription = null, modifier = Modifier.size(16.dp), tint = MaterialTheme.colorScheme.outline)
                                Text(
                                    text = " ${stringResource(R.string.minutes_session, serviceWithProvider.durationMinutes ?: 0)}",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.outline
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(24.dp))
                    
                    Text(text = stringResource(R.string.about_service), style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold))
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = serviceWithProvider.description ?: stringResource(R.string.no_description),
                        style = MaterialTheme.typography.bodyLarge.copy(lineHeight = 24.sp),
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f)
                    )

                    Spacer(modifier = Modifier.height(32.dp))
                    HorizontalDivider()
                    Spacer(modifier = Modifier.height(32.dp))

                    // Provider Profile Section
                    Text(text = stringResource(R.string.the_professional), style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold))
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(24.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.3f))
                    ) {
                        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                            AsyncImage(
                                model = provider.avatarUrl ?: "https://via.placeholder.com/100?text=User",
                                contentDescription = null,
                                modifier = Modifier.size(70.dp).clip(CircleShape),
                                contentScale = ContentScale.Crop
                            )
                            Spacer(modifier = Modifier.width(16.dp))
                            Column {
                                Text(text = provider.fullName, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                                Text(text = stringResource(R.string.years_experience, details?.experienceYears ?: 0), style = MaterialTheme.typography.bodyMedium)
                                if (details?.isVerified == true) {
                                    Surface(
                                        color = MaterialTheme.colorScheme.secondary,
                                        shape = RoundedCornerShape(8.dp),
                                        modifier = Modifier.padding(top = 4.dp)
                                    ) {
                                        Text(
                                            text = stringResource(R.string.verified),
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold, color = Color.White)
                                        )
                                    }
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))
                    
                    if (!details?.bio.isNullOrBlank()) {
                        Text(
                            text = details!!.bio!!,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                        )
                    }
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.LocationOn, contentDescription = null, modifier = Modifier.size(20.dp), tint = MaterialTheme.colorScheme.primary)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(text = "${provider.address}, ${provider.city}", style = MaterialTheme.typography.bodyMedium)
                    }

                    Spacer(modifier = Modifier.height(32.dp))
                }
            }
        }
    }
}
