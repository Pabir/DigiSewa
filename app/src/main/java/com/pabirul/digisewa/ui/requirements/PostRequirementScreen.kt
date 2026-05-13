package com.pabirul.digisewa.ui.requirements

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import android.graphics.Bitmap
import android.graphics.ImageDecoder
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddAPhoto
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.pabirul.digisewa.Category
import com.pabirul.digisewa.Profile
import com.pabirul.digisewa.R
import com.pabirul.digisewa.Requirement
import com.pabirul.digisewa.ui.map.OSMMapPicker
import java.io.ByteArrayOutputStream
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PostRequirementScreen(
    profile: Profile,
    categories: List<Category>,
    viewModel: RequirementViewModel,
    onSuccess: () -> Unit
) {
    val context = LocalContext.current
    var description by remember { mutableStateOf("") }
    var budget by remember { mutableStateOf("") }
    var selectedCategoryId by remember { mutableStateOf<Int?>(null) }
    var locationName by remember { mutableStateOf(profile.city ?: "") }
    var lat by remember { mutableDoubleStateOf(0.0) }
    var lng by remember { mutableDoubleStateOf(0.0) }
    
    var scheduledAt by remember { mutableStateOf<String?>(null) }
    
    var showMapPicker by remember { mutableStateOf(false) }
    val photos = remember { mutableStateListOf<Bitmap>() }
    
    val state by viewModel.state.collectAsState()

    val launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            val bitmap = if (Build.VERSION.SDK_INT < 28) {
                MediaStore.Images.Media.getBitmap(context.contentResolver, it)
            } else {
                val source = ImageDecoder.createSource(context.contentResolver, it)
                ImageDecoder.decodeBitmap(source)
            }
            photos.add(bitmap)
        }
    }

    LaunchedEffect(state) {
        if (state is RequirementState.Success) {
            onSuccess()
            viewModel.resetState()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Text(
            text = stringResource(R.string.post_requirement),
            style = MaterialTheme.typography.headlineSmall
        )
        
        Spacer(modifier = Modifier.height(16.dp))

        // Category Selection
        var expanded by remember { mutableStateOf(false) }
        ExposedDropdownMenuBox(
            expanded = expanded,
            onExpandedChange = { expanded = !expanded }
        ) {
            OutlinedTextField(
                value = categories.find { it.id == selectedCategoryId }?.name ?: stringResource(R.string.requirement_category),
                onValueChange = {},
                readOnly = true,
                label = { Text(stringResource(R.string.requirement_category)) },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                modifier = Modifier.menuAnchor().fillMaxWidth()
            )
            ExposedDropdownMenu(
                expanded = expanded,
                onDismissRequest = { expanded = false }
            ) {
                categories.forEach { category ->
                    DropdownMenuItem(
                        text = { Text(category.name) },
                        onClick = {
                            selectedCategoryId = category.id
                            expanded = false
                        }
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
            value = description,
            onValueChange = { description = it },
            label = { Text(stringResource(R.string.requirement_description)) },
            modifier = Modifier.fillMaxWidth(),
            minLines = 3
        )

        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
            value = budget,
            onValueChange = { budget = it },
            label = { Text(stringResource(R.string.requirement_budget)) },
            modifier = Modifier.fillMaxWidth(),
            prefix = { Text("₹") }
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Date & Time Picker
        val calendar = Calendar.getInstance()
        val datePickerDialog = DatePickerDialog(
            context,
            { _, y, m, d ->
                TimePickerDialog(context, { _, hh, mm ->
                    scheduledAt = String.format(Locale.US, "%04d-%02d-%02dT%02d:%02d:00Z", y, m + 1, d, hh, mm)
                }, calendar.get(Calendar.HOUR_OF_DAY), calendar.get(Calendar.MINUTE), true).show()
            },
            calendar.get(Calendar.YEAR),
            calendar.get(Calendar.MONTH),
            calendar.get(Calendar.DAY_OF_MONTH)
        )

        OutlinedTextField(
            value = scheduledAt?.replace("T", " ")?.replace("Z", "") ?: "",
            onValueChange = {},
            readOnly = true,
            label = { Text("Proposed Date & Time") },
            modifier = Modifier.fillMaxWidth(),
            trailingIcon = {
                IconButton(onClick = { datePickerDialog.show() }) {
                    Icon(Icons.Default.CalendarToday, contentDescription = "Pick Date")
                }
            }
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Location Picker
        OutlinedTextField(
            value = locationName,
            onValueChange = { locationName = it },
            label = { Text(stringResource(R.string.where_service_prompt)) },
            modifier = Modifier.fillMaxWidth(),
            trailingIcon = {
                IconButton(onClick = { showMapPicker = true }) {
                    Icon(Icons.Default.LocationOn, contentDescription = "Pick on Map")
                }
            }
        )

        if (showMapPicker) {
            OSMMapPicker(
                initialLat = if (lat != 0.0) lat else 22.5726, // Default to Kolkata if not set
                initialLng = if (lng != 0.0) lng else 88.3639,
                onLocationPicked = { l, g ->
                    lat = l
                    lng = g
                    showMapPicker = false
                },
                onDismiss = { showMapPicker = false }
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Photos
        Text(text = stringResource(R.string.add_photos), style = MaterialTheme.typography.titleMedium)
        Spacer(modifier = Modifier.height(8.dp))
        
        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            item {
                Card(
                    modifier = Modifier
                        .size(100.dp)
                        .clickable { launcher.launch("image/*") },
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                        Icon(Icons.Default.AddAPhoto, contentDescription = null)
                    }
                }
            }
            items(photos) { bitmap ->
                Box {
                    Image(
                        bitmap = bitmap.asImageBitmap(),
                        contentDescription = null,
                        modifier = Modifier
                            .size(100.dp)
                            .clip(RoundedCornerShape(12.dp)),
                        contentScale = ContentScale.Crop
                    )
                    IconButton(
                        onClick = { photos.remove(bitmap) },
                        modifier = Modifier.align(Alignment.TopEnd).size(24.dp)
                    ) {
                        Icon(Icons.Default.Close, contentDescription = "Remove", tint = MaterialTheme.colorScheme.error)
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(32.dp))

        Button(
            onClick = {
                if (selectedCategoryId == null || description.isBlank()) return@Button
                if (scheduledAt == null) {
                    viewModel.setError("Please select a proposed date & time")
                    return@Button
                }
                
                val requirement = Requirement(
                    customerId = profile.id,
                    categoryId = selectedCategoryId!!,
                    description = description,
                    budget = budget.toIntOrNull(),
                    locationName = locationName,
                    lat = lat,
                    lng = lng,
                    scheduledAt = scheduledAt
                )
                
                val photoBytes = photos.map {
                    val stream = ByteArrayOutputStream()
                    it.compress(Bitmap.CompressFormat.JPEG, 80, stream)
                    stream.toByteArray()
                }
                
                viewModel.postRequirement(requirement, photoBytes)
            },
            modifier = Modifier.fillMaxWidth(),
            enabled = state !is RequirementState.Loading
        ) {
            if (state is RequirementState.Loading) {
                CircularProgressIndicator(modifier = Modifier.size(24.dp))
            } else {
                Text(stringResource(R.string.post_now))
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
