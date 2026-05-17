package com.pabirul.digisewa.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.LayoutCoordinates
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInRoot
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay

data class OnboardingStep(
    val title: String,
    val description: String,
    val targetTag: String? = null
)

@Composable
fun OnboardingWalkthrough(
    steps: List<OnboardingStep>,
    onComplete: () -> Unit,
    targetCoordinates: Map<String, LayoutCoordinates>
) {
    var currentStepIndex by remember { mutableIntStateOf(0) }
    val currentStep = steps.getOrNull(currentStepIndex) ?: return
    
    val targetCoords = currentStep.targetTag?.let { targetCoordinates[it] }
    val rect = remember(targetCoords) {
        targetCoords?.let {
            val position = it.positionInRoot()
            val size = it.size
            Rect(position, Size(size.width.toFloat(), size.height.toFloat()))
        }
    }

    BoxWithConstraints(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Transparent)
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null
            ) {
                if (currentStepIndex < steps.size - 1) {
                    currentStepIndex++
                } else {
                    onComplete()
                }
            }
    ) {
        val screenHeightPx = with(LocalDensity.current) { maxHeight.toPx() }
        
        // Dim Background with Hole
        Canvas(modifier = Modifier.fillMaxSize().graphicsLayer { alpha = 0.99f }) {
            drawRect(Color.Black.copy(alpha = 0.7f))
            
            rect?.let {
                drawRoundRect(
                    color = Color.Transparent,
                    topLeft = it.topLeft.copy(x = it.topLeft.x - 8.dp.toPx(), y = it.topLeft.y - 8.dp.toPx()),
                    size = it.size.copy(width = it.size.width + 16.dp.toPx(), height = it.size.height + 16.dp.toPx()),
                    cornerRadius = CornerRadius(12.dp.toPx()),
                    blendMode = BlendMode.Clear
                )
            }
        }

        // Info Card
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = if (rect != null && rect.center.y < screenHeightPx / 2) Alignment.BottomCenter else Alignment.TopCenter
        ) {
            Card(
                modifier = Modifier
                    .padding(32.dp)
                    .padding(top = if (rect != null && rect.center.y < screenHeightPx / 2) 0.dp else 100.dp)
                    .padding(bottom = if (rect != null && rect.center.y >= screenHeightPx / 2) 0.dp else 100.dp)
                    .fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(24.dp)) {
                    Text(
                        text = currentStep.title,
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = currentStep.description,
                        style = MaterialTheme.typography.bodyLarge
                    )
                    Spacer(modifier = Modifier.height(24.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        TextButton(
                            onClick = onComplete,
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text("Skip", color = MaterialTheme.colorScheme.outline)
                        }
                        
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "${currentStepIndex + 1} / ${steps.size}",
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.outline
                            )
                            Spacer(modifier = Modifier.width(16.dp))
                            Button(
                                onClick = {
                                    if (currentStepIndex < steps.size - 1) {
                                        currentStepIndex++
                                    } else {
                                        onComplete()
                                    }
                                },
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text(if (currentStepIndex < steps.size - 1) "Next" else "Get Started")
                            }
                        }
                    }
                }
            }
        }
    }
}
