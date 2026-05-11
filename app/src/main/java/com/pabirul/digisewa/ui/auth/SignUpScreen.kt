package com.pabirul.digisewa.ui.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.pabirul.digisewa.R
import com.pabirul.digisewa.UserRole

@Composable
fun SignUpScreen(
    viewModel: AuthViewModel,
    onNavigateToLogin: () -> Unit
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var fullName by remember { mutableStateOf("") }
    var role by remember { mutableStateOf(UserRole.CUSTOMER) }
    var agreedToTerms by remember { mutableStateOf(false) }
    var showTermsDialog by remember { mutableStateOf(false) }
    
    val authState by viewModel.authState.collectAsState()

    if (showTermsDialog) {
        AlertDialog(
            onDismissRequest = { showTermsDialog = false },
            title = { Text("Terms & Conditions") },
            text = {
                Column(modifier = Modifier.verticalScroll(rememberScrollState())) {
                    Text(
                        text = "For Customers:",
                        fontWeight = FontWeight.Bold,
                        style = MaterialTheme.typography.titleSmall
                    )
                    Text(
                        text = "1. Book only if you genuinely intend to use the service.\n" +
                               "2. You are obligated to pay the full agreed amount to the provider upon completion of the service.\n" +
                               "3. Ensure a safe environment for the provider.",
                        style = MaterialTheme.typography.bodySmall
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "For Service Providers:",
                        fontWeight = FontWeight.Bold,
                        style = MaterialTheme.typography.titleSmall
                    )
                    Text(
                        text = "1. Once you confirm a booking, you are bound to provide the service at the scheduled time.\n" +
                               "2. You must not overcharge the customer beyond the amount listed in the app.\n" +
                               "3. Professional behavior and respect are mandatory at all times.",
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            },
            confirmButton = {
                TextButton(onClick = { showTermsDialog = false }) {
                    Text("Close")
                }
            }
        )
    }

    val gradientBrush = Brush.verticalGradient(
        colors = listOf(
            MaterialTheme.colorScheme.tertiary.copy(alpha = 0.1f),
            MaterialTheme.colorScheme.background
        )
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(gradientBrush)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            androidx.compose.foundation.Image(
                painter = painterResource(id = R.drawable.ic_logo),
                contentDescription = "DigiSewa Logo",
                modifier = Modifier.size(150.dp)
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Create your account to get started",
                style = MaterialTheme.typography.bodyLarge.copy(color = MaterialTheme.colorScheme.outline)
            )
            
            Spacer(modifier = Modifier.height(32.dp))

            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(28.dp),
                color = MaterialTheme.colorScheme.surface,
                tonalElevation = 2.dp,
                shadowElevation = 8.dp
            ) {
                Column(modifier = Modifier.padding(24.dp)) {
                    OutlinedTextField(
                        value = fullName,
                        onValueChange = { fullName = it },
                        label = { Text("Full Name") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = it },
                        label = { Text("Email Address") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        label = { Text("Password") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        visualTransformation = PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                        singleLine = true
                    )
                    
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    Text(
                        text = "I am a:",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold)
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        FilterChip(
                            selected = role == UserRole.CUSTOMER,
                            onClick = { role = UserRole.CUSTOMER },
                            label = { Text("Customer") },
                            modifier = Modifier.weight(1f).padding(4.dp)
                        )
                        FilterChip(
                            selected = role == UserRole.PROVIDER,
                            onClick = { role = UserRole.PROVIDER },
                            label = { Text("Service Provider") },
                            modifier = Modifier.weight(1f).padding(4.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth().clickable { agreedToTerms = !agreedToTerms }
                    ) {
                        Checkbox(
                            checked = agreedToTerms,
                            onCheckedChange = { agreedToTerms = it }
                        )
                        Text(
                            text = "I agree to the ",
                            style = MaterialTheme.typography.bodySmall
                        )
                        Text(
                            text = "Terms & Conditions",
                            style = MaterialTheme.typography.bodySmall.copy(
                                color = MaterialTheme.colorScheme.primary,
                                fontWeight = FontWeight.Bold
                            ),
                            modifier = Modifier.clickable { showTermsDialog = true }
                        )
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    Button(
                        onClick = { viewModel.signUp(email, password, fullName, role) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.tertiary),
                        enabled = authState !is AuthState.Loading && agreedToTerms
                    ) {
                        if (authState is AuthState.Loading) {
                            CircularProgressIndicator(color = Color.White, size = 24.dp)
                        } else {
                            Text("Create Account", style = MaterialTheme.typography.titleMedium)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            TextButton(onClick = onNavigateToLogin) {
                Text(
                    "Already have an account? Login",
                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold)
                )
            }

            if (authState is AuthState.Error) {
                Text(
                    text = (authState as AuthState.Error).message,
                    color = MaterialTheme.colorScheme.error,
                    modifier = Modifier.padding(top = 16.dp),
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
    }
}
