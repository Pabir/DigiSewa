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
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pabirul.digisewa.R
import com.pabirul.digisewa.ui.theme.CustomIcons
import kotlinx.coroutines.delay
import com.airbnb.lottie.compose.*
import java.util.Locale

// --- COMPONENTS ---

@Composable
fun ServiceTicker() {
    val services = remember {
        listOf(
            Triple("ELECTRICIAN", R.raw.electrician, Color(0xFF00B0FF)),
            Triple("PHOTOGRAPHER", R.raw.photographer, Color(0xFF607D8B)),
            Triple("PHYSIOTHERAPY", R.raw.physiotherapy, Color(0xFFE91E63)),
            Triple("TATTOO ART", R.raw.tattoo, Color(0xFF9C27B0))
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
                    text = service.first,
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
        shape = RoundedCornerShape(48.dp), 
        color = Color(0xFFF0F7FF), 
        tonalElevation = 2.dp,
        shadowElevation = 8.dp
    ) {
        Column(
            modifier = Modifier.padding(28.dp),
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
    val authState by viewModel.authState.collectAsState()

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

        // --- MAIN CONTENT COLUMN (No Scroll, Fit to Screen) ---
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .navigationBarsPadding(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.weight(0.05f))

            // 1. Showcase Header
            ServiceTicker()

            Spacer(modifier = Modifier.height(4.dp))

            // 2. Startup Logo (Bigger)
            androidx.compose.foundation.Image(
                painter = painterResource(id = R.drawable.ic_logo),
                contentDescription = "DigiSewa Logo",
                modifier = Modifier.size(130.dp)
            )

            Spacer(modifier = Modifier.weight(0.15f))

            // 3. Main Login Interface
            AnimatedLoginCard {
                Text(
                    text = "Welcome Back",
                    style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold, color = Color.Black)
                )
                Text(
                    text = "Sign in to continue to DigiSewa",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.Gray
                )

                Spacer(modifier = Modifier.height(20.dp))

                // Email Input
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email Address") },
                    leadingIcon = { Icon(Icons.Default.Email, contentDescription = null, tint = Color(0xFF039BE5)) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        unfocusedBorderColor = Color(0xFFE0E0E0),
                        focusedBorderColor = Color(0xFF039BE5)
                    )
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Password Input
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Password") },
                    leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null, tint = Color(0xFF039BE5)) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                    trailingIcon = {
                        IconButton(onClick = { passwordVisible = !passwordVisible }) {
                            Icon(
                                imageVector = if (passwordVisible) CustomIcons.EyeWithEyelashesOpen else CustomIcons.EyeWithEyelashesClosed,
                                contentDescription = null,
                                tint = Color.Black
                            )
                        }
                    },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        unfocusedBorderColor = Color(0xFFE0E0E0),
                        focusedBorderColor = Color(0xFF039BE5)
                    )
                )

                Spacer(modifier = Modifier.height(20.dp))

                // Action Button
                Button(
                    onClick = { viewModel.signIn(email, password) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp),
                    shape = RoundedCornerShape(20.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2196F3)),
                    enabled = authState !is AuthState.Loading
                ) {
                    if (authState is AuthState.Loading) {
                        CircularProgressIndicator(size = 24.dp, color = Color.White, strokeWidth = 3.dp)
                    } else {
                        Text("LOGIN", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = Color.White))
                    }
                }

                // Error Feedback
                if (authState is AuthState.Error) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Wrong Login Details Provided",
                        color = MaterialTheme.colorScheme.error,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.align(Alignment.CenterHorizontally),
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }

            Spacer(modifier = Modifier.weight(0.15f))

            // 4. Onboarding Footer
            TextButton(
                onClick = onNavigateToSignUp,
                modifier = Modifier.padding(bottom = 16.dp)
            ) {
                Text(
                    "New to DigiSewa? Create an account",
                    style = MaterialTheme.typography.bodyMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = Color.White // White for better visibility over the blue curve
                    )
                )
            }
            
            Spacer(modifier = Modifier.height(8.dp))
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
