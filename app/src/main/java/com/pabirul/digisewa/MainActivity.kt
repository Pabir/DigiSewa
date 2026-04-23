package com.pabirul.digisewa

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import com.pabirul.digisewa.ui.auth.*
import com.pabirul.digisewa.ui.profile.ProfileSetupScreen
import com.pabirul.digisewa.ui.profile.ProfileViewModel
import com.pabirul.digisewa.ui.theme.DigiSewaTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            DigiSewaTheme {
                val authViewModel: AuthViewModel = viewModel()
                val authState by authViewModel.authState.collectAsState()
                
                var currentScreen by remember { mutableStateOf("login") }

                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    Box(modifier = Modifier.padding(innerPadding)) {
                        when (val state = authState) {
                            is AuthState.Loading -> {
                                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                    CircularProgressIndicator()
                                }
                            }
                            is AuthState.Authenticated -> {
                                if (isProfileIncomplete(state.profile)) {
                                    val profileViewModel: ProfileViewModel = viewModel()
                                    ProfileSetupScreen(
                                        profile = state.profile,
                                        viewModel = profileViewModel,
                                        onComplete = { authViewModel.refreshProfile() }
                                    )
                                } else {
                                    DashboardScreen(state.profile, onSignOut = { authViewModel.signOut() })
                                }
                            }
                            else -> {
                                if (currentScreen == "login") {
                                    LoginScreen(
                                        viewModel = authViewModel,
                                        onNavigateToSignUp = { currentScreen = "signup" }
                                    )
                                } else {
                                    SignUpScreen(
                                        viewModel = authViewModel,
                                        onNavigateToLogin = { currentScreen = "login" }
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    private fun isProfileIncomplete(profile: Profile): Boolean {
        return profile.phoneNumber.isNullOrBlank() || profile.city.isNullOrBlank()
    }
}

@Composable
fun DashboardScreen(profile: Profile, onSignOut: () -> Unit) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        androidx.compose.foundation.layout.Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(text = "Welcome, ${profile.fullName}!")
            Text(text = "Role: ${profile.role}")
            Text(text = "City: ${profile.city}")
            androidx.compose.material3.Button(onClick = onSignOut) {
                Text("Sign Out")
            }
        }
    }
}
