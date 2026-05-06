package com.pabirul.digisewa

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
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
import com.google.android.gms.ads.MobileAds
import com.pabirul.digisewa.ui.components.AdMobHelper
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Initialize Mobile Ads SDK
        MobileAds.initialize(this) {
            // Preload Interstitial and Rewarded ads
            AdMobHelper.loadInterstitial(this)
            AdMobHelper.loadRewardedAd(this)
        }

        enableEdgeToEdge()
        setContent {
            DigiSewaTheme {
                val authViewModel: AuthViewModel = viewModel()
                val authState by authViewModel.authState.collectAsState()
                
                var currentAuthScreen by remember { mutableStateOf("login") }
                
                // Navigation States
                var providerSubScreen by remember { mutableStateOf("dashboard") }
                var customerSubScreen by remember { mutableStateOf("home") }
                var generalSubScreen by remember { mutableStateOf("") }
                var isEditingProfile by remember { mutableStateOf(false) }
                
                var selectedServiceForEdit by remember { mutableStateOf<Service?>(null) }
                var selectedCategory by remember { mutableStateOf<Category?>(null) }
                var selectedServiceWithProvider by remember { mutableStateOf<ServiceWithProvider?>(null) }

                val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
                val scope = rememberCoroutineScope()

                // Global Back Navigation Handling
                BackHandler(enabled = authState is AuthState.Authenticated) {
                    when {
                        drawerState.isOpen -> scope.launch { drawerState.close() }
                        isEditingProfile -> isEditingProfile = false
                        generalSubScreen == "bookings" -> generalSubScreen = ""
                        // Provider Navigation
                        providerSubScreen == "add_edit_service" -> providerSubScreen = "manage_services"
                        providerSubScreen == "manage_services" -> providerSubScreen = "dashboard"
                        // Customer Navigation
                        customerSubScreen == "detail" -> customerSubScreen = "listing"
                        customerSubScreen == "listing" -> customerSubScreen = "home"
                        // If at top level and back is pressed, let it exit (or handle with a prompt)
                        else -> finish() 
                    }
                }

                when (val state = authState) {
                    is AuthState.Idle -> {
                    }
                    is AuthState.Loading -> {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator()
                        }
                    }
                    is AuthState.Authenticated -> {
                        if (isProfileIncomplete(state.profile) || isEditingProfile) {
                            val profileViewModel: ProfileViewModel = viewModel()
                            
                            // Reset state when entering the setup screen to avoid loops
                            LaunchedEffect(state.profile.id, isEditingProfile) {
                                profileViewModel.resetState()
                            }

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
                                                    generalSubScreen = ""
                                                }
                                                "manage_services" -> {
                                                    providerSubScreen = "manage_services"
                                                    generalSubScreen = ""
                                                }
                                                "edit_profile" -> {
                                                    isEditingProfile = true
                                                    generalSubScreen = ""
                                                }
                                                "bookings" -> generalSubScreen = "bookings"
                                                "settings" -> generalSubScreen = "settings"
                                            }
                                        },
                                        onSignOut = { authViewModel.signOut() },
                                        closeDrawer = { scope.launch { drawerState.close() } }
                                    )
                                }
                            ) {
                                Scaffold(
                                    modifier = Modifier.fillMaxWidth(),
                                    topBar = {
                                        val title = if (generalSubScreen == "bookings") {
                                            if (state.profile.role == UserRole.PROVIDER) stringResource(R.string.booking_requests) else stringResource(R.string.my_bookings)
                                        } else {
                                            getScreenTitle(state.profile.role, providerSubScreen, customerSubScreen)
                                        }

                                        if (title != null) {
                                            CenterAlignedTopAppBar(
                                                title = {
                                                    if (title == "DigiSewa") {
                                                        androidx.compose.foundation.Image(
                                                            painter = painterResource(id = R.drawable.ic_logo),
                                                            contentDescription = "DigiSewa Logo",
                                                            modifier = Modifier.height(32.dp)
                                                        )
                                                    } else {
                                                        Text(title)
                                                    }
                                                },
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
                                        if (generalSubScreen == "bookings") {
                                            val bookingViewModel: com.pabirul.digisewa.ui.bookings.BookingViewModel = viewModel()
                                            com.pabirul.digisewa.ui.bookings.MyBookingsScreen(
                                                profile = state.profile,
                                                viewModel = bookingViewModel,
                                                isProvider = state.profile.role == UserRole.PROVIDER
                                            )
                                        } else if (generalSubScreen == "settings") {
                                            com.pabirul.digisewa.ui.settings.SettingsScreen()
                                        } else if (state.profile.role == UserRole.PROVIDER) {
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
                                                    val bookingViewModel: com.pabirul.digisewa.ui.bookings.BookingViewModel = viewModel()
                                                    ServiceDetailScreen(
                                                        serviceWithProvider = selectedServiceWithProvider!!,
                                                        viewModel = discoveryViewModel,
                                                        bookingViewModel = bookingViewModel,
                                                        customerId = state.profile.id,
                                                        customerProfile = state.profile,
                                                        onBack = { customerSubScreen = "listing" },
                                                        onNavigateToBookings = {
                                                            generalSubScreen = "bookings"
                                                        }
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
                    is AuthState.Unauthenticated, is AuthState.Error -> {
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
                else -> null 
            }
        } else {
            return when (customerSubScreen) {
                "home" -> "DigiSewa"
                else -> null
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
