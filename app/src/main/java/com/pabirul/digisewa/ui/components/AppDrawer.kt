package com.pabirul.digisewa.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.pabirul.digisewa.Profile
import com.pabirul.digisewa.R
import com.pabirul.digisewa.UserRole

@Composable
fun AppDrawer(
    profile: Profile,
    onNavigate: (String) -> Unit,
    onSignOut: () -> Unit,
    closeDrawer: () -> Unit
) {
    ModalDrawerSheet(
        drawerContainerColor = MaterialTheme.colorScheme.surface,
        drawerShape = RoundedCornerShape(topEnd = 32.dp, bottomEnd = 32.dp)
    ) {
        // Header
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(MaterialTheme.colorScheme.primary, MaterialTheme.colorScheme.primary.copy(alpha = 0.8f))
                    )
                )
                .padding(vertical = 48.dp, horizontal = 24.dp)
        ) {
            Column {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    AsyncImage(
                        model = profile.avatarUrl ?: "https://via.placeholder.com/150",
                        contentDescription = null,
                        modifier = Modifier
                            .size(64.dp)
                            .clip(CircleShape)
                            .background(Color.White.copy(alpha = 0.2f))
                            .padding(2.dp)
                            .clip(CircleShape),
                        contentScale = ContentScale.Crop
                    )
                    Spacer(modifier = Modifier.width(16.dp))
                    androidx.compose.foundation.Image(
                        painter = painterResource(id = R.drawable.ic_logo),
                        contentDescription = "DigiSewa Logo",
                        modifier = Modifier.size(150.dp),
                        colorFilter = androidx.compose.ui.graphics.ColorFilter.tint(Color.White)
                    )
                }
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = profile.fullName,
                    style = MaterialTheme.typography.titleLarge.copy(
                        color = Color.White,
                        fontWeight = FontWeight.Bold
                    )
                )
                Surface(
                    color = Color.White.copy(alpha = 0.2f),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.padding(top = 4.dp)
                ) {
                    Text(
                        text = profile.role.name.lowercase().capitalize(),
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                        style = MaterialTheme.typography.labelSmall.copy(color = Color.White)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        NavigationDrawerItem(
            label = { Text("Home", fontWeight = FontWeight.SemiBold) },
            selected = false,
            onClick = { 
                onNavigate("home")
                closeDrawer()
            },
            icon = { Icon(Icons.Default.Home, contentDescription = null) },
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
            shape = RoundedCornerShape(16.dp),
            colors = NavigationDrawerItemDefaults.colors(unselectedIconColor = MaterialTheme.colorScheme.primary)
        )

        if (profile.role == UserRole.PROVIDER) {
            NavigationDrawerItem(
                label = { Text("My Services", fontWeight = FontWeight.SemiBold) },
                selected = false,
                onClick = { 
                    onNavigate("manage_services")
                    closeDrawer()
                },
                icon = { Icon(Icons.Default.Storefront, contentDescription = null) },
                modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                shape = RoundedCornerShape(16.dp),
                colors = NavigationDrawerItemDefaults.colors(unselectedIconColor = MaterialTheme.colorScheme.primary)
            )
        }

        NavigationDrawerItem(
            label = { Text("Edit Profile", fontWeight = FontWeight.SemiBold) },
            selected = false,
            onClick = { 
                onNavigate("edit_profile")
                closeDrawer()
            },
            icon = { Icon(Icons.Default.AccountCircle, contentDescription = null) },
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
            shape = RoundedCornerShape(16.dp),
            colors = NavigationDrawerItemDefaults.colors(unselectedIconColor = MaterialTheme.colorScheme.primary)
        )

        NavigationDrawerItem(
            label = { Text("Settings", fontWeight = FontWeight.SemiBold) },
            selected = false,
            onClick = { 
                onNavigate("settings")
                closeDrawer()
            },
            icon = { Icon(Icons.Default.Settings, contentDescription = null) },
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
            shape = RoundedCornerShape(16.dp),
            colors = NavigationDrawerItemDefaults.colors(unselectedIconColor = MaterialTheme.colorScheme.primary)
        )

        Spacer(modifier = Modifier.weight(1f))
        
        HorizontalDivider(modifier = Modifier.padding(horizontal = 24.dp))

        NavigationDrawerItem(
            label = { Text("Sign Out", fontWeight = FontWeight.SemiBold) },
            selected = false,
            onClick = { 
                onSignOut()
                closeDrawer()
            },
            icon = { Icon(Icons.Default.Logout, contentDescription = null) },
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 16.dp),
            shape = RoundedCornerShape(16.dp),
            colors = NavigationDrawerItemDefaults.colors(unselectedIconColor = MaterialTheme.colorScheme.error)
        )
    }
}

private fun String.capitalize() = replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }
