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
import com.pabirul.digisewa.UserRole
import java.io.ByteArrayOutputStream

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
    
    // Provider specific
    var bio by remember { mutableStateOf("") }
    var experience by remember { mutableStateOf("") }
    var perSessionFee by remember { mutableStateOf("") }
    var workingHours by remember { mutableStateOf("9 AM - 6 PM") }
    var selectedCategoryId by remember { mutableStateOf<Int?>(null) }
    
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
            modifier = Modifier
                .size(120.dp)
                .clip(CircleShape)
                .clickable { launcher.launch("image/*") },
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
                        Text("Tap to upload photo")
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

        OutlinedTextField(
            value = address,
            onValueChange = { address = it },
            label = { Text("House Address") },
            modifier = Modifier.fillMaxWidth()
        )
        
        Spacer(modifier = Modifier.height(8.dp))

        OutlinedTextField(
            value = city,
            onValueChange = { city = it },
            label = { Text("City") },
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(8.dp))

        OutlinedTextField(
            value = vtc,
            onValueChange = { vtc = it },
            label = { Text("VTC (Village/Town/City)") },
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(8.dp))

        OutlinedTextField(
            value = postOffice,
            onValueChange = { postOffice = it },
            label = { Text("Post Office") },
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(8.dp))

        OutlinedTextField(
            value = policeStation,
            onValueChange = { policeStation = it },
            label = { Text("Police Station") },
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(8.dp))

        OutlinedTextField(
            value = district,
            onValueChange = { district = it },
            label = { Text("District") },
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(8.dp))

        OutlinedTextField(
            value = state,
            onValueChange = { state = it },
            label = { Text("State") },
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(8.dp))

        OutlinedTextField(
            value = pinCode,
            onValueChange = { pinCode = it },
            label = { Text("PIN Code") },
            modifier = Modifier.fillMaxWidth()
        )

        if (profile.role == UserRole.PROVIDER) {
            Spacer(modifier = Modifier.height(24.dp))
            HorizontalDivider()
            Spacer(modifier = Modifier.height(16.dp))
            Text("Professional Details", style = MaterialTheme.typography.titleLarge)

            Spacer(modifier = Modifier.height(8.dp))

            var expanded by remember { mutableStateOf(false) }
            ExposedDropdownMenuBox(
                expanded = expanded,
                onExpandedChange = { expanded = !expanded }
            ) {
                OutlinedTextField(
                    value = categories.find { it.id == selectedCategoryId }?.name ?: "Select Category",
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
                        workingHours = workingHours
                    )
                } else null
                
                viewModel.completeProfile(updatedProfile, providerDetails, avatarBytes)
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
