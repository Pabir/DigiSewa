package com.pabirul.digisewa.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.compose.foundation.clickable
import coil.compose.AsyncImage
import com.pabirul.digisewa.Profile
import com.pabirul.digisewa.R
import com.pabirul.digisewa.UserRole

import androidx.compose.ui.res.stringResource

@Composable
fun AppDrawer(
    profile: Profile,
    onNavigate: (String) -> Unit,
    onSignOut: () -> Unit,
    closeDrawer: () -> Unit
) {
    var showFullScreenImage by remember { mutableStateOf(false) }

    if (showFullScreenImage && !profile.avatarUrl.isNullOrBlank()) {
        Dialog(
            onDismissRequest = { showFullScreenImage = false },
            properties = DialogProperties(usePlatformDefaultWidth = false)
        ) {
            Surface(
                modifier = Modifier.fillMaxSize(),
                color = Color.Black.copy(alpha = 0.9f)
            ) {
                Box(modifier = Modifier.fillMaxSize()) {
                    IconButton(
                        onClick = { showFullScreenImage = false },
                        modifier = Modifier.align(Alignment.TopStart).padding(16.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Close",
                            tint = Color.White
                        )
                    }
                    
                    AsyncImage(
                        model = profile.avatarUrl,
                        contentDescription = null,
                        modifier = Modifier.fillMaxSize().padding(16.dp),
                        contentScale = ContentScale.Fit
                    )
                }
            }
        }
    }

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
                            .clip(CircleShape)
                            .clickable { 
                                if (!profile.avatarUrl.isNullOrBlank()) {
                                    showFullScreenImage = true
                                }
                            },
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
            label = { Text(stringResource(R.string.home), fontWeight = FontWeight.SemiBold) },
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

        NavigationDrawerItem(
            label = { Text(if (profile.role == UserRole.PROVIDER) stringResource(R.string.lead_feed) else stringResource(R.string.my_requirements), fontWeight = FontWeight.SemiBold) },
            selected = false,
            onClick = { 
                onNavigate("requirements")
                closeDrawer()
            },
            icon = { Icon(Icons.Default.ListAlt, contentDescription = null) },
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
            shape = RoundedCornerShape(16.dp),
            colors = NavigationDrawerItemDefaults.colors(unselectedIconColor = MaterialTheme.colorScheme.primary)
        )

        if (profile.role == UserRole.CUSTOMER) {
            NavigationDrawerItem(
                label = { Text(stringResource(R.string.post_requirement), fontWeight = FontWeight.SemiBold) },
                selected = false,
                onClick = { 
                    onNavigate("post_requirement")
                    closeDrawer()
                },
                icon = { Icon(Icons.Default.AddBox, contentDescription = null) },
                modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                shape = RoundedCornerShape(16.dp),
                colors = NavigationDrawerItemDefaults.colors(unselectedIconColor = MaterialTheme.colorScheme.primary)
            )
        }

        NavigationDrawerItem(
            label = { Text(if (profile.role == UserRole.PROVIDER) stringResource(R.string.booking_requests) else stringResource(R.string.my_bookings), fontWeight = FontWeight.SemiBold) },
            selected = false,
            onClick = { 
                onNavigate("bookings")
                closeDrawer()
            },
            icon = { Icon(Icons.Default.EventNote, contentDescription = null) },
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
            shape = RoundedCornerShape(16.dp),
            colors = NavigationDrawerItemDefaults.colors(unselectedIconColor = MaterialTheme.colorScheme.primary)
        )

        if (profile.role == UserRole.PROVIDER) {
            NavigationDrawerItem(
                label = { Text(stringResource(R.string.my_services), fontWeight = FontWeight.SemiBold) },
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
            label = { Text(stringResource(R.string.edit_profile), fontWeight = FontWeight.SemiBold) },
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
            label = { Text(stringResource(R.string.settings), fontWeight = FontWeight.SemiBold) },
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
            label = { Text(stringResource(R.string.sign_out), fontWeight = FontWeight.SemiBold) },
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
