package com.pabirul.digisewa.ui.agent

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material.icons.filled.Group
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.pabirul.digisewa.Profile

@Composable
fun AgentDashboardScreen(
    profile: Profile,
    onOnboardProvider: () -> Unit,
    onViewMyProviders: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "Agent Dashboard",
            style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold)
        )
        Text(
            text = "Welcome, ${profile.fullName}",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.outline
        )

        Spacer(modifier = Modifier.height(32.dp))

        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
        ) {
            Column(modifier = Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(Icons.Default.PersonAdd, contentDescription = null, modifier = Modifier.size(48.dp))
                Spacer(modifier = Modifier.height(16.dp))
                Button(
                    onClick = onOnboardProvider,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Onboard New Provider")
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer)
        ) {
            Column(modifier = Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(Icons.Default.Group, contentDescription = null, modifier = Modifier.size(48.dp))
                Spacer(modifier = Modifier.height(16.dp))
                Button(
                    onClick = onViewMyProviders,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary)
                ) {
                    Text("My Onboarded Providers")
                }
            }
        }
    }
}
