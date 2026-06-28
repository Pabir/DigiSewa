package com.pabirul.digisewa.ui.profile

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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.pabirul.digisewa.Profile
import com.pabirul.digisewa.ProviderDetails
import com.pabirul.digisewa.Store
import com.pabirul.digisewa.UserRole
import java.io.ByteArrayOutputStream

import androidx.compose.ui.res.painterResource
import androidx.compose.ui.graphics.Color
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Edit
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.pabirul.digisewa.ui.components.AddressForm

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileSetupScreen(
    profile: Profile,
    viewModel: ProfileViewModel,
    onComplete: () -> Unit
) {
    val context = LocalContext.current
    var phoneNumber by remember { mutableStateOf(profile.phoneNumber ?: "") }
    var gender by remember { mutableStateOf(profile.gender ?: "Male") }
    var address by remember { mutableStateOf(profile.address ?: "") }
    var city by remember { mutableStateOf(profile.city ?: "") }
    var vtc by remember { mutableStateOf(profile.vtc ?: "") }
    var postOffice by remember { mutableStateOf(profile.postOffice ?: "") }
    var policeStation by remember { mutableStateOf(profile.policeStation ?: "") }
    var district by remember { mutableStateOf(profile.district ?: "") }
    var state by remember { mutableStateOf(profile.state ?: "") }
    var pinCode by remember { mutableStateOf(profile.pinCode ?: "") }
    
    // UI states
    var showFullScreenImage by remember { mutableStateOf(false) }
    
    // Provider specific
    var bio by remember { mutableStateOf("") }
    var experience by remember { mutableStateOf("") }
    var perSessionFee by remember { mutableStateOf("") }
    var workingHours by remember { mutableStateOf("9 AM - 6 PM") }
    var bankAccountNumber by remember { mutableStateOf("") }
    var bankIfsc by remember { mutableStateOf("") }
    var bankAccountName by remember { mutableStateOf("") }
    var selectedCategoryId by remember { mutableStateOf<Int?>(null) }

    // Shopkeeper specific
    var storeName by remember { mutableStateOf("") }
    var storeDescription by remember { mutableStateOf("") }
    var storePhone by remember { mutableStateOf("") }
    
    val categories by viewModel.categories.collectAsState()
    val setupState by viewModel.setupState.collectAsState()
    
    var bitmap by remember { mutableStateOf<Bitmap?>(null) }
    
    val launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            bitmap = if (Build.VERSION.SDK_INT < 28) {
                MediaStore.Images.Media.getBitmap(context.contentResolver, it)
            } else {
                val source = ImageDecoder.createSource(context.contentResolver, it)
                ImageDecoder.decodeBitmap(source)
            }
        }
    }

    LaunchedEffect(setupState) {
        if (setupState is ProfileSetupState.Success) {
            onComplete()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .navigationBarsPadding()
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        val isFirstTime = profile.phoneNumber.isNullOrBlank()
        Text(
            text = if (isFirstTime) "Complete Your Profile" else "Edit Profile",
            style = MaterialTheme.typography.headlineMedium
        )
        Spacer(modifier = Modifier.height(16.dp))

        Box(
            modifier = Modifier.size(140.dp),
            contentAlignment = Alignment.BottomEnd
        ) {
            Box(
                modifier = Modifier
                    .size(120.dp)
                    .clip(CircleShape)
                    .clickable { 
                        if (bitmap != null || !profile.avatarUrl.isNullOrBlank()) {
                            showFullScreenImage = true
                        } else {
                            launcher.launch("image/*")
                        }
                    },
                contentAlignment = Alignment.Center
            ) {
                if (bitmap != null) {
                    Image(
                        bitmap = bitmap!!.asImageBitmap(),
                        contentDescription = "Profile Picture",
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                } else if (!profile.avatarUrl.isNullOrBlank()) {
                    AsyncImage(
                        model = profile.avatarUrl,
                        contentDescription = "Profile Picture",
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                } else {
                    Surface(
                        color = MaterialTheme.colorScheme.surfaceVariant,
                        modifier = Modifier.fillMaxSize()
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = androidx.compose.material.icons.Icons.Default.Person,
                                contentDescription = null,
                                modifier = Modifier.size(48.dp),
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }
            
            // Edit Floating Button
            SmallFloatingActionButton(
                onClick = { launcher.launch("image/*") },
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = MaterialTheme.colorScheme.onPrimary,
                shape = CircleShape,
                modifier = Modifier.size(36.dp)
            ) {
                Icon(
                    imageVector = androidx.compose.material.icons.Icons.Default.Edit,
                    contentDescription = "Edit Profile Picture",
                    modifier = Modifier.size(20.dp)
                )
            }
        }

        // Full Screen Viewer Dialog
        if (showFullScreenImage) {
            Dialog(
                onDismissRequest = { showFullScreenImage = false },
                properties = DialogProperties(usePlatformDefaultWidth = false)
            ) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Color.Black.copy(alpha = 0.9f)
                ) {
                    Box(modifier = Modifier.fillMaxSize()) {
                        IconButton(
                            onClick = { showFullScreenImage = false },
                            modifier = Modifier.align(Alignment.TopStart).padding(16.dp)
                        ) {
                            Icon(
                                imageVector = androidx.compose.material.icons.Icons.Default.Close,
                                contentDescription = "Close",
                                tint = Color.White
                            )
                        }
                        
                        if (bitmap != null) {
                            Image(
                                bitmap = bitmap!!.asImageBitmap(),
                                contentDescription = null,
                                modifier = Modifier.fillMaxSize().padding(16.dp),
                                contentScale = ContentScale.Fit
                            )
                        } else {
                            AsyncImage(
                                model = profile.avatarUrl,
                                contentDescription = null,
                                modifier = Modifier.fillMaxSize().padding(16.dp),
                                contentScale = ContentScale.Fit
                            )
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        OutlinedTextField(
            value = phoneNumber,
            onValueChange = { phoneNumber = it },
            label = { Text("Phone Number") },
            modifier = Modifier.fillMaxWidth()
        )
        
        Spacer(modifier = Modifier.height(8.dp))

        Text("Gender")
        Row(verticalAlignment = Alignment.CenterVertically) {
            RadioButton(selected = gender == "Male", onClick = { gender = "Male" })
            Text("Male")
            Spacer(modifier = Modifier.width(16.dp))
            RadioButton(selected = gender == "Female", onClick = { gender = "Female" })
            Text("Female")
        }

        Spacer(modifier = Modifier.height(8.dp))

        AddressForm(
            initialPinCode = pinCode,
            initialAddress = address,
            initialVtc = vtc,
            initialPostOffice = postOffice,
            initialPoliceStation = policeStation,
            initialDistrict = district,
            initialState = state,
            onAddressChanged = { pin, addr, v, po, ps, d, s ->
                pinCode = pin
                address = addr
                vtc = v
                postOffice = po
                policeStation = ps
                district = d
                state = s
                // Set city to vtc by default if not set elsewhere
                if (city.isEmpty()) city = v
            }
        )

        if (profile.role == UserRole.PROVIDER) {
            Spacer(modifier = Modifier.height(24.dp))
            HorizontalDivider()
            Spacer(modifier = Modifier.height(16.dp))
            Text("Professional Details", style = MaterialTheme.typography.titleLarge)

            Spacer(modifier = Modifier.height(8.dp))

            var expanded by remember { mutableStateOf(false) }
            val filteredCategories = categories.filter { it.type == "service" }
            ExposedDropdownMenuBox(
                expanded = expanded,
                onExpandedChange = { expanded = !expanded }
            ) {
                OutlinedTextField(
                    value = filteredCategories.find { it.id == selectedCategoryId }?.name ?: "Select Category",
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Category") },
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                    modifier = Modifier.menuAnchor().fillMaxWidth()
                )
                ExposedDropdownMenu(
                    expanded = expanded,
                    onDismissRequest = { expanded = false }
                ) {
                    filteredCategories.forEach { category ->
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

            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = bio,
                onValueChange = { bio = it },
                label = { Text("Brief Bio") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 3
            )

            Spacer(modifier = Modifier.height(8.dp))

            Row {
                OutlinedTextField(
                    value = experience,
                    onValueChange = { experience = it },
                    label = { Text("Experience (Yrs)") },
                    modifier = Modifier.weight(1f)
                )
                Spacer(modifier = Modifier.width(8.dp))
                OutlinedTextField(
                    value = perSessionFee,
                    onValueChange = { perSessionFee = it },
                    label = { Text("Fee per session") },
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = workingHours,
                onValueChange = { workingHours = it },
                label = { Text("Working Hours") },
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(24.dp))
            HorizontalDivider()
            Spacer(modifier = Modifier.height(16.dp))
            Text("Payout Bank Details", style = MaterialTheme.typography.titleLarge)
            Text("Needed for automated payouts via Razorpay Route", style = MaterialTheme.typography.bodySmall)

            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = bankAccountName,
                onValueChange = { bankAccountName = it },
                label = { Text("Account Holder Name") },
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = bankAccountNumber,
                onValueChange = { bankAccountNumber = it },
                label = { Text("Bank Account Number") },
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = bankIfsc,
                onValueChange = { bankIfsc = it },
                label = { Text("Bank IFSC Code") },
                modifier = Modifier.fillMaxWidth()
            )
        }

        if (profile.role == UserRole.SHOPKEEPER) {
            Spacer(modifier = Modifier.height(24.dp))
            HorizontalDivider()
            Spacer(modifier = Modifier.height(16.dp))
            Text("Store Details", style = MaterialTheme.typography.titleLarge)

            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = storeName,
                onValueChange = { storeName = it },
                label = { Text("Store Name") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = storePhone,
                onValueChange = { storePhone = it },
                label = { Text("Store Phone Number") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = androidx.compose.ui.text.input.KeyboardType.Phone)
            )

            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = storeDescription,
                onValueChange = { storeDescription = it },
                label = { Text("Store Description") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 3
            )

            Spacer(modifier = Modifier.height(8.dp))

            var expanded by remember { mutableStateOf(false) }
            val filteredCategories = categories.filter { 
                if (profile.role == UserRole.PROVIDER) it.type == "service" else it.type == "store"
            }
            ExposedDropdownMenuBox(
                expanded = expanded,
                onExpandedChange = { expanded = !expanded }
            ) {
                OutlinedTextField(
                    value = filteredCategories.find { it.id == selectedCategoryId }?.name ?: "Select Store Category",
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Store Category") },
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                    modifier = Modifier.menuAnchor().fillMaxWidth()
                )
                ExposedDropdownMenu(
                    expanded = expanded,
                    onDismissRequest = { expanded = false }
                ) {
                    filteredCategories.forEach { category ->
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
        }

        Spacer(modifier = Modifier.height(32.dp))

        Button(
            onClick = {
                val avatarBytes = bitmap?.let {
                    val stream = ByteArrayOutputStream()
                    it.compress(Bitmap.CompressFormat.JPEG, 80, stream)
                    stream.toByteArray()
                }
                
                val updatedProfile = profile.copy(
                    phoneNumber = phoneNumber,
                    gender = gender,
                    address = address,
                    city = city,
                    vtc = vtc,
                    postOffice = postOffice,
                    policeStation = policeStation,
                    district = district,
                    state = state,
                    pinCode = pinCode
                )
                
                val providerDetails = if (profile.role == UserRole.PROVIDER) {
                    ProviderDetails(
                        id = profile.id,
                        categoryId = selectedCategoryId,
                        bio = bio,
                        experienceYears = experience.toIntOrNull(),
                        perSessionFee = perSessionFee.toIntOrNull(),
                        workingHours = workingHours,
                        bankAccountName = bankAccountName,
                        bankAccountNumber = bankAccountNumber,
                        bankIfsc = bankIfsc
                    )
                } else null

                val storeDetails = if (profile.role == UserRole.SHOPKEEPER) {
                    Store(
                        ownerId = profile.id,
                        name = storeName,
                        description = storeDescription,
                        phoneNumber = storePhone,
                        categoryId = selectedCategoryId,
                        address = address
                    )
                } else null

                viewModel.completeProfile(updatedProfile, providerDetails, storeDetails, avatarBytes)
            },
            modifier = Modifier.fillMaxWidth(),
            enabled = setupState !is ProfileSetupState.Loading
        ) {
            if (setupState is ProfileSetupState.Loading) {
                CircularProgressIndicator(modifier = Modifier.size(24.dp))
            } else {
                Text("Save Profile")
            }
        }

        if (setupState is ProfileSetupState.Error) {
            Text(
                text = (setupState as ProfileSetupState.Error).message,
                color = MaterialTheme.colorScheme.error,
                modifier = Modifier.padding(top = 8.dp)
            )
        }
    }
}
