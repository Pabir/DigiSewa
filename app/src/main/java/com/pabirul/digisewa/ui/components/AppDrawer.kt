package com.pabirul.digisewa.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.pabirul.digisewa.Profile
import com.pabirul.digisewa.UserRole

@Composable
fun AppDrawer(
    profile: Profile,
    onNavigate: (String) -> Unit,
    onSignOut: () -> Unit,
    closeDrawer: () -> Unit
) {
    ModalDrawerSheet {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp)
        ) {
            Column {
                AsyncImage(
                    model = profile.avatarUrl ?: "https://via.placeholder.com/150",
                    contentDescription = null,
                    modifier = Modifier
                        .size(80.dp)
                        .clip(CircleShape),
                    contentScale = ContentScale.Crop
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(text = profile.fullName, style = MaterialTheme.typography.titleLarge)
                Text(text = profile.role.name.lowercase().capitalize(), style = MaterialTheme.typography.bodyMedium)
            }
        }

        HorizontalDivider()

        NavigationDrawerItem(
            label = { Text("Home") },
            selected = false,
            onClick = { 
                onNavigate("home")
                closeDrawer()
            },
            icon = { Icon(Icons.Default.Home, contentDescription = null) },
            modifier = Modifier.padding(NavigationDrawerItemDefaults.ItemPadding)
        )

        if (profile.role == UserRole.PROVIDER) {
            NavigationDrawerItem(
                label = { Text("My Services") },
                selected = false,
                onClick = { 
                    onNavigate("manage_services")
                    closeDrawer()
                },
                icon = { Icon(Icons.Default.Build, contentDescription = null) },
                modifier = Modifier.padding(NavigationDrawerItemDefaults.ItemPadding)
            )
        }

        NavigationDrawerItem(
            label = { Text("Edit Profile") },
            selected = false,
            onClick = { 
                onNavigate("edit_profile")
                closeDrawer()
            },
            icon = { Icon(Icons.Default.Person, contentDescription = null) },
            modifier = Modifier.padding(NavigationDrawerItemDefaults.ItemPadding)
        )

        NavigationDrawerItem(
            label = { Text("Settings") },
            selected = false,
            onClick = { 
                onNavigate("settings")
                closeDrawer()
            },
            icon = { Icon(Icons.Default.Settings, contentDescription = null) },
            modifier = Modifier.padding(NavigationDrawerItemDefaults.ItemPadding)
        )

        Spacer(modifier = Modifier.weight(1f))
        HorizontalDivider()

        NavigationDrawerItem(
            label = { Text("Sign Out") },
            selected = false,
            onClick = { 
                onSignOut()
                closeDrawer()
            },
            icon = { Icon(Icons.Default.ExitToApp, contentDescription = null) },
            modifier = Modifier.padding(NavigationDrawerItemDefaults.ItemPadding)
        )
        Spacer(modifier = Modifier.height(16.dp))
    }
}

private fun String.capitalize() = replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }
