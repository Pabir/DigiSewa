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
import androidx.compose.runtime.snapshots.SnapshotStateMap
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.layout.LayoutCoordinates
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.lifecycle.viewmodel.compose.viewModel
import com.pabirul.digisewa.ui.agent.*
import com.pabirul.digisewa.ui.auth.*
import com.pabirul.digisewa.data.repository.StoreRepository
import com.pabirul.digisewa.ui.components.AppDrawer
import com.pabirul.digisewa.ui.discovery.*
import com.pabirul.digisewa.ui.store.*
import com.pabirul.digisewa.ui.profile.ProfileSetupScreen
import com.pabirul.digisewa.ui.profile.ProfileViewModel
import com.pabirul.digisewa.ui.requirements.*
import com.pabirul.digisewa.ui.service.AddEditServiceScreen
import com.pabirul.digisewa.ui.service.ManageServicesScreen
import com.pabirul.digisewa.ui.service.ServiceViewModel
import com.pabirul.digisewa.ui.theme.DigiSewaTheme
import com.google.android.gms.ads.MobileAds
import com.pabirul.digisewa.ui.components.AdMobHelper
import io.github.jan.supabase.auth.handleDeeplinks
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Handle Supabase Deep Links
        Supabase.client.handleDeeplinks(intent)

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
                val requirementViewModel: RequirementViewModel = viewModel()
                
                var currentAuthScreen by remember { mutableStateOf("login") }
                
                // Navigation States
                var providerSubScreen by remember { mutableStateOf("dashboard") }
                var customerSubScreen by remember { mutableStateOf("selection") }
                var agentSubScreen by remember { mutableStateOf("dashboard") }
                var shopkeeperSubScreen by remember { mutableStateOf("dashboard") }
                var generalSubScreen by remember { mutableStateOf("") }
                var isEditingProfile by remember { mutableStateOf(false) }
                
                var selectedServiceForEdit by remember { mutableStateOf<Service?>(null) }
                var selectedCategory by remember { mutableStateOf<Category?>(null) }
                var selectedServiceWithProvider by remember { mutableStateOf<ServiceWithProvider?>(null) }
                var selectedRequirement by remember { mutableStateOf<RequirementWithDetails?>(null) }
                var selectedStore by remember { mutableStateOf<Store?>(null) }
                var selectedProduct by remember { mutableStateOf<Product?>(null) }

                val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
                val scope = rememberCoroutineScope()
                
                // Onboarding Coordinates
                val onboardingCoords = remember { mutableStateMapOf<String, LayoutCoordinates>() }

                // Global Back Navigation Handling
                BackHandler(enabled = authState is AuthState.Authenticated) {
                    when {
                        drawerState.isOpen -> scope.launch { drawerState.close() }
                        isEditingProfile -> isEditingProfile = false
                        generalSubScreen == "bookings" -> generalSubScreen = ""
                        // Agent Navigation
                        agentSubScreen == "onboard" || agentSubScreen == "list" -> agentSubScreen = "dashboard"
                        // Shopkeeper Navigation
                        shopkeeperSubScreen == "edit_store" || shopkeeperSubScreen == "manage_products" || shopkeeperSubScreen == "add_edit_product" -> shopkeeperSubScreen = "dashboard"
                        // Provider Navigation
                        providerSubScreen == "requirement_detail" -> providerSubScreen = "lead_feed"
                        providerSubScreen == "lead_feed" -> providerSubScreen = "dashboard"
                        providerSubScreen == "add_edit_service" -> providerSubScreen = "manage_services"
                        providerSubScreen == "manage_services" -> providerSubScreen = "dashboard"
                        // Customer Navigation
                        customerSubScreen == "requirement_detail" -> customerSubScreen = "my_requirements"
                        customerSubScreen == "my_requirements" -> customerSubScreen = "selection"
                        customerSubScreen == "post_requirement" -> customerSubScreen = "selection"
                        customerSubScreen == "detail" -> customerSubScreen = "listing"
                        customerSubScreen == "listing" -> customerSubScreen = "home"
                        customerSubScreen == "product_detail" -> {
                            if (selectedStore != null) customerSubScreen = "store_profile"
                            else customerSubScreen = "category_products"
                        }
                        customerSubScreen == "category_products" -> customerSubScreen = "store_home"
                        customerSubScreen == "store_profile" -> customerSubScreen = "store_home"
                        customerSubScreen == "store_home" -> customerSubScreen = "selection"
                        customerSubScreen == "home" -> customerSubScreen = "selection"
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
                                                    customerSubScreen = "selection"
                                                    agentSubScreen = "dashboard"
                                                    shopkeeperSubScreen = "dashboard"
                                                    generalSubScreen = ""
                                                }
                                                "requirements" -> {
                                                    if (state.profile.role == UserRole.PROVIDER) {
                                                        providerSubScreen = "lead_feed"
                                                    } else {
                                                        customerSubScreen = "my_requirements"
                                                    }
                                                    generalSubScreen = ""
                                                }
                                                "post_requirement" -> {
                                                    requirementViewModel.resetState()
                                                    customerSubScreen = "post_requirement"
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
                                            getScreenTitle(
                                                state.profile.role,
                                                providerSubScreen,
                                                customerSubScreen,
                                                agentSubScreen,
                                                shopkeeperSubScreen
                                            )
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
                                                    IconButton(
                                                        onClick = { scope.launch { drawerState.open() } },
                                                        modifier = Modifier.onGloballyPositioned { onboardingCoords["menu_icon"] = it }
                                                    ) {
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
                                        } else if (state.profile.role == UserRole.AGENT) {
                                            val agentViewModel: AgentViewModel = viewModel()
                                            when (agentSubScreen) {
                                                "onboard" -> {
                                                    val discoveryViewModel: DiscoveryViewModel = viewModel()
                                                    val categories by discoveryViewModel.categories.collectAsState()
                                                    OnboardProviderScreen(
                                                        agentProfile = state.profile,
                                                        categories = categories,
                                                        viewModel = agentViewModel,
                                                        onBack = { agentSubScreen = "dashboard" }
                                                    )
                                                }
                                                "list" -> {
                                                    MyLeadsScreen(
                                                        agentProfile = state.profile,
                                                        viewModel = agentViewModel,
                                                        onBack = { agentSubScreen = "dashboard" }
                                                    )
                                                }
                                                else -> {
                                                    AgentDashboardScreen(
                                                        profile = state.profile,
                                                        onOnboardProvider = { agentSubScreen = "onboard" },
                                                        onViewMyProviders = { agentSubScreen = "list" }
                                                    )
                                                }
                                            }
                                        } else if (state.profile.role == UserRole.SHOPKEEPER) {
                                            when (shopkeeperSubScreen) {
                                                "edit_store" -> {
                                                    Text("Store Setup Screen Placeholder")
                                                }
                                                "manage_products" -> {
                                                    Text("Manage Products Screen Placeholder")
                                                }
                                                "add_edit_product" -> {
                                                    val storeRepo = remember { StoreRepository() }
                                                    var currentStore by remember { mutableStateOf<Store?>(null) }
                                                    LaunchedEffect(state.profile.id) {
                                                        currentStore = storeRepo.getStoreByOwner(state.profile.id)
                                                    }
                                                    
                                                    if (currentStore != null) {
                                                        AddEditProductScreen(
                                                            store = currentStore!!,
                                                            product = selectedProduct,
                                                            onBack = { shopkeeperSubScreen = "dashboard" }
                                                        )
                                                    }
                                                }
                                                else -> {
                                                    ShopkeeperDashboard(
                                                        profile = state.profile,
                                                        onManageProducts = { 
                                                            selectedProduct = it
                                                            shopkeeperSubScreen = "add_edit_product" 
                                                        },
                                                        onEditStore = { shopkeeperSubScreen = "edit_store" }
                                                    )
                                                }
                                            }
                                        } else if (state.profile.role == UserRole.PROVIDER) {
                                            when (providerSubScreen) {
                                                "lead_feed" -> {
                                                    LeadFeedScreen(
                                                        profile = state.profile,
                                                        viewModel = requirementViewModel,
                                                        onRequirementClick = {
                                                            selectedRequirement = it
                                                            providerSubScreen = "requirement_detail"
                                                        }
                                                    )
                                                }
                                                "requirement_detail" -> {
                                                    val bookingViewModel: com.pabirul.digisewa.ui.bookings.BookingViewModel = viewModel()
                                                    RequirementDetailScreen(
                                                        requirement = selectedRequirement!!,
                                                        profile = state.profile,
                                                        viewModel = requirementViewModel,
                                                        bookingViewModel = bookingViewModel,
                                                        onBack = { providerSubScreen = "lead_feed" }
                                                    )
                                                }
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
                                                        profile = state.profile,
                                                        onPositioned = { tag, coords -> onboardingCoords[tag] = coords }
                                                    )
                                                }
                                            }
                                        } else {
                                            val discoveryViewModel: DiscoveryViewModel = viewModel()
                                            when (customerSubScreen) {
                                                "post_requirement" -> {
                                                    val categories by discoveryViewModel.categories.collectAsState()
                                                    PostRequirementScreen(
                                                        profile = state.profile,
                                                        categories = categories,
                                                        viewModel = requirementViewModel,
                                                        onSuccess = {
                                                            customerSubScreen = "my_requirements"
                                                        }
                                                    )
                                                }
                                                "my_requirements" -> {
                                                    MyRequirementsScreen(
                                                        profile = state.profile,
                                                        viewModel = requirementViewModel,
                                                        onRequirementClick = {
                                                            selectedRequirement = it
                                                            customerSubScreen = "requirement_detail"
                                                        }
                                                    )
                                                }
                                                "requirement_detail" -> {
                                                    val bookingViewModel: com.pabirul.digisewa.ui.bookings.BookingViewModel = viewModel()
                                                    RequirementDetailScreen(
                                                        requirement = selectedRequirement!!,
                                                        profile = state.profile,
                                                        viewModel = requirementViewModel,
                                                        bookingViewModel = bookingViewModel,
                                                        onBack = { customerSubScreen = "my_requirements" }
                                                    )
                                                }
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
                                                "store_home" -> {
                                                    StoreHomeScreen(
                                                        onCategoryClick = {
                                                            selectedCategory = it
                                                            customerSubScreen = "category_products"
                                                        },
                                                        onStoreClick = {
                                                            selectedStore = it
                                                            customerSubScreen = "store_profile"
                                                        },
                                                        onBack = { customerSubScreen = "selection" }
                                                    )
                                                }
                                                "category_products" -> {
                                                    CategoryProductGridScreen(
                                                        category = selectedCategory!!,
                                                        onProductClick = {
                                                            selectedProduct = it
                                                            selectedStore = null // Clearing to know we came from category
                                                            customerSubScreen = "product_detail"
                                                        },
                                                        onBack = { customerSubScreen = "store_home" }
                                                    )
                                                }
                                                "store_profile" -> {
                                                    StoreProfileScreen(
                                                        store = selectedStore!!,
                                                        onProductClick = {
                                                            selectedProduct = it
                                                            customerSubScreen = "product_detail"
                                                        },
                                                        onBack = { customerSubScreen = "store_home" }
                                                    )
                                                }
                                                "product_detail" -> {
                                                    ProductDetailScreen(
                                                        product = selectedProduct!!,
                                                        onBack = {
                                                            if (selectedStore != null) customerSubScreen = "store_profile"
                                                            else customerSubScreen = "category_products"
                                                        }
                                                    )
                                                }
                                                "selection" -> {
                                                    SelectionScreen(
                                                        profile = state.profile,
                                                        onNavigateToServices = { customerSubScreen = "home" },
                                                        onNavigateToProducts = { customerSubScreen = "store_home" }
                                                    )
                                                }
                                                else -> {
                                                    CustomerHomeScreen(
                                                        profile = state.profile,
                                                        viewModel = discoveryViewModel,
                                                        onCategoryClick = {
                                                            selectedCategory = it
                                                            customerSubScreen = "listing"
                                                        },
                                                        onPositioned = { tag, coords -> onboardingCoords[tag] = coords }
                                                    )
                                                }
                                            }
                                        }
                                    }
                                }

                                if (!state.profile.onboardingCompleted) {
                                    val profileViewModel: ProfileViewModel = viewModel()
                                    val steps = when (state.profile.role) {
                                        UserRole.PROVIDER -> listOf(
                                            com.pabirul.digisewa.ui.components.OnboardingStep(
                                                "Professional Dashboard",
                                                "Manage your service requests and view your business stats here.",
                                                "dashboard_hero"
                                            ),
                                            com.pabirul.digisewa.ui.components.OnboardingStep(
                                                "Lead Feed",
                                                "Access new customer requirements and send quotes to grow your business.",
                                                "menu_icon"
                                            )
                                        )
                                        else -> listOf(
                                            com.pabirul.digisewa.ui.components.OnboardingStep(
                                                "Welcome to DigiSewa!",
                                                "Find and book the best local professionals for all your needs.",
                                                "hero"
                                            ),
                                            com.pabirul.digisewa.ui.components.OnboardingStep(
                                                "Explore Categories",
                                                "Browse through a wide variety of services tailored for you.",
                                                "categories"
                                            ),
                                            com.pabirul.digisewa.ui.components.OnboardingStep(
                                                "Custom Requirements",
                                                "Can't find what you need? Post a custom requirement and get quotes from providers.",
                                                "menu_icon"
                                            )
                                        )
                                    }

                                    com.pabirul.digisewa.ui.components.OnboardingWalkthrough(
                                        steps = steps,
                                        targetCoordinates = onboardingCoords,
                                        onComplete = {
                                            profileViewModel.completeOnboarding(state.profile.id)
                                            authViewModel.refreshProfile()
                                        }
                                    )
                                }
                            }
                        }
                    }
                    is AuthState.Unauthenticated, is AuthState.Error, is AuthState.VerificationSent -> {
                        Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                            Box(modifier = Modifier.padding(innerPadding)) {
                                val state = authState
                                if (state is AuthState.VerificationSent) {
                                    VerifyOtpScreen(
                                        email = state.email,
                                        viewModel = authViewModel,
                                        onBack = { authViewModel.signOut() }
                                    )
                                } else if (currentAuthScreen == "login") {
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

    private fun getScreenTitle(
        role: UserRole,
        providerSubScreen: String,
        customerSubScreen: String,
        agentSubScreen: String,
        shopkeeperSubScreen: String
    ): String? {
        return when (role) {
            UserRole.PROVIDER -> when (providerSubScreen) {
                "dashboard" -> "DigiSewa"
                "manage_services" -> "Manage Services"
                "lead_feed" -> "Lead Feed"
                "requirement_detail" -> "Requirement Detail"
                else -> null
            }
            UserRole.AGENT -> when (agentSubScreen) {
                "dashboard" -> "DigiSewa"
                "onboard" -> "Onboard Provider"
                "list" -> "My Leads"
                else -> null
            }
            UserRole.SHOPKEEPER -> when (shopkeeperSubScreen) {
                "dashboard" -> "DigiSewa"
                "edit_store" -> "Store Setup"
                "manage_products" -> "Manage Products"
                "add_edit_product" -> "Add/Edit Product"
                else -> null
            }
            UserRole.CUSTOMER -> when (customerSubScreen) {
                "selection" -> "DigiSewa"
                "home" -> "DigiSewa"
                "post_requirement" -> "Post a Requirement"
                "my_requirements" -> "My Requirements"
                "requirement_detail" -> "Requirement Detail"
                "store_home" -> "Shop Locally"
                "category_products" -> "Products"
                "store_profile" -> "Store Catalog"
                "product_detail" -> "Product Details"
                else -> null
            }
            else -> null
        }
    }
}

@Composable
fun ProviderDashboardScreen(
    profile: Profile,
    onPositioned: (String, LayoutCoordinates) -> Unit = { _, _ -> }
) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally, 
            modifier = Modifier.padding(16.dp).onGloballyPositioned { onPositioned("dashboard_hero", it) }
        ) {
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
