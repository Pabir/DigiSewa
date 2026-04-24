package com.pabirul.digisewa

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.pabirul.digisewa.ui.auth.*
import com.pabirul.digisewa.ui.components.AppDrawer
import com.pabirul.digisewa.ui.discovery.*
import com.pabirul.digisewa.ui.profile.ProfileSetupScreen
import com.pabirul.digisewa.ui.profile.ProfileViewModel
import com.pabirul.digisewa.ui.service.AddEditServiceScreen
import com.pabirul.digisewa.ui.service.ManageServicesScreen
import com.pabirul.digisewa.ui.service.ServiceViewModel
import com.pabirul.digisewa.ui.theme.DigiSewaTheme
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            DigiSewaTheme {
                val authViewModel: AuthViewModel = viewModel()
                val authState by authViewModel.authState.collectAsState()
                
                var currentAuthScreen by remember { mutableStateOf("login") }
                
                // Navigation States
                var providerSubScreen by remember { mutableStateOf("dashboard") }
                var customerSubScreen by remember { mutableStateOf("home") }
                var isEditingProfile by remember { mutableStateOf(false) }
                
                var selectedServiceForEdit by remember { mutableStateOf<Service?>(null) }
                var selectedCategory by remember { mutableStateOf<Category?>(null) }
                var selectedServiceWithProvider by remember { mutableStateOf<ServiceWithProvider?>(null) }

                val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
                val scope = rememberCoroutineScope()

                when (val state = authState) {
                    is AuthState.Loading -> {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator()
                        }
                    }
                    is AuthState.Authenticated -> {
                        if (isProfileIncomplete(state.profile) || isEditingProfile) {
                            val profileViewModel: ProfileViewModel = viewModel()
                            ProfileSetupScreen(
                                profile = state.profile,
                                viewModel = profileViewModel,
                                onComplete = { 
                                    isEditingProfile = false
                                    authViewModel.refreshProfile() 
                                }
                            )
                        } else {
                            ModalNavigationDrawer(
                                drawerState = drawerState,
                                drawerContent = {
                                    AppDrawer(
                                        profile = state.profile,
                                        onNavigate = { destination ->
                                            when (destination) {
                                                "home" -> {
                                                    providerSubScreen = "dashboard"
                                                    customerSubScreen = "home"
                                                }
                                                "manage_services" -> providerSubScreen = "manage_services"
                                                "edit_profile" -> isEditingProfile = true
                                            }
                                        },
                                        onSignOut = { authViewModel.signOut() },
                                        closeDrawer = { scope.launch { drawerState.close() } }
                                    )
                                }
                            ) {
                                Scaffold(
                                    modifier = Modifier.fillMaxSize(),
                                    topBar = {
                                        val title = getScreenTitle(state.profile.role, providerSubScreen, customerSubScreen)
                                        if (title != null) {
                                            CenterAlignedTopAppBar(
                                                title = { Text(title) },
                                                navigationIcon = {
                                                    IconButton(onClick = { scope.launch { drawerState.open() } }) {
                                                        Icon(Icons.Default.Menu, contentDescription = "Menu")
                                                    }
                                                }
                                            )
                                        }
                                    }
                                ) { innerPadding ->
                                    Box(modifier = Modifier.padding(innerPadding)) {
                                        if (state.profile.role == UserRole.PROVIDER) {
                                            when (providerSubScreen) {
                                                "manage_services" -> {
                                                    val serviceViewModel: ServiceViewModel = viewModel()
                                                    ManageServicesScreen(
                                                        profile = state.profile,
                                                        viewModel = serviceViewModel,
                                                        onAddService = {
                                                            serviceViewModel.resetState()
                                                            selectedServiceForEdit = null
                                                            providerSubScreen = "add_edit_service"
                                                        },
                                                        onEditService = {
                                                            serviceViewModel.resetState()
                                                            selectedServiceForEdit = it
                                                            providerSubScreen = "add_edit_service"
                                                        }
                                                    )
                                                }
                                                "add_edit_service" -> {
                                                    val serviceViewModel: ServiceViewModel = viewModel()
                                                    AddEditServiceScreen(
                                                        profile = state.profile,
                                                        service = selectedServiceForEdit,
                                                        viewModel = serviceViewModel,
                                                        onBack = { providerSubScreen = "manage_services" }
                                                    )
                                                }
                                                else -> {
                                                    ProviderDashboardScreen(
                                                        profile = state.profile
                                                    )
                                                }
                                            }
                                        } else {
                                            // Customer Flow
                                            val discoveryViewModel: DiscoveryViewModel = viewModel()
                                            when (customerSubScreen) {
                                                "listing" -> {
                                                    ServiceListingScreen(
                                                        category = selectedCategory!!,
                                                        viewModel = discoveryViewModel,
                                                        onServiceClick = {
                                                            selectedServiceWithProvider = it
                                                            customerSubScreen = "detail"
                                                        },
                                                        onBack = { customerSubScreen = "home" }
                                                    )
                                                }
                                                "detail" -> {
                                                    ServiceDetailScreen(
                                                        serviceWithProvider = selectedServiceWithProvider!!,
                                                        viewModel = discoveryViewModel,
                                                        onBack = { customerSubScreen = "listing" }
                                                    )
                                                }
                                                else -> {
                                                    CustomerHomeScreen(
                                                        profile = state.profile,
                                                        viewModel = discoveryViewModel,
                                                        onCategoryClick = {
                                                            selectedCategory = it
                                                            customerSubScreen = "listing"
                                                        }
                                                    )
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    else -> {
                        Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                            Box(modifier = Modifier.padding(innerPadding)) {
                                if (currentAuthScreen == "login") {
                                    LoginScreen(
                                        viewModel = authViewModel,
                                        onNavigateToSignUp = { currentAuthScreen = "signup" }
                                    )
                                } else {
                                    SignUpScreen(
                                        viewModel = authViewModel,
                                        onNavigateToLogin = { currentAuthScreen = "login" }
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

    private fun getScreenTitle(role: UserRole, providerSubScreen: String, customerSubScreen: String): String? {
        if (role == UserRole.PROVIDER) {
            return when (providerSubScreen) {
                "dashboard" -> "DigiSewa"
                "manage_services" -> "Manage Services"
                else -> null // Hide TopAppBar for Add/Edit screen (it has its own)
            }
        } else {
            return when (customerSubScreen) {
                "home" -> "DigiSewa"
                else -> null // Hide TopAppBar for Listing/Detail screen (they have their own)
            }
        }
    }
}

@Composable
fun ProviderDashboardScreen(profile: Profile) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(16.dp)) {
            Text(text = "Welcome, ${profile.fullName}!", style = MaterialTheme.typography.headlineMedium)
            Text(text = "Role: Provider", style = MaterialTheme.typography.bodyLarge)
            Spacer(modifier = Modifier.height(16.dp))
            Text(text = "Use the menu in the top left to manage your services and settings.", style = MaterialTheme.typography.bodyMedium)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CenterAlignedTopAppBar(
    title: @Composable () -> Unit,
    navigationIcon: @Composable () -> Unit
) {
    androidx.compose.material3.CenterAlignedTopAppBar(
        title = title,
        navigationIcon = navigationIcon
    )
}
