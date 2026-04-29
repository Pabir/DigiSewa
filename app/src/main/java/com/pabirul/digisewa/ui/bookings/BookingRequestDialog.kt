package com.pabirul.digisewa.ui.bookings

import android.Manifest
import android.app.DatePickerDialog
import android.content.pm.PackageManager
import android.location.Geocoder
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.core.content.ContextCompat
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.pabirul.digisewa.Profile
import com.pabirul.digisewa.R
import com.pabirul.digisewa.data.repository.BookingSlot
import java.time.Duration
import java.time.Instant
import java.util.*
import kotlin.math.*

@Composable
fun BookingRequestDialog(
    onDismiss: () -> Unit,
    onConfirm: (String, Double, Double, String) -> Unit,
    unavailableSlots: List<BookingSlot> = emptyList(),
    onDateSelected: (String) -> Unit = {},
    isLoading: Boolean = false,
    serviceDurationMinutes: Int = 60,
    customerProfile: Profile? = null
) {
    val context = LocalContext.current
    val calendar = Calendar.getInstance()
    
    var currentStep by remember { mutableIntStateOf(1) } // 1: Location, 2: Slot
    
    var selectedDate by remember { mutableStateOf("") }
    var selectedTimeSlot by remember { mutableStateOf("") }
    
    var customerLat by remember { mutableDoubleStateOf(22.5726) } 
    var customerLng by remember { mutableDoubleStateOf(88.3639) }
    var locationName by remember { mutableStateOf("") }
    var isLocationSelected by remember { mutableStateOf(false) }
    var isFetchingLocation by remember { mutableStateOf(false) }
    
    var showAddressForm by remember { mutableStateOf(false) }

    // Manual Address States
    var mAddressName by remember { mutableStateOf("") }
    var mVtc by remember { mutableStateOf("") }
    var mPostOffice by remember { mutableStateOf("") }
    var mPoliceStation by remember { mutableStateOf("") }
    var mDistrict by remember { mutableStateOf("") }
    var mState by remember { mutableStateOf("") }
    var mPinCode by remember { mutableStateOf("") }

    val fusedLocationClient = remember { LocationServices.getFusedLocationProviderClient(context) }
    
    val locationPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        if (permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
            permissions[Manifest.permission.ACCESS_COARSE_LOCATION] == true) {
            try {
                isFetchingLocation = true
                fusedLocationClient.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, null)
                    .addOnSuccessListener { location ->
                        isFetchingLocation = false
                        if (location != null) {
                            customerLat = location.latitude
                            customerLng = location.longitude
                            locationName = "My Current Location"
                            isLocationSelected = true
                        }
                    }
                    .addOnFailureListener {
                        isFetchingLocation = false
                    }
            } catch (e: SecurityException) {
                isFetchingLocation = false
                android.util.Log.e("BookingDialog", "Permission check failed unexpectedly")
            }
        }
    }

    val displayDate = remember(selectedDate) {
        if (selectedDate.isEmpty()) ""
        else {
            try {
                val date = java.time.LocalDate.parse(selectedDate)
                val formatter = java.time.format.DateTimeFormatter.ofLocalizedDate(java.time.format.FormatStyle.MEDIUM)
                date.format(formatter)
            } catch (e: Exception) { selectedDate }
        }
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

    val allTimeSlots = remember {
        val slots = mutableListOf<String>()
        for (hour in 8..19) {
            slots.add(String.format(Locale.US, "%02d:00:00", hour))
            slots.add(String.format(Locale.US, "%02d:30:00", hour))
        }
        slots
    }

    val availableSlots = remember(selectedDate, unavailableSlots, customerLat, customerLng) {
        val now = Instant.now()
        if (selectedDate.isEmpty()) emptyMap<String, Boolean>()
        else {
            allTimeSlots.associateWith { timeStr ->
                try {
                    val requestedStart = Instant.parse("${selectedDate}T${timeStr}Z")
                    if (requestedStart.isBefore(now)) return@associateWith false

                    val requestedEnd = requestedStart.plus(Duration.ofMinutes(serviceDurationMinutes.toLong()))
                    
                    val conflictSlot = unavailableSlots.find { bookedSlot ->
                        try {
                            val cleaned = bookedSlot.scheduledAt.replace(" ", "T")
                            val normalized = (if (!cleaned.endsWith("Z") && !cleaned.contains("+")) "${cleaned}Z" else cleaned).replace(Regex("\\+\\d{2}$"), "Z")
                            
                            val bookedStart = Instant.parse(normalized)
                            val bookedDuration = bookedSlot.service?.durationMinutes ?: 60
                            val bookedEnd = bookedStart.plus(Duration.ofMinutes(bookedDuration.toLong()))
                            
                            val travelMinutes = if (bookedSlot.lat != null && bookedSlot.lng != null) {
                                estimateTravelTime(customerLat, customerLng, bookedSlot.lat, bookedSlot.lng)
                            } else 60

                            if (bookedStart.isBefore(requestedStart)) {
                                val arrivalAtB = bookedEnd.plus(Duration.ofMinutes(travelMinutes.toLong()))
                                if (arrivalAtB.isAfter(requestedStart)) return@find true
                            }
                            
                            if (bookedStart.isAfter(requestedStart)) {
                                val arrivalAtA = requestedEnd.plus(Duration.ofMinutes(travelMinutes.toLong()))
                                if (arrivalAtA.isAfter(bookedStart)) return@find true
                            }
                            
                            if (bookedStart == requestedStart) return@find true

                            false
                        } catch (e: Exception) { false }
                    }
                    conflictSlot == null
                } catch (e: Exception) { true }
            }
        }
    }

    if (showAddressForm) {
        Dialog(onDismissRequest = { showAddressForm = false }) {
            Surface(
                modifier = Modifier.fillMaxWidth().heightIn(max = 600.dp),
                shape = RoundedCornerShape(24.dp),
                color = MaterialTheme.colorScheme.surface
            ) {
                Column(
                    modifier = Modifier.padding(24.dp).verticalScroll(rememberScrollState())
                ) {
                    Text(stringResource(R.string.manual_address), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(16.dp))

                    OutlinedTextField(value = mAddressName, onValueChange = { mAddressName = it }, label = { Text(stringResource(R.string.address_name)) }, modifier = Modifier.fillMaxWidth())
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(value = mVtc, onValueChange = { mVtc = it }, label = { Text(stringResource(R.string.vtc_label)) }, modifier = Modifier.fillMaxWidth())
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(value = mPostOffice, onValueChange = { mPostOffice = it }, label = { Text(stringResource(R.string.post_office_label)) }, modifier = Modifier.fillMaxWidth())
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(value = mPoliceStation, onValueChange = { mPoliceStation = it }, label = { Text(stringResource(R.string.police_station_label)) }, modifier = Modifier.fillMaxWidth())
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(value = mDistrict, onValueChange = { mDistrict = it }, label = { Text(stringResource(R.string.district_label)) }, modifier = Modifier.fillMaxWidth())
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(value = mState, onValueChange = { mState = it }, label = { Text(stringResource(R.string.state_label)) }, modifier = Modifier.fillMaxWidth())
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(value = mPinCode, onValueChange = { mPinCode = it }, label = { Text(stringResource(R.string.pincode_label)) }, modifier = Modifier.fillMaxWidth())
                    
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    Button(
                        onClick = {
                            val fullAddress = "$mVtc, $mPostOffice, $mDistrict, $mState $mPinCode"
                            locationName = if (mAddressName.isNotEmpty()) "$mAddressName ($fullAddress)" else fullAddress
                            
                            try {
                                val geocoder = Geocoder(context, Locale.US)
                                val addresses = geocoder.getFromLocationName(fullAddress, 1)
                                if (!addresses.isNullOrEmpty()) {
                                    customerLat = addresses[0].latitude
                                    customerLng = addresses[0].longitude
                                }
                            } catch (e: Exception) {
                                android.util.Log.e("BookingDialog", "Geocoding failed: ${e.message}")
                            }
                            
                            isLocationSelected = true
                            showAddressForm = false
                        },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = mVtc.isNotEmpty() && mPinCode.isNotEmpty()
                    ) {
                        Text(stringResource(R.string.confirm_address))
                    }
                }
            }
        }
    }

    val datePickerDialog = DatePickerDialog(
        context,
        { _, year, month, day ->
            val date = String.format(Locale.US, "%04d-%02d-%02d", year, month + 1, day)
            selectedDate = date
            selectedTimeSlot = ""
            onDateSelected(date)
        },
        calendar.get(Calendar.YEAR),
        calendar.get(Calendar.MONTH),
        calendar.get(Calendar.DAY_OF_MONTH)
    )

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { 
            Text(
                text = if (currentStep == 1) stringResource(R.string.where_service_prompt) else stringResource(R.string.select_appointment_slot), 
                fontWeight = FontWeight.Bold 
            ) 
        },
        text = {
            Column(modifier = Modifier.fillMaxWidth().heightIn(max = 450.dp)) {
                if (currentStep == 1) {
                    // Option 1: Profile Home Address
                    OutlinedCard(
                        onClick = {
                            locationName = customerProfile?.address ?: ""
                            isLocationSelected = locationName.isNotEmpty()
                            // Ideally, geocode this once
                        },
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.outlinedCardColors(
                            containerColor = if (isLocationSelected && locationName == customerProfile?.address) MaterialTheme.colorScheme.primaryContainer else Color.Transparent
                        )
                    ) {
                        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Home, contentDescription = null)
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(stringResource(R.string.use_home_address), fontWeight = FontWeight.Bold)
                                Text(customerProfile?.address ?: stringResource(R.string.no_address_saved), style = MaterialTheme.typography.bodySmall)
                            }
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    // Option 2: Current GPS
                    OutlinedCard(
                        onClick = {
                            val hasFineLocation = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                            if (hasFineLocation) {
                                isFetchingLocation = true
                                fusedLocationClient.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, null)
                                    .addOnSuccessListener { location ->
                                        isFetchingLocation = false
                                        if (location != null) {
                                            customerLat = location.latitude
                                            customerLng = location.longitude
                                            locationName = "Current GPS Location"
                                            isLocationSelected = true
                                        }
                                    }
                                    .addOnFailureListener {
                                        isFetchingLocation = false
                                    }
                            } else {
                                locationPermissionLauncher.launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION))
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = !isFetchingLocation
                    ) {
                        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                            if (isFetchingLocation) {
                                CircularProgressIndicator(modifier = Modifier.size(24.dp), strokeWidth = 2.dp)
                            } else {
                                Icon(Icons.Default.MyLocation, contentDescription = null)
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Text(stringResource(R.string.use_current_location), fontWeight = FontWeight.Bold)
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))
                    
                    // Option 3: Manual Address
                    OutlinedCard(
                        onClick = { showAddressForm = true },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.EditLocation, contentDescription = null)
                            Spacer(modifier = Modifier.width(12.dp))
                            Text(stringResource(R.string.manual_address), fontWeight = FontWeight.Bold)
                        }
                    }
                    
                    if (isLocationSelected) {
                        Spacer(modifier = Modifier.height(16.dp))
                        Surface(color = MaterialTheme.colorScheme.secondaryContainer, shape = RoundedCornerShape(8.dp)) {
                            Text(
                                text = stringResource(R.string.selected_location, locationName),
                                modifier = Modifier.padding(8.dp),
                                style = MaterialTheme.typography.labelSmall
                            )
                        }
                    }
                } else {
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
                                val slotDateTime = try {
                                    java.time.LocalDateTime.parse("${selectedDate}T${time}")
                                } catch (e: Exception) { null }
                                
                                val isSlotInPast = slotDateTime?.isBefore(java.time.LocalDateTime.now()) ?: false

                                val isBooked = unavailableSlots.any { bookedSlot ->
                                    try {
                                        val requestedStart = Instant.parse("${selectedDate}T${time}Z")
                                        val requestedEnd = requestedStart.plus(Duration.ofMinutes(serviceDurationMinutes.toLong()))
                                        val cleaned = bookedSlot.scheduledAt.replace(" ", "T")
                                        val normalized = (if (!cleaned.endsWith("Z") && !cleaned.contains("+")) "${cleaned}Z" else cleaned).replace(Regex("\\+\\d{2}$"), "Z")
                                        val bookedStart = Instant.parse(normalized)
                                        val bookedDuration = bookedSlot.service?.durationMinutes ?: 60
                                        val bookedEnd = bookedStart.plus(Duration.ofMinutes(bookedDuration.toLong()))
                                        
                                        val travelMin = if (bookedSlot.lat != null && bookedSlot.lng != null) {
                                            estimateTravelTime(customerLat, customerLng, bookedSlot.lat, bookedSlot.lng)
                                        } else 60

                                        (bookedStart == requestedStart) ||
                                        (bookedStart.isBefore(requestedStart) && bookedEnd.plus(Duration.ofMinutes(travelMin.toLong())).isAfter(requestedStart)) ||
                                        (bookedStart.isAfter(requestedStart) && requestedEnd.plus(Duration.ofMinutes(travelMin.toLong())).isAfter(bookedStart))
                                    } catch (e: Exception) { false }
                                }

                                val isAvailable = !isLoading && !isSlotInPast && !isBooked
                                val isSelected = selectedTimeSlot == time
                                
                                val backgroundColor = when {
                                    isSlotInPast -> Color.Gray.copy(alpha = 0.15f)
                                    isBooked -> Color.Red.copy(alpha = 0.4f)
                                    isSelected -> MaterialTheme.colorScheme.primary
                                    else -> Color.Transparent
                                }
                                
                                val contentColor = when {
                                    isSlotInPast -> Color.LightGray
                                    isBooked -> Color.Red
                                    isSelected -> Color.White
                                    else -> MaterialTheme.colorScheme.onSurface
                                }

                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(backgroundColor)
                                        .border(
                                            width = 1.dp,
                                            color = if (isSlotInPast) Color.Gray.copy(alpha = 0.2f)
                                                    else if (isBooked) Color.Red.copy(alpha = 0.6f)
                                                    else if (isSelected) MaterialTheme.colorScheme.primary 
                                                    else Color.Gray.copy(alpha = 0.5f),
                                            shape = RoundedCornerShape(8.dp)
                                        )
                                        .clickable(enabled = isAvailable) { selectedTimeSlot = time }
                                        .padding(vertical = 12.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text(text = time.substring(0, 5), color = contentColor, style = MaterialTheme.typography.bodyMedium, fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal)
                                        if (isBooked) {
                                            Text(stringResource(R.string.booked), color = Color.Red, style = MaterialTheme.typography.labelSmall)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            if (currentStep == 1) {
                Button(onClick = { currentStep = 2 }, enabled = isLocationSelected, modifier = Modifier.fillMaxWidth()) {
                    Text(stringResource(R.string.next_select_time))
                }
            } else {
                val isSelectionValid = selectedDate.isNotEmpty() && selectedTimeSlot.isNotEmpty() && !isLoading
                Button(
                    onClick = {
                        if (isSelectionValid) {
                            onConfirm("${selectedDate}T${selectedTimeSlot}Z", customerLat, customerLng, locationName)
                        }
                    },
                    enabled = isSelectionValid
                ) {
                    Text(stringResource(R.string.confirm_booking))
                }
            }
        },
        dismissButton = {
            TextButton(onClick = { if (currentStep == 2) currentStep = 1 else onDismiss() }) {
                Text(if (currentStep == 2) stringResource(R.string.back) else stringResource(R.string.cancel))
            }
        }
    )
}
