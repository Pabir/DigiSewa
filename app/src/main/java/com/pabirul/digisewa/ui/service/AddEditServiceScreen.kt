package com.pabirul.digisewa.ui.service

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
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddAPhoto
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.pabirul.digisewa.Profile
import com.pabirul.digisewa.R
import com.pabirul.digisewa.Service
import kotlinx.coroutines.launch
import java.io.ByteArrayOutputStream

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddEditServiceScreen(
    profile: Profile,
    service: Service?,
    viewModel: ServiceViewModel,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }
    
    var title by remember { mutableStateOf(service?.title ?: "") }
    var description by remember { mutableStateOf(service?.description ?: "") }
    var basePrice by remember { mutableStateOf(service?.basePrice?.toString() ?: "") }
    var duration by remember { mutableStateOf(service?.durationMinutes?.toString() ?: "60") }
    var durationUnit by remember { mutableStateOf(service?.durationUnit ?: "Minutes") }
    var isActive by remember { mutableStateOf(service?.isActive ?: true) }
    
    val durationUnits = listOf("Minutes", "Hours", "Days", "Weeks", "Months")
    var durationUnitExpanded by remember { mutableStateOf(false) }
    
    var mainImageBitmap by remember { mutableStateOf<Bitmap?>(null) }
    val galleryBitmaps = remember { mutableStateListOf<Bitmap>() }
    
    val galleryFromDb by viewModel.gallery.collectAsState()
    val state by viewModel.serviceState.collectAsState()

    LaunchedEffect(service?.id) {
        service?.id?.let {
            viewModel.loadGallery(it)
        }
    }

    val mainImageLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            mainImageBitmap = uriToBitmap(context, it)
        }
    }

    val galleryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetMultipleContents()
    ) { uris: List<Uri> ->
        uris.forEach { uri ->
            galleryBitmaps.add(uriToBitmap(context, uri))
        }
    }

    LaunchedEffect(state) {
        when (state) {
            is ServiceState.Success -> {
                scope.launch {
                    snackbarHostState.showSnackbar("Service saved successfully!")
                    onBack()
                }
            }
            is ServiceState.Error -> {
                scope.launch {
                    snackbarHostState.showSnackbar("Error: ${(state as ServiceState.Error).message}")
                }
            }
            else -> {}
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(hostState = snackbarHostState) },
        topBar = {
            TopAppBar(
                title = { Text(if (service == null) "Add Service" else "Edit Service", fontWeight = FontWeight.Bold) },
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
                .padding(padding)
                .padding(16.dp)
                .fillMaxSize()
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Main Image Picker
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp)
                    .clickable { mainImageLauncher.launch("image/*") },
                contentAlignment = Alignment.Center
            ) {
                if (mainImageBitmap != null) {
                    Image(
                        bitmap = mainImageBitmap!!.asImageBitmap(),
                        contentDescription = "Main Image",
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                } else if (!service?.mainImageUrl.isNullOrBlank()) {
                    AsyncImage(
                        model = service?.mainImageUrl,
                        contentDescription = "Main Image",
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                } else {
                    Surface(color = MaterialTheme.colorScheme.surfaceVariant, modifier = Modifier.fillMaxSize()) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                            Icon(
                                imageVector = Icons.Default.AddAPhoto,
                                contentDescription = null,
                                modifier = Modifier.size(48.dp),
                                tint = MaterialTheme.colorScheme.primary.copy(alpha = 0.6f)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("Add Main Image", style = MaterialTheme.typography.bodyMedium)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Gallery Preview
            Text("Gallery Photos", style = MaterialTheme.typography.titleMedium)
            LazyRow(modifier = Modifier.fillMaxWidth().height(100.dp)) {
                items(galleryFromDb) { item ->
                    AsyncImage(
                        model = item.imageUrl,
                        contentDescription = null,
                        modifier = Modifier.size(100.dp).padding(4.dp),
                        contentScale = ContentScale.Crop
                    )
                }
                items(galleryBitmaps) { bitmap ->
                    Image(
                        bitmap = bitmap.asImageBitmap(),
                        contentDescription = null,
                        modifier = Modifier.size(100.dp).padding(4.dp),
                        contentScale = ContentScale.Crop
                    )
                }
                item {
                    Surface(
                        color = MaterialTheme.colorScheme.surfaceVariant,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.size(100.dp).padding(4.dp).clickable { galleryLauncher.launch("image/*") }
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Icon(
                                    imageVector = Icons.Default.AddAPhoto,
                                    contentDescription = null,
                                    modifier = Modifier.size(32.dp),
                                    tint = MaterialTheme.colorScheme.primary.copy(alpha = 0.6f)
                                )
                                Text("Add More", style = MaterialTheme.typography.labelSmall)
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            OutlinedTextField(
                value = title,
                onValueChange = { title = it },
                label = { Text("Service Title") },
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = description,
                onValueChange = { description = it },
                label = { Text("Description") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 3
            )

            Spacer(modifier = Modifier.height(8.dp))

            Row {
                OutlinedTextField(
                    value = basePrice,
                    onValueChange = { basePrice = it },
                    label = { Text("Base Price (₹)") },
                    modifier = Modifier.weight(1f),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                )
                Spacer(modifier = Modifier.width(8.dp))
                OutlinedTextField(
                    value = duration,
                    onValueChange = { duration = it },
                    label = { Text("Duration") },
                    modifier = Modifier.weight(1f),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                )
                Spacer(modifier = Modifier.width(8.dp))
                ExposedDropdownMenuBox(
                    expanded = durationUnitExpanded,
                    onExpandedChange = { durationUnitExpanded = !durationUnitExpanded },
                    modifier = Modifier.weight(1f)
                ) {
                    OutlinedTextField(
                        value = durationUnit,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Unit") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = durationUnitExpanded) },
                        modifier = Modifier.menuAnchor().fillMaxWidth()
                    )
                    ExposedDropdownMenu(
                        expanded = durationUnitExpanded,
                        onDismissRequest = { durationUnitExpanded = false }
                    ) {
                        durationUnits.forEach { unit ->
                            DropdownMenuItem(
                                text = { Text(unit) },
                                onClick = {
                                    durationUnit = unit
                                    durationUnitExpanded = false
                                }
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
                Text("Show to Customers", modifier = Modifier.weight(1f))
                Switch(checked = isActive, onCheckedChange = { isActive = it })
            }

            Spacer(modifier = Modifier.height(24.dp))

            Button(
                onClick = {
                    if (title.isBlank()) {
                        viewModel.setError("Please enter a service title")
                        return@Button
                    }
                    
                    val cleanPrice = basePrice.replace(Regex("[^0-9]"), "")
                    val cleanDuration = duration.replace(Regex("[^0-9]"), "")
                    
                    val price = cleanPrice.toIntOrNull()
                    if (price == null || price <= 0) {
                        viewModel.setError("Please enter a valid price")
                        return@Button
                    }

                    val mainImageBytes = mainImageBitmap?.let { bitmapToBytes(it) }
                    val galleryBytes = galleryBitmaps.map { bitmapToBytes(it) }
                    
                    val newService = Service(
                        id = service?.id,
                        providerId = profile.id,
                        categoryId = profile.providerDetails?.categoryId ?: 1,
                        title = title,
                        description = description,
                        basePrice = price,
                        durationMinutes = cleanDuration.toIntOrNull() ?: 60,
                        durationUnit = durationUnit,
                        mainImageUrl = service?.mainImageUrl,
                        isActive = isActive
                    )
                    
                    android.util.Log.d("AddEditService", "Attempting to save: $newService")
                    viewModel.saveService(newService, mainImageBytes, galleryBytes)
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = state !is ServiceState.Loading
            ) {
                if (state is ServiceState.Loading) {
                    CircularProgressIndicator(modifier = Modifier.size(24.dp))
                } else {
                    Text("Save Service")
                }
            }
        }
    }
}

private fun uriToBitmap(context: android.content.Context, uri: Uri): Bitmap {
    return if (Build.VERSION.SDK_INT < 28) {
        MediaStore.Images.Media.getBitmap(context.contentResolver, uri)
    } else {
        val source = ImageDecoder.createSource(context.contentResolver, uri)
        ImageDecoder.decodeBitmap(source)
    }
}

private fun bitmapToBytes(bitmap: Bitmap): ByteArray {
    val stream = ByteArrayOutputStream()
    bitmap.compress(Bitmap.CompressFormat.JPEG, 80, stream)
    return stream.toByteArray()
}
