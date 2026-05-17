package com.pabirul.digisewa.ui.auth

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.foundation.Canvas
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

// --- COMPONENTS ---

@Composable
fun ServiceTicker() {
    val services = remember {
        listOf(
            "ELECTRICIAN",
            "PHOTOGRAPHER",
            "PHYSIOTHERAPY",
            "TATTOO ART"
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
            .height(130.dp),
        contentAlignment = Alignment.Center
    ) {
        // Global 3D Perspective State
        val perspectiveTransition = rememberInfiniteTransition(label = "3D")
        val tiltX by perspectiveTransition.animateFloat(
            initialValue = -10f, targetValue = 10f,
            animationSpec = infiniteRepeatable(tween(3000, easing = FastOutSlowInEasing), RepeatMode.Reverse),
            label = "tiltX"
        )
        val tiltY by perspectiveTransition.animateFloat(
            initialValue = -15f, targetValue = 15f,
            animationSpec = infiniteRepeatable(tween(4000, easing = FastOutSlowInEasing), RepeatMode.Reverse),
            label = "tiltY"
        )

        AnimatedContent(
            targetState = services[currentIndex],
            transitionSpec = {
                (slideInVertically { it } + fadeIn(tween(800)))
                    .togetherWith(slideOutVertically { -it } + fadeOut(tween(600)))
            },
            modifier = Modifier.graphicsLayer {
                rotationX = tiltX
                rotationY = tiltY
                cameraDistance = 12f * density
            },
            label = "TextServiceTransition"
        ) { service ->
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                when (service) {
                    "ELECTRICIAN" -> ElectricianTextAnimation()
                    "PHOTOGRAPHER" -> PhotographerTextAnimation()
                    "PHYSIOTHERAPY" -> PhysioTextAnimation()
                    "TATTOO ART" -> TattooTextAnimation()
                }
            }
        }
    }
}

// --- THEMATIC TYPOGRAPHY COMPONENTS ---

@Composable
fun ElectricianTextAnimation() {
    val infiniteTransition = rememberInfiniteTransition(label = "flicker")
    val flickerAlpha by infiniteTransition.animateFloat(
        initialValue = 0.4f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = keyframes {
                durationMillis = 800
                0.8f at 0
                0.2f at 100
                1f at 400
                0.5f at 600
            },
            repeatMode = RepeatMode.Reverse
        ),
        label = "alpha"
    )
    
    val ledChasing by infiniteTransition.animateFloat(
        initialValue = 0f, targetValue = 100f,
        animationSpec = infiniteRepeatable(tween(2000, easing = LinearEasing)),
        label = "led"
    )

    Box(contentAlignment = Alignment.Center, modifier = Modifier.padding(16.dp)) {
        // LED Lights Border
        Canvas(modifier = Modifier.width(320.dp).height(100.dp)) {
            val w = size.width
            val h = size.height
            val ledColors = listOf(Color.Red, Color.Green, Color.Blue, Color.Yellow)
            
            for (i in 0..20) {
                val progress = (i.toFloat() / 20f + (ledChasing / 100f)) % 1f
                val pos = when {
                    progress < 0.25f -> Offset(progress * 4 * w, 0f)
                    progress < 0.5f -> Offset(w, (progress - 0.25f) * 4 * h)
                    progress < 0.75f -> Offset(w - (progress - 0.5f) * 4 * w, h)
                    else -> Offset(0f, h - (progress - 0.75f) * 4 * h)
                }
                
                val color = ledColors[i % ledColors.size]
                val blink = if ((ledChasing.toInt() + i) % 2 == 0) 1f else 0.3f
                drawCircle(color, radius = 5f, center = pos, alpha = blink)
                drawCircle(color.copy(alpha = 0.3f * blink), radius = 12f, center = pos)
            }
        }

        Text(
            text = "ELECTRICIAN",
            style = MaterialTheme.typography.displaySmall.copy(
                fontWeight = FontWeight.Black,
                brush = Brush.linearGradient(
                    colors = listOf(Color(0xFF00B0FF), Color(0xFFD500F9), Color(0xFF00B0FF))
                ),
                letterSpacing = 4.sp,
                shadow = Shadow(
                    color = Color.Yellow.copy(alpha = flickerAlpha),
                    offset = Offset(0f, 0f),
                    blurRadius = 30f * flickerAlpha
                )
            )
        )
    }
}

