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

@Composable
fun BookingRequestDialog(
    onDismiss: () -> Unit,
    onConfirm: (String) -> Unit,
    unavailableSlots: List<String> = emptyList(),
    onDateSelected: (String) -> Unit = {},
    isLoading: Boolean = false
) {
    val context = LocalContext.current
    val calendar = Calendar.getInstance()
    
    var selectedDate by remember { mutableStateOf("") }
    var selectedTimeSlot by remember { mutableStateOf("") }

    // SIMPLE LOG TO CHECK IF DIALOG IS EVEN RUNNING
    LaunchedEffect(Unit) {
        android.util.Log.e("BookingDialog", "!!! DIALOG OPENED !!!")
        android.util.Log.e("BookingDialog", "Current unavailableSlots count: ${unavailableSlots.size}")
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

    // Filter slots based on unavailability and 2h buffer
    val availableSlots = remember(selectedDate, unavailableSlots) {
        android.util.Log.e("BookingDialog", "Re-calculating slots. Count: ${unavailableSlots.size}")
        if (selectedDate.isEmpty()) emptyMap<String, Boolean>()
        else {
            allTimeSlots.associateWith { timeStr ->
                try {
                    val requested = Instant.parse("${selectedDate}T${timeStr}Z")
                    val conflictSlot = unavailableSlots.find { bookedStr ->
                        try {
                            val cleaned = bookedStr.replace(" ", "T")
                            val withZ = if (!cleaned.endsWith("Z") && !cleaned.contains("+")) "${cleaned}Z" else cleaned
                            val normalized = withZ.replace(Regex("\\+\\d{2}$"), "Z")
                            val booked = Instant.parse(normalized)
                            
                            val diffMinutes = Duration.between(requested, booked).abs().toMinutes()
                            diffMinutes < 120 // 2 hours buffer
                        } catch (e: Exception) { false }
                    }
                    if (conflictSlot != null) {
                        android.util.Log.e("BookingDialog", "CONFLICT found for $timeStr with $conflictSlot")
                    }
                    conflictSlot == null
                } catch (e: Exception) { true }
            }
        }
    }

    val datePickerDialog = DatePickerDialog(
        context,
        { _, year, month, day ->
            val date = String.format("%04d-%02d-%02d", year, month + 1, day)
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
        title = { Text("Select Appointment Slot", fontWeight = FontWeight.Bold) },
        text = {
            Column(modifier = Modifier.fillMaxWidth().heightIn(max = 400.dp)) {
                OutlinedButton(
                    onClick = { datePickerDialog.show() },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(Icons.Default.DateRange, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(if (selectedDate.isEmpty()) "Select Date" else selectedDate)
                }
                
                Spacer(modifier = Modifier.height(16.dp))

                if (selectedDate.isNotEmpty()) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("Available Times (2h buffer enforced):", style = MaterialTheme.typography.labelMedium)
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
                                        Text("Booked", color = Color.Red, style = MaterialTheme.typography.labelSmall)
                                    }
                                }
                            }
                        }
                    }
                } else {
                    Box(modifier = Modifier.fillMaxWidth().weight(1f), contentAlignment = Alignment.Center) {
                        Text("Please select a date first", color = Color.Gray)
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (selectedDate.isNotEmpty() && selectedTimeSlot.isNotEmpty()) {
                        onConfirm("${selectedDate}T${selectedTimeSlot}Z")
                    }
                },
                enabled = selectedDate.isNotEmpty() && selectedTimeSlot.isNotEmpty()
            ) {
                Text("Confirm Booking")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
