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
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.pabirul.digisewa.Profile
import com.pabirul.digisewa.Service
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
    var title by remember { mutableStateOf(service?.title ?: "") }
    var description by remember { mutableStateOf(service?.description ?: "") }
    var basePrice by remember { mutableStateOf(service?.basePrice?.toString() ?: "") }
    var duration by remember { mutableStateOf(service?.durationMinutes?.toString() ?: "60") }
    
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
        if (state is ServiceState.Success) {
            onBack()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (service == null) "Add Service" else "Edit Service") },
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
                            Icon(Icons.Default.AddAPhoto, contentDescription = null)
                            Text("Add Main Image")
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Gallery Preview
            Text("Gallery Photos", style = MaterialTheme.typography.titleMedium)
            LazyRow(modifier = Modifier.fillMaxWidth().height(100.dp)) {
                // Existing Gallery from Database
                items(galleryFromDb) { item ->
                    AsyncImage(
                        model = item.imageUrl,
                        contentDescription = null,
                        modifier = Modifier.size(100.dp).padding(4.dp),
                        contentScale = ContentScale.Crop
                    )
                }
                // New Gallery Bitmaps selected by user
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
                        modifier = Modifier.size(100.dp).padding(4.dp).clickable { galleryLauncher.launch("image/*") }
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(Icons.Default.AddAPhoto, contentDescription = null)
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
                    label = { Text("Duration (Min)") },
                    modifier = Modifier.weight(1f),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            Button(
                onClick = {
                    val mainImageBytes = mainImageBitmap?.let { bitmapToBytes(it) }
                    val galleryBytes = galleryBitmaps.map { bitmapToBytes(it) }
                    
                    val newService = Service(
                        id = service?.id,
                        providerId = profile.id,
                        categoryId = 1, // Defaulting to Physiotherapy for pilot
                        title = title,
                        description = description,
                        basePrice = basePrice.toIntOrNull() ?: 0,
                        durationMinutes = duration.toIntOrNull() ?: 60,
                        mainImageUrl = service?.mainImageUrl
                    )
                    
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
            
            if (state is ServiceState.Error) {
                Text(
                    text = (state as ServiceState.Error).message,
                    color = MaterialTheme.colorScheme.error,
                    modifier = Modifier.padding(top = 8.dp)
                )
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
