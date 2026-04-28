package com.pabirul.digisewa.ui.bookings

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import java.util.*

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import java.time.Instant
import java.time.Duration

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.ui.Alignment
import java.util.Locale

import com.pabirul.digisewa.data.repository.BookingSlot
import kotlin.math.*

import androidx.compose.ui.res.stringResource
import com.pabirul.digisewa.R

@Composable
fun BookingRequestDialog(
    onDismiss: () -> Unit,
    onConfirm: (String, Double, Double, String) -> Unit, // Updated to include location
    unavailableSlots: List<BookingSlot> = emptyList(),
    onDateSelected: (String) -> Unit = {},
    isLoading: Boolean = false,
    serviceDurationMinutes: Int = 60 // Default duration for the new booking
) {
    val context = LocalContext.current
    val calendar = Calendar.getInstance()
    
    var selectedDate by remember { mutableStateOf("") } // ALWAYS YYYY-MM-DD (English)
    var selectedTimeSlot by remember { mutableStateOf("") }

    // Formatter for localized display ONLY
    val displayDate = remember(selectedDate) {
        if (selectedDate.isEmpty()) ""
        else {
            try {
                // Parse the English-stored date
                val date = java.time.LocalDate.parse(selectedDate)
                // Format it using the device's current locale for display
                val formatter = java.time.format.DateTimeFormatter.ofLocalizedDate(java.time.format.FormatStyle.MEDIUM)
                date.format(formatter)
            } catch (e: Exception) { selectedDate }
        }
    }

    // For now, simulating location selection (e.g. user's current city center)
    // Medinipur: 22.4257, 87.3199
    // Bauria: 22.4497, 88.1883
    var customerLat by remember { mutableStateOf(22.4497) } // Bauria Lat (Simulated)
    var customerLng by remember { mutableStateOf(88.1883) } // Bauria Lng (Simulated)
    var locationName by remember { mutableStateOf("Bauria, West Bengal") }

    // SIMPLE LOG TO CHECK IF DIALOG IS EVEN RUNNING
    LaunchedEffect(Unit) {
        android.util.Log.e("BookingDialog", "!!! DIALOG OPENED !!!")
        android.util.Log.e("BookingDialog", "Current unavailableSlots count: ${unavailableSlots.size}")
    }

    // Helper: Haversine distance in km
    fun calculateDistance(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        val r = 6371.0
        val dLat = Math.toRadians(lat2 - lat1)
        val dLon = Math.toRadians(lon2 - lon1)
        val a = sin(dLat / 2).pow(2) + cos(Math.toRadians(lat1)) * cos(Math.toRadians(lat2)) * sin(dLon / 2).pow(2)
        val c = 2 * atan2(sqrt(a), sqrt(1 - a))
        return r * c
    }

    // Helper: Estimate travel time in minutes (avg speed 30km/h)
    fun estimateTravelTime(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Int {
        val distance = calculateDistance(lat1, lon1, lat2, lon2)
        return ((distance / 30.0) * 60.0).toInt().coerceAtLeast(15) // Min 15 mins travel
    }

    // Generate time slots from 8 AM to 8 PM
    val allTimeSlots = remember {
        val slots = mutableListOf<String>()
        for (hour in 8..19) {
            slots.add(String.format(Locale.US, "%02d:00:00", hour))
            slots.add(String.format(Locale.US, "%02d:30:00", hour))
        }
        slots
    }

    // Filter slots based on unavailability and dynamic Travel + Service Duration
    val availableSlots = remember(selectedDate, unavailableSlots, customerLat, customerLng) {
        android.util.Log.e("BookingDialog", "Re-calculating slots. Count: ${unavailableSlots.size}")
        if (selectedDate.isEmpty()) emptyMap<String, Boolean>()
        else {
            allTimeSlots.associateWith { timeStr ->
                try {
                    val requestedStart = Instant.parse("${selectedDate}T${timeStr}Z")
                    val requestedEnd = requestedStart.plus(Duration.ofMinutes(serviceDurationMinutes.toLong()))
                    
                    val conflictSlot = unavailableSlots.find { bookedSlot ->
                        try {
                            val cleaned = bookedSlot.scheduledAt.replace(" ", "T")
                            val withZ = if (!cleaned.endsWith("Z") && !cleaned.contains("+")) "${cleaned}Z" else cleaned
                            val normalized = withZ.replace(Regex("\\+\\d{2}$"), "Z")
                            
                            val bookedStart = Instant.parse(normalized)
                            val bookedDuration = bookedSlot.service?.durationMinutes ?: 60
                            val bookedEnd = bookedStart.plus(Duration.ofMinutes(bookedDuration.toLong()))
                            
                            // Get travel time between Customer A and Customer B
                            val travelMinutes = if (bookedSlot.lat != null && bookedSlot.lng != null) {
                                estimateTravelTime(customerLat, customerLng, bookedSlot.lat, bookedSlot.lng)
                            } else {
                                60 // Fallback to 1 hour if location missing
                            }

                            // 1. INCOMING CHECK: Existing (A) is BEFORE New (B)
                            // Provider travels FROM A to B.
                            // Must finish A + Travel and arrive before B starts.
                            if (bookedStart.isBefore(requestedStart)) {
                                val arrivalAtB = bookedEnd.plus(Duration.ofMinutes(travelMinutes.toLong()))
                                if (arrivalAtB.isAfter(requestedStart)) {
                                    android.util.Log.e("BookingDialog", "INCOMING CONFLICT: A ends $bookedEnd, needs ${travelMinutes}m travel. Arrives at B at $arrivalAtB. B starts at $requestedStart.")
                                    return@find true
                                }
                            }
                            
                            // 2. OUTGOING CHECK: Existing (A) is AFTER New (B)
                            // Provider travels FROM B to A.
                            // Must finish B + Travel and arrive before A starts.
                            if (bookedStart.isAfter(requestedStart)) {
                                val arrivalAtA = requestedEnd.plus(Duration.ofMinutes(travelMinutes.toLong()))
                                if (arrivalAtA.isAfter(bookedStart)) {
                                    android.util.Log.e("BookingDialog", "OUTGOING CONFLICT: B ends $requestedEnd, needs ${travelMinutes}m travel. Arrives at A at $arrivalAtA. A starts at $bookedStart.")
                                    return@find true
                                }
                            }
                            
                            // 3. EXACT OVERLAP
                            if (bookedStart == requestedStart) return@find true

                            false
                        } catch (e: Exception) { false }
                    }
                    if (conflictSlot != null) {
                        android.util.Log.e("BookingDialog", "FINAL CONFLICT found for $timeStr with ${conflictSlot.scheduledAt}")
                    }
                    conflictSlot == null
                } catch (e: Exception) { true }
            }
        }
    }

    val datePickerDialog = DatePickerDialog(
        context,
        { _, year, month, day ->
            // Logic ALWAYS uses US Locale to prevent Bengali/Hindi digits from breaking DB/Logic
            val date = String.format(Locale.US, "%04d-%02d-%02d", year, month + 1, day)
            selectedDate = date
            selectedTimeSlot = "" // Reset time when date changes
            onDateSelected(date)
        },
        calendar.get(Calendar.YEAR),
        calendar.get(Calendar.MONTH),
        calendar.get(Calendar.DAY_OF_MONTH)
    )

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(stringResource(R.string.select_appointment_slot), fontWeight = FontWeight.Bold) },
        text = {
            Column(modifier = Modifier.fillMaxWidth().heightIn(max = 400.dp)) {
                OutlinedButton(
                    onClick = { datePickerDialog.show() },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(Icons.Default.DateRange, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(if (selectedDate.isEmpty()) stringResource(R.string.select_date) else displayDate)
                }
                
                Spacer(modifier = Modifier.height(16.dp))

                if (selectedDate.isNotEmpty()) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(stringResource(R.string.available_times_buffer), style = MaterialTheme.typography.labelMedium)
                        if (isLoading) {
                            Spacer(modifier = Modifier.width(8.dp))
                            CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    LazyVerticalGrid(
                        columns = GridCells.Fixed(3),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        items(allTimeSlots) { time ->
                            val isAvailable = availableSlots[time] ?: true
                            val isSelected = selectedTimeSlot == time
                            
                            val backgroundColor = when {
                                !isAvailable -> Color.Red.copy(alpha = 0.2f) // Changed from Gray for higher visibility
                                isSelected -> MaterialTheme.colorScheme.primary
                                else -> Color.Transparent
                            }
                            
                            val contentColor = when {
                                !isAvailable -> Color.Red
                                isSelected -> Color.White
                                else -> MaterialTheme.colorScheme.onSurface
                            }

                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(backgroundColor)
                                    .border(
                                        width = 1.dp,
                                        color = if (!isAvailable) Color.Red.copy(alpha = 0.5f) 
                                                else if (isSelected) MaterialTheme.colorScheme.primary 
                                                else Color.Gray.copy(alpha = 0.5f),
                                        shape = RoundedCornerShape(8.dp)
                                    )
                                    .clickable(enabled = isAvailable) {
                                        selectedTimeSlot = time
                                    }
                                    .padding(vertical = 12.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(
                                        text = time.substring(0, 5),
                                        color = contentColor,
                                        style = MaterialTheme.typography.bodyMedium,
                                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                    )
                                    if (!isAvailable) {
                                        Text(stringResource(R.string.booked), color = Color.Red, style = MaterialTheme.typography.labelSmall)
                                    }
                                }
                            }
                        }
                    }
                } else {
                    Box(modifier = Modifier.fillMaxWidth().weight(1f), contentAlignment = Alignment.Center) {
                        Text(stringResource(R.string.select_date), color = Color.Gray)
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (selectedDate.isNotEmpty() && selectedTimeSlot.isNotEmpty()) {
                        onConfirm("${selectedDate}T${selectedTimeSlot}Z", customerLat, customerLng, locationName)
                    }
                },
                enabled = selectedDate.isNotEmpty() && selectedTimeSlot.isNotEmpty()
            ) {
                Text(stringResource(R.string.confirm_booking))
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
