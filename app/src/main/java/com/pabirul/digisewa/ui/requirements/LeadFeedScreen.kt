package com.pabirul.digisewa.ui.requirements

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.pabirul.digisewa.Profile
import com.pabirul.digisewa.R
import com.pabirul.digisewa.RequirementWithDetails

@Composable
fun LeadFeedScreen(
    profile: Profile,
    viewModel: RequirementViewModel,
    onRequirementClick: (RequirementWithDetails) -> Unit
) {
    val leads by viewModel.leads.collectAsState()
    val state by viewModel.state.collectAsState()

    LaunchedEffect(profile.providerDetails?.categoryId) {
        viewModel.loadLeads(profile.providerDetails?.categoryId)
    }

    Scaffold { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            if (leads.isEmpty() && state !is RequirementState.Loading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(stringResource(R.string.no_leads_yet))
                }
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    items(leads) { lead ->
                        LeadItem(lead = lead, onClick = { onRequirementClick(lead) })
                    }
                }
            }

            if (state is RequirementState.Loading) {
                CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
            }
        }
    }
}

@Composable
fun LeadItem(lead: RequirementWithDetails, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(
                    text = lead.category?.name ?: "Requirement",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.primary
                )
                Text(
                    text = lead.createdAt.take(10), // Simplistic date
                    style = MaterialTheme.typography.labelSmall
                )
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = lead.description,
                style = MaterialTheme.typography.bodyMedium,
                maxLines = 3
            )
            
            Spacer(modifier = Modifier.height(12.dp))
            
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = androidx.compose.material.icons.Icons.Default.LocationOn,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp),
                    tint = MaterialTheme.colorScheme.secondary
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = lead.locationName ?: "N/A",
                    style = MaterialTheme.typography.bodySmall
                )
                
                Spacer(modifier = Modifier.weight(1f))
                
                if (lead.budget != null) {
                    Text(
                        text = "₹${lead.budget}",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.tertiary
                    )
                }
            }
            
            if (lead.responses.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "${lead.responses.size} responses already",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.secondary
                )
            }
        }
    }
}