@Composable
fun PhotographerTextAnimation() {
    val infiniteTransition = rememberInfiniteTransition(label = "shutter")
    val focusGlow by infiniteTransition.animateFloat(
        initialValue = 10f, targetValue = 30f,
        animationSpec = infiniteRepeatable(tween(1000), RepeatMode.Reverse),
        label = "focus"
    )

    // Camera Flash Animation (Faster & Snappier)
    val flashAlpha by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = keyframes {
                durationMillis = 1500 // Faster cycle
                1f at 0        // Instant flash at start
                0f at 150      // Very quick fade out
                0f at 1500     // Pause before next flash
            }
        ),
        label = "flash"
    )

    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Box(contentAlignment = Alignment.Center) {
            Icon(
                imageVector = Icons.Default.PhotoCamera,
                contentDescription = null,
                tint = Color.Black,
                modifier = Modifier.size(32.dp).padding(bottom = 8.dp)
            )
            
            // Lens Flare Flash on Icon
            if (flashAlpha > 0.1f) {
                Canvas(modifier = Modifier.size(40.dp)) {
                    drawCircle(
                        brush = Brush.radialGradient(
                            colors = listOf(Color.White, Color.Transparent),
                            center = center,
                            radius = 60f * flashAlpha
                        ),
                        radius = 60f * flashAlpha,
                        center = center
                    )
                }
            }
        }

        Box(contentAlignment = Alignment.Center) {
            Text(
                text = "PHOTOGRAPHER",
                style = MaterialTheme.typography.displaySmall.copy(
                    fontWeight = FontWeight.ExtraBold,
                    brush = Brush.verticalGradient(listOf(Color.White, Color.DarkGray, Color.White)),
                    letterSpacing = 1.sp,
                    shadow = Shadow(
                        color = Color.Cyan.copy(alpha = 0.6f),
                        offset = Offset(0f, 0f),
                        blurRadius = focusGlow
                    )
                )
            )
            
            Canvas(modifier = Modifier.width(300.dp).height(80.dp)) {
                val w = size.width
                val h = size.height
                val cornerSize = 20f
                val p = 10f
                
                drawPath(
                    path = Path().apply {
                        moveTo(p, p + cornerSize); lineTo(p, p); lineTo(p + cornerSize, p)
                        moveTo(w - p - cornerSize, p); lineTo(w - p, p); lineTo(w - p, p + cornerSize)
                        moveTo(p, h - p - cornerSize); lineTo(p, h - p); lineTo(p + cornerSize, h - p)
                        moveTo(w - p - cornerSize, h - p); lineTo(w - p, h - p); lineTo(w - p, h - p - cornerSize)
                    },
                    color = Color.Black,
                    style = Stroke(width = 4f)
                )
                
                // Screen-wide Flash Effect
                if (flashAlpha > 0f) {
                    drawRect(
                        color = Color.White,
                        alpha = flashAlpha * 0.4f
                    )
                }
            }
        }
    }
}

@Composable
fun PhysioTextAnimation() {
    val infiniteTransition = rememberInfiniteTransition(label = "healing")
    val ecgOffset by infiniteTransition.animateFloat(
        initialValue = 0f, targetValue = 1000f,
        animationSpec = infiniteRepeatable(tween(5000, easing = LinearEasing)), // Slower pace
        label = "ecg"
    )

    Box(contentAlignment = Alignment.Center) {
        // Moving ECG Heartbeat Curve (Left to Right)
        Canvas(modifier = Modifier.fillMaxWidth().height(100.dp)) {
            val w = size.width
            val h = size.height
            val ecgPath = Path().apply {
                moveTo(0f, h/2)
                for (x in 0..w.toInt() step 5) {
                    val relativeX = (x - ecgOffset) % 200f // Minus for left-to-right flow
                    val normalizedX = if (relativeX < 0) relativeX + 200f else relativeX
                    val y = when {
                        normalizedX in 80f..95f -> h/2 - (normalizedX - 80f) * 3f
                        normalizedX in 95f..110f -> h/2 + (normalizedX - 95f) * 2f
                        normalizedX in 120f..125f -> h/2 + 20f
                        normalizedX in 125f..130f -> h/2 - 60f // R-Spike
                        normalizedX in 130f..135f -> h/2 + 40f
                        else -> h/2
                    }
                    lineTo(x.toFloat(), y)
                }
            }
            drawPath(ecgPath, Color(0xFFE91E63).copy(alpha = 0.3f), style = Stroke(width = 4f, cap = StrokeCap.Round))
        }

        Text(
            text = "PHYSIOTHERAPY",
            style = MaterialTheme.typography.displaySmall.copy(
                fontWeight = FontWeight.Bold,
                brush = Brush.horizontalGradient(listOf(Color(0xFF00BFA5), Color(0xFFB2DFDB), Color(0xFF00BFA5))),
                letterSpacing = 2.sp,
                shadow = Shadow(
                    color = Color(0xFF4CAF50).copy(alpha = 0.5f),
                    offset = Offset(0f, 4f),
                    blurRadius = 15f
                )
            )
        )
    }
}

