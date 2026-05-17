package com.pabirul.digisewa.ui.discovery

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.pabirul.digisewa.Category
import com.pabirul.digisewa.Profile

import androidx.appcompat.app.AppCompatDelegate
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.layout.LayoutCoordinates
import androidx.compose.ui.layout.onGloballyPositioned
import com.pabirul.digisewa.R
import com.pabirul.digisewa.ui.components.AdMobBanner

@Composable
fun CustomerHomeScreen(
    profile: Profile,
    viewModel: DiscoveryViewModel,
    onCategoryClick: (Category) -> Unit,
    onPositioned: (String, LayoutCoordinates) -> Unit = { _, _ -> }
) {
    val categories by viewModel.categories.collectAsState()
    val state by viewModel.state.collectAsState()

    Scaffold(
        bottomBar = {
            AdMobBanner()
        }
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding)) {
            // Welcome Header
            Surface(
                modifier = Modifier.fillMaxWidth().onGloballyPositioned { onPositioned("hero", it) },
                color = MaterialTheme.colorScheme.primary,
                shape = RoundedCornerShape(bottomStart = 32.dp, bottomEnd = 32.dp)
            ) {
                Column(modifier = Modifier.padding(24.dp)) {
                    Text(
                        text = "${stringResource(R.string.hello)}, ${profile.fullName.split(" ")[0]}!",
                        style = MaterialTheme.typography.headlineMedium.copy(
                            color = Color.White,
                            fontWeight = FontWeight.Bold
                        )
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = stringResource(R.string.service_need_prompt),
                        style = MaterialTheme.typography.bodyLarge.copy(color = Color.White.copy(alpha = 0.8f))
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = stringResource(R.string.explore_categories),
                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
            )

            if (state is DiscoveryState.Loading && categories.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            } else {
                LazyVerticalGrid(
                    columns = GridCells.Fixed(2),
                    contentPadding = PaddingValues(16.dp),
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                    modifier = Modifier.fillMaxSize().onGloballyPositioned { onPositioned("categories", it) }
                ) {
                    items(categories) { category ->
                        CategoryCard(category = category, onClick = { onCategoryClick(category) })
                    }
                }
            }
        }
    }
}

@Composable
fun CategoryCard(category: Category, onClick: () -> Unit) {
    val icon = getIconForCategory(category.name)
    val color = getColorForCategory(category.name)
    
    // Determine localized name based on app locale
    val locales = AppCompatDelegate.getApplicationLocales()
    val currentLanguage = if (locales.isEmpty) "en" else locales.toLanguageTags()
    
    val displayName = when {
        currentLanguage.contains("bn", ignoreCase = true) -> category.nameBn ?: category.name
        currentLanguage.contains("hi", ignoreCase = true) -> category.nameHi ?: category.name
        else -> category.name
    }

    // DEBUG LOG
    android.util.Log.e("Localization", "Current Lang: $currentLanguage | Display Name: $displayName | Raw BN: ${category.nameBn}")

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .height(140.dp)
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(24.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(
            modifier = Modifier.fillMaxSize().padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Surface(
                color = color.copy(alpha = 0.1f),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.size(56.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = color,
                        modifier = Modifier.size(32.dp)
                    )
                }
            }
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = displayName,
                textAlign = TextAlign.Center,
                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                maxLines = 2
            )
        }
    }
}

private fun getIconForCategory(name: String): ImageVector {
    return when {
        name.contains("Physiotherapy") -> Icons.Default.HealthAndSafety
        name.contains("Blood") -> Icons.Default.Bloodtype
        name.contains("Nursing") -> Icons.Default.MedicalServices
        name.contains("Yoga") -> Icons.Default.SelfImprovement
        name.contains("Massage") -> Icons.Default.Spa
        name.contains("Makeup") -> Icons.Default.Face
        name.contains("Mehndi") -> Icons.Default.Palette
        name.contains("Photography") -> Icons.Default.PhotoCamera
        name.contains("Priest") -> Icons.Default.Church
        name.contains("Waitstaff") -> Icons.Default.Restaurant
        name.contains("Electrician") -> Icons.Default.ElectricalServices
        name.contains("Plumbing") -> Icons.Default.Plumbing
        name.contains("Appliances") -> Icons.Default.HomeRepairService
        name.contains("Cleaning") -> Icons.Default.CleaningServices
        name.contains("Pest") -> Icons.Default.BugReport
        name.contains("Tutors") -> Icons.Default.School
        name.contains("Music") -> Icons.Default.MusicNote
        name.contains("Art") -> Icons.Default.Brush
        name.contains("Pet") -> Icons.Default.Pets
        else -> Icons.Default.Category
    }
}

private fun getColorForCategory(name: String): Color {
    return when {
        name.contains("Health") || name.contains("Physio") || name.contains("Blood") || name.contains("Nursing") -> Color(0xFFE91E63)
        name.contains("Yoga") || name.contains("Massage") -> Color(0xFF9C27B0)
        name.contains("Makeup") || name.contains("Mehndi") || name.contains("Photography") -> Color(0xFFFF4081)
        name.contains("Maintenance") || name.contains("Electrician") || name.contains("Plumbing") -> Color(0xFF2196F3)
        name.contains("Education") || name.contains("Tutors") -> Color(0xFF4CAF50)
        name.contains("Pet") -> Color(0xFFFF9800)
        else -> Color(0xFF607D8B)
    }
}
