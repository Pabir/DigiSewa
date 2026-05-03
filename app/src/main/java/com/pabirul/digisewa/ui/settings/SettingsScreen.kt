package com.pabirul.digisewa.ui.settings

import androidx.appcompat.app.AppCompatDelegate
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.RadioButtonChecked
import androidx.compose.material.icons.filled.RadioButtonUnchecked
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.core.os.LocaleListCompat
import com.pabirul.digisewa.R
import com.pabirul.digisewa.ui.components.AdMobHelper
import android.app.Activity
import android.widget.Toast
import androidx.compose.material.icons.filled.CardGiftcard
import androidx.compose.material.icons.filled.PlayArrow

@Composable
fun SettingsScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text(
            text = stringResource(R.string.settings),
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(24.dp))

        LanguageSelectionSection()
        
        Spacer(modifier = Modifier.height(24.dp))
        
        RewardsSection()
    }
}

@Composable
fun RewardsSection() {
    val context = androidx.compose.ui.platform.LocalContext.current
    
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.5f))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.CardGiftcard, contentDescription = null, tint = MaterialTheme.colorScheme.secondary)
                Spacer(modifier = Modifier.width(12.dp))
                Text(
                    text = "Bonus Rewards",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Support DigiSewa by watching a short video ad and earn points.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSecondaryContainer.copy(alpha = 0.8f)
            )
            
            Spacer(modifier = Modifier.height(16.dp))

            Button(
                onClick = {
                    if (context is Activity) {
                        AdMobHelper.showRewardedAd(context) { rewardAmount ->
                            Toast.makeText(context, "You earned $rewardAmount bonus points!", Toast.LENGTH_SHORT).show()
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary)
            ) {
                Icon(Icons.Default.PlayArrow, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Watch Ad & Earn")
            }
        }
    }
}

@Composable
fun LanguageSelectionSection() {
    val context = androidx.compose.ui.platform.LocalContext.current
    val locales = AppCompatDelegate.getApplicationLocales()
    val currentLanguage: String = if (locales.isEmpty) "en" else locales.toLanguageTags()
    
    val languages = listOf(
        Triple("en", stringResource(R.string.english), "English"),
        Triple("bn", stringResource(R.string.bengali), "বাংলা"),
        Triple("hi", stringResource(R.string.hindi), "हिन्दी")
    )

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Language, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                Spacer(modifier = Modifier.width(12.dp))
                Text(
                    text = stringResource(R.string.select_language),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )
            }
            
            Spacer(modifier = Modifier.height(16.dp))

            languages.forEach { (code, label, nativeName) ->
                val isSelected = currentLanguage.startsWith(code)
                
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            if (!isSelected) {
                                val appLocale: LocaleListCompat = LocaleListCompat.forLanguageTags(code)
                                AppCompatDelegate.setApplicationLocales(appLocale)
                                
                                // On some Android versions/devices, we need to trigger a manual recreation
                                // to ensure Compose sees the new configuration immediately.
                                (context as? android.app.Activity)?.recreate()
                            }
                        }
                        .padding(vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = if (isSelected) Icons.Default.RadioButtonChecked else Icons.Default.RadioButtonUnchecked,
                        contentDescription = null,
                        tint = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline
                    )
                    Spacer(modifier = Modifier.width(16.dp))
                    Column {
                        Text(
                            text = label,
                            style = MaterialTheme.typography.bodyLarge,
                            color = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = nativeName,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.outline
                        )
                    }
                }
                if (code != languages.last().first) {
                    HorizontalDivider(modifier = Modifier.padding(start = 40.dp))
                }
            }
        }
    }
}
