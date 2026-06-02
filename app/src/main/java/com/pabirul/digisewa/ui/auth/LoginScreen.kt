package com.pabirul.digisewa.ui.auth

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.Path
import androidx.compose.foundation.BorderStroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pabirul.digisewa.R
import com.pabirul.digisewa.UserRole
import com.pabirul.digisewa.ui.theme.CustomIcons
import kotlinx.coroutines.delay
import com.airbnb.lottie.compose.*
import java.util.Locale

// --- COMPONENTS ---

@Composable
fun ServiceTicker() {
    val services = remember {
        listOf(
            Triple(R.string.cat_electrician, R.raw.electrician, Color(0xFF00B0FF)),
            Triple(R.string.cat_photographer, R.raw.photographer, Color(0xFF607D8B)),
            Triple(R.string.cat_physiotherapy, R.raw.physiotherapy, Color(0xFFE91E63)),
            Triple(R.string.cat_tattoo_art, R.raw.tattoo, Color(0xFF9C27B0)),
            Triple(R.string.cat_cleaning, R.raw.cleaning, Color(0xFF4CAF50)),
            Triple(R.string.cat_music_dance, R.raw.music, Color(0xFFFF9800)),
            Triple(R.string.cat_nursing, R.raw.nursing, Color(0xFF2196F3)),
            Triple(R.string.cat_medical_report, R.raw.report, Color(0xFF7E57C2)),
            Triple(R.string.cat_karate_training, R.raw.karate, Color(0xFF4CAF50)),
            Triple(R.string.cat_real_estate, R.raw.real_estate, Color(0xFF2196F3)),
            Triple(R.string.cat_used_bike, R.raw.used_bike, Color(0xFFFF9800)),
            Triple(R.string.cat_ac_fridge, R.raw.ac_fridge, Color(0xFF2196F3))
        )
    }

    var currentIndex by remember { mutableIntStateOf(0) }

    LaunchedEffect(Unit) {
        while (true) {
            delay(4000)
            currentIndex = (currentIndex + 1) % services.size
        }
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(180.dp),
        contentAlignment = Alignment.Center
    ) {
        val currentService = services[currentIndex]
        
        AnimatedContent(
            targetState = currentService,
            transitionSpec = {
                (fadeIn(tween(800)) + scaleIn(initialScale = 0.8f))
                    .togetherWith(fadeOut(tween(600)) + scaleOut(targetScale = 1.2f))
            },
            label = "LottieServiceTransition"
        ) { service ->
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
                modifier = Modifier.fillMaxSize()
            ) {
                val composition by rememberLottieComposition(LottieCompositionSpec.RawRes(service.second))
                val progress by animateLottieCompositionAsState(
                    composition = composition,
                    iterations = LottieConstants.IterateForever
                )

                Box(
                    modifier = Modifier
                        .size(130.dp)
                        // 3D Effect: Outer Glow/Shadow
                        .graphicsLayer {
                            shadowElevation = 12f
                            shape = CircleShape
                            clip = true
                        }
                        // 3D Effect: Gradient Background (Glassmorphism style)
                        .background(
                            brush = Brush.radialGradient(
                                colors = listOf(
                                    Color.White.copy(alpha = 0.9f),
                                    Color.White.copy(alpha = 0.4f)
                                )
                            ),
                            shape = CircleShape
                        )
                        // 3D Effect: Glossy Border
                        .border(
                            width = 2.dp,
                            brush = Brush.linearGradient(
                                colors = listOf(
                                    Color.White,
                                    Color.White.copy(alpha = 0.2f),
                                    Color.White.copy(alpha = 0.8f)
                                )
                            ),
                            shape = CircleShape
                        )
                        .padding(10.dp),
                    contentAlignment = Alignment.Center
                ) {
                    LottieAnimation(
                        composition = composition,
                        progress = { progress },
                        modifier = Modifier
                            .fillMaxSize()
                            .graphicsLayer {
                                // Apply Multiply blend mode to remove white background from raster Lottie assets
                                blendMode = BlendMode.Multiply
                            }
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = stringResource(service.first).uppercase(Locale.getDefault()),
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF4FC3F7), 
                        letterSpacing = 2.sp
                    )
                )
            }
        }
    }
}

