package com.pabirul.digisewa.ui.agent

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.pabirul.digisewa.Profile
import com.pabirul.digisewa.data.model.OnboardingLead

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MyLeadsScreen(
    agentProfile: Profile,
    viewModel: AgentViewModel,
    onBack: () -> Unit
) {
    val leads by viewModel.leads.collectAsState()

    LaunchedEffect(agentProfile.id) {
        viewModel.loadLeads(agentProfile.id)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("My Onboarded Providers", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        if (leads.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Text("No providers onboarded yet.")
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(leads) { lead ->
                    LeadItem(lead)
                }
            }
        }
    }
}

@Composable
fun LeadItem(lead: OnboardingLead) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                modifier = Modifier.size(48.dp),
                shape = RoundedCornerShape(12.dp),
                color = MaterialTheme.colorScheme.primary.copy(alpha = 0.1f)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(Icons.Default.Person, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                }
            }
            
            Spacer(modifier = Modifier.width(16.dp))
            
            Column(modifier = Modifier.weight(1f)) {
                Text(text = lead.providerName, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                Text(text = lead.providerEmail, style = MaterialTheme.typography.bodySmall)
                Text(text = lead.providerPhone, style = MaterialTheme.typography.bodySmall)
            }
            
            Surface(
                color = if (lead.status == "pending") Color(0xFFFF9800).copy(alpha = 0.1f) else Color(0xFF4CAF50).copy(alpha = 0.1f),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text(
                    text = lead.status.uppercase(),
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                    style = MaterialTheme.typography.labelSmall.copy(
                        fontWeight = FontWeight.Bold,
                        color = if (lead.status == "pending") Color(0xFFFF9800) else Color(0xFF4CAF50)
                    )
                )
            }
        }
    }
}