@Composable
fun TattooTextAnimation() {
    val infiniteTransition = rememberInfiniteTransition(label = "ink")
    val jitter by infiniteTransition.animateFloat(
        initialValue = -1.5f, targetValue = 1.5f,
        animationSpec = infiniteRepeatable(tween(50), RepeatMode.Reverse),
        label = "jitter"
    )
    val dripProgress by infiniteTransition.animateFloat(
        initialValue = 0f, targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(2500, easing = FastOutSlowInEasing)),
        label = "drip"
    )

    val rainbowColors = listOf(Color.Magenta, Color.Cyan, Color.Yellow, Color.Green, Color.Red)

    Box(contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = "TATTOO ART",
                style = MaterialTheme.typography.displayMedium.copy(
                    fontWeight = FontWeight.Black,
                    brush = Brush.linearGradient(listOf(Color(0xFFFF00FF), Color(0xFF00FFFF), Color(0xFFFFFF00))),
                    letterSpacing = (-1).sp,
                    shadow = Shadow(
                        color = Color.Red.copy(alpha = 0.4f),
                        offset = Offset(4f, 4f),
                        blurRadius = 10f
                    )
                ),
                modifier = Modifier.graphicsLayer { 
                    translationX = jitter 
                    translationY = jitter
                }
            )
            
            // Colorful Ink Drips forming a Tattoo Machine/Pen silhouette
            Canvas(modifier = Modifier.width(250.dp).height(80.dp)) {
                val w = size.width
                val h = size.height
                
                for (i in 1..8) {
                    val startX = w * (i.toFloat() / 9f)
                    val currentY = dripProgress * h * 0.6f
                    val dripColor = rainbowColors[i % rainbowColors.size]
                    
                    drawCircle(dripColor, radius = 4f, center = Offset(startX, currentY))
                    drawLine(dripColor, Offset(startX, 0f), Offset(startX, currentY), 2f)
                }
                
                // Colorful Art Pen Silhouette at the collection point
                val penPath = Path().apply {
                    moveTo(w * 0.45f, h * 0.6f)
                    lineTo(w * 0.55f, h * 0.6f)
                    lineTo(w * 0.52f, h * 0.95f)
                    lineTo(w * 0.48f, h * 0.95f)
                    close()
                }
                drawPath(penPath, Brush.linearGradient(rainbowColors), alpha = 0.8f)
                drawRect(Color.Black, Offset(w * 0.495f, h * 0.95f), Size(3f, 12f)) // Needle tip
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
            .padding(horizontal = 20.dp)
            .graphicsLayer { translationY = translateY },
        shape = RoundedCornerShape(32.dp),
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = 6.dp,
        shadowElevation = 16.dp
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
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

    // Premium dynamic gradient background
    val gradientBrush = Brush.verticalGradient(
        colors = listOf(
            MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.4f),
            MaterialTheme.colorScheme.background
        )
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(gradientBrush)
            .statusBarsPadding()
            .navigationBarsPadding()
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Flexible layout balance
            Spacer(modifier = Modifier.weight(0.4f))

            // 1. Showcase Header
            ServiceTicker()

            Spacer(modifier = Modifier.height(16.dp))

            // 2. Startup Logo
            androidx.compose.foundation.Image(
                painter = painterResource(id = R.drawable.ic_logo),
                contentDescription = "DigiSewa Logo",
                modifier = Modifier.size(170.dp)
            )

            Spacer(modifier = Modifier.weight(0.1f))

            // 3. Main Login Interface
            AnimatedLoginCard {
                Text(
                    text = "Welcome Back",
                    style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold)
                )
                Text(
                    text = "Sign in to continue to DigiSewa",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Spacer(modifier = Modifier.height(20.dp))

                // Email Input
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email Address") },
                    leadingIcon = { Icon(Icons.Default.Email, contentDescription = null, tint = MaterialTheme.colorScheme.primary) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Password Input
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Password") },
                    leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null, tint = MaterialTheme.colorScheme.primary) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                    trailingIcon = {
                        IconButton(onClick = { passwordVisible = !passwordVisible }) {
                            Icon(
                                imageVector = if (passwordVisible) CustomIcons.EyeWithEyelashesOpen else CustomIcons.EyeWithEyelashesClosed,
                                contentDescription = null
                            )
                        }
                    },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(20.dp))

                // Action Button
                Button(
                    onClick = { viewModel.signIn(email, password) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp),
                    shape = RoundedCornerShape(16.dp),
                    enabled = authState !is AuthState.Loading
                ) {
                    if (authState is AuthState.Loading) {
                        CircularProgressIndicator(size = 24.dp, color = Color.White, strokeWidth = 3.dp)
                    } else {
                        Text("LOGIN", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                    }
                }

                // Error Feedback
                if (authState is AuthState.Error) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "Wrong Login Details Provided",
                        color = MaterialTheme.colorScheme.error,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.align(Alignment.CenterHorizontally),
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // 4. Onboarding Footer
            TextButton(
                onClick = onNavigateToSignUp,
                modifier = Modifier.padding(bottom = 12.dp)
            ) {
                Text(
                    "New to DigiSewa? Create an account",
                    style = MaterialTheme.typography.bodyMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                )
            }
            
            Spacer(modifier = Modifier.weight(0.1f))
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