/**
 * Reusable Premium Card with subtle floating animation and high elevation.
 */
@Composable
fun AnimatedLoginCard(
    content: @Composable ColumnScope.() -> Unit
) {
    val infiniteTransition = rememberInfiniteTransition(label = "cardFloat")
    val translateY by infiniteTransition.animateFloat(
        initialValue = -4f,
        targetValue = 4f,
        animationSpec = infiniteRepeatable(
            animation = tween(2500, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "yTranslation"
    )

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 24.dp)
            .graphicsLayer { translationY = translateY },
        shape = RoundedCornerShape(24.dp), 
        color = Color(0xFFF0F7FF), 
        tonalElevation = 2.dp,
        shadowElevation = 8.dp
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            content = content
        )
    }
}

// --- MAIN SCREEN ---

@Composable
fun LoginScreen(
    viewModel: AuthViewModel,
    onNavigateToSignUp: () -> Unit
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    var selectedGoogleRole by remember { mutableStateOf(UserRole.CUSTOMER) }
    val authState by viewModel.authState.collectAsState()
    val context = LocalContext.current

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White)
    ) {
        // --- IMPROVED TOP CURVES ---
        Canvas(modifier = Modifier.fillMaxWidth().height(220.dp)) {
            val path1 = Path().apply {
                moveTo(0f, 0f)
                lineTo(size.width * 0.6f, 0f)
                cubicTo(
                    size.width * 0.55f, size.height * 0.4f,
                    size.width * 0.3f, size.height * 0.8f,
                    0f, size.height * 0.9f
                )
                close()
            }
            drawPath(path1, Brush.linearGradient(listOf(Color(0xFF009688), Color(0xFF4DB6AC)))) // Sea Green / Teal

            val path2 = Path().apply {
                moveTo(size.width, 0f)
                lineTo(size.width * 0.4f, 0f)
                cubicTo(
                    size.width * 0.45f, size.height * 0.3f,
                    size.width * 0.75f, size.height * 0.6f,
                    size.width, size.height * 0.75f
                )
                close()
            }
            drawPath(path2, Brush.linearGradient(listOf(Color(0xFF00BCD4), Color(0xFF2196F3))))
        }

        // --- IMPROVED BOTTOM WAVE ---
        Canvas(modifier = Modifier.fillMaxWidth().height(280.dp).align(Alignment.BottomCenter)) {
            val path = Path().apply {
                moveTo(0f, size.height)
                lineTo(0f, size.height * 0.5f)
                cubicTo(
                    size.width * 0.25f, size.height * 0.2f,
                    size.width * 0.6f, size.height * 0.9f,
                    size.width, size.height * 0.35f
                )
                lineTo(size.width, size.height)
                close()
            }
            drawPath(path, Brush.horizontalGradient(listOf(Color(0xFF009688), Color(0xFF2196F3), Color(0xFF00BCD4)))) // Sea Green to Blue
        }

        // --- MAIN CONTENT COLUMN (No Scroll, Optimized for One-Screen) ---
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .navigationBarsPadding(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // 1. Showcase Header (Moved higher and made smaller)
            Box(modifier = Modifier.height(100.dp)) {
                ServiceTicker()
            }

            // 2. Startup Logo
            androidx.compose.foundation.Image(
                painter = painterResource(id = R.drawable.ic_logo),
                contentDescription = "DigiSewa Logo",
                modifier = Modifier.size(90.dp)
            )

            Spacer(modifier = Modifier.height(12.dp))

            // 3. Main Login Interface
            AnimatedLoginCard {
                Text(
                    text = "Welcome Back",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = Color.Black)
                )
                
                Spacer(modifier = Modifier.height(8.dp))

                // Email Input
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email", style = MaterialTheme.typography.bodySmall) },
                    leadingIcon = { Icon(Icons.Default.Email, contentDescription = null, tint = Color(0xFF039BE5), modifier = Modifier.size(16.dp)) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                    singleLine = true,
                    textStyle = MaterialTheme.typography.bodySmall,
                    colors = OutlinedTextFieldDefaults.colors(
                        unfocusedBorderColor = Color(0xFFE0E0E0),
                        focusedBorderColor = Color(0xFF039BE5)
                    )
                )

                Spacer(modifier = Modifier.height(6.dp))

                // Password Input
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Password", style = MaterialTheme.typography.bodySmall) },
                    leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null, tint = Color(0xFF039BE5), modifier = Modifier.size(16.dp)) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                    trailingIcon = {
                        IconButton(onClick = { passwordVisible = !passwordVisible }) {
                            Icon(
                                imageVector = if (passwordVisible) CustomIcons.EyeWithEyelashesOpen else CustomIcons.EyeWithEyelashesClosed,
                                contentDescription = null,
                                tint = Color.Black,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    singleLine = true,
                    textStyle = MaterialTheme.typography.bodySmall,
                    colors = OutlinedTextFieldDefaults.colors(
                        unfocusedBorderColor = Color(0xFFE0E0E0),
                        focusedBorderColor = Color(0xFF039BE5)
                    )
                )

                Spacer(modifier = Modifier.height(10.dp))

                // Action Button
                Button(
                    onClick = { viewModel.signIn(email, password) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(44.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2196F3)),
                    enabled = authState !is AuthState.Loading
                ) {
                    if (authState is AuthState.Loading) {
                        CircularProgressIndicator(size = 18.dp, color = Color.White, strokeWidth = 2.dp)
                    } else {
                        Text("LOGIN", style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold, color = Color.White))
                    }
                }

                if (authState is AuthState.Error) {
                    Text(
                        text = "Wrong Details",
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.labelSmall,
                        modifier = Modifier.align(Alignment.CenterHorizontally).padding(top = 4.dp)
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                Row(verticalAlignment = Alignment.CenterVertically) {
                    HorizontalDivider(modifier = Modifier.weight(1f))
                    Text(" OR ", style = MaterialTheme.typography.labelSmall, color = Color.Gray, modifier = Modifier.padding(horizontal = 8.dp))
                    HorizontalDivider(modifier = Modifier.weight(1f))
                }

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FilterChip(
                        selected = selectedGoogleRole == UserRole.CUSTOMER,
                        onClick = { selectedGoogleRole = UserRole.CUSTOMER },
                        label = { Text("Customer", style = MaterialTheme.typography.labelSmall) },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(12.dp)
                    )
                    FilterChip(
                        selected = selectedGoogleRole == UserRole.PROVIDER,
                        onClick = { selectedGoogleRole = UserRole.PROVIDER },
                        label = { Text("Provider", style = MaterialTheme.typography.labelSmall) },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(12.dp)
                    )
                }

                Spacer(modifier = Modifier.height(6.dp))

                // Google Login Button
                OutlinedButton(
                    onClick = { viewModel.signInWithGoogle(context, selectedGoogleRole) },
                    modifier = Modifier.fillMaxWidth().height(44.dp),
                    shape = RoundedCornerShape(12.dp),
                    border = BorderStroke(1.dp, Color(0xFFE0E0E0))
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        androidx.compose.foundation.Image(
                            painter = painterResource(id = R.drawable.ic_google),
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Google Sign In", color = Color.Black, style = MaterialTheme.typography.labelLarge)
                    }
                }
            }

            Spacer(modifier = Modifier.weight(1f))

            // 4. Onboarding Footer
            TextButton(
                onClick = onNavigateToSignUp,
                modifier = Modifier.padding(bottom = 8.dp)
            ) {
                Text(
                    "New user? Create an account",
                    style = MaterialTheme.typography.bodySmall.copy(
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                )
            }
        }
    }
}

/**
 * Loading indicator helper.
 */
@Composable
fun CircularProgressIndicator(size: androidx.compose.ui.unit.Dp, color: Color, strokeWidth: androidx.compose.ui.unit.Dp = 3.dp) {
    androidx.compose.material3.CircularProgressIndicator(
        modifier = Modifier.size(size),
        color = color,
        strokeWidth = strokeWidth
    )
}
