package com.pabirul.digisewa.ui.requirements

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Schedule
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
fun MyRequirementsScreen(
    profile: Profile,
    viewModel: RequirementViewModel,
    onRequirementClick: (RequirementWithDetails) -> Unit
) {
    val myRequirements by viewModel.myRequirements.collectAsState()
    val state by viewModel.state.collectAsState()

    LaunchedEffect(profile.id) {
        viewModel.loadMyRequirements(profile.id)
    }

    Scaffold { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            if (myRequirements.isEmpty() && state !is RequirementState.Loading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(stringResource(R.string.no_requirements_yet))
                }
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    items(myRequirements) { req ->
                        RequirementItem(requirement = req, onClick = { onRequirementClick(req) })
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
fun RequirementItem(requirement: RequirementWithDetails, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(
                    text = requirement.category?.name ?: "Requirement",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.primary
                )
                Surface(
                    color = MaterialTheme.colorScheme.secondaryContainer,
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        text = requirement.status.name,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                        style = MaterialTheme.typography.labelSmall
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = requirement.description,
                style = MaterialTheme.typography.bodyMedium,
                maxLines = 2
            )
            
            Spacer(modifier = Modifier.height(12.dp))
            
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.LocationOn, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text(text = requirement.locationName ?: "N/A", style = MaterialTheme.typography.bodySmall)
                
                if (requirement.scheduledAt != null) {
                    Spacer(modifier = Modifier.width(12.dp))
                    Icon(imageVector = androidx.compose.material.icons.Icons.Default.Schedule, contentDescription = null, modifier = Modifier.size(16.dp), tint = MaterialTheme.colorScheme.outline)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(text = requirement.scheduledAt.split("T")[0], style = MaterialTheme.typography.bodySmall)
                }

                Spacer(modifier = Modifier.weight(1f))
                
                Text(
                    text = "${requirement.responses.size} Responses",
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}
