package com.pabirul.digisewa.ui.map

import android.annotation.SuppressLint
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.pabirul.digisewa.R
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@SuppressLint("SetJavaScriptEnabled")
@Composable
fun OSMMapPicker(
    initialLat: Double,
    initialLng: Double,
    onLocationPicked: (Double, Double) -> Unit,
    onDismiss: () -> Unit
) {
    var pickedLat by remember { mutableDoubleStateOf(initialLat) }
    var pickedLng by remember { mutableDoubleStateOf(initialLng) }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = MaterialTheme.colorScheme.background
        ) {
            Column {
                // Header
                TopAppBar(
                    title = { Text(stringResource(R.string.pick_location_title)) },
                    actions = {
                        Button(
                            onClick = { onLocationPicked(pickedLat, pickedLng) },
                            modifier = Modifier.padding(end = 8.dp)
                        ) {
                            Text(stringResource(R.string.confirm))
                        }
                    }
                )

                Box(modifier = Modifier.weight(1f)) {
                    AndroidView(
                        factory = { context ->
                            WebView(context).apply {
                                settings.javaScriptEnabled = true
                                settings.domStorageEnabled = true
                                settings.databaseEnabled = true
                                settings.mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                                
                                webViewClient = object : WebViewClient() {
                                    override fun onPageFinished(view: WebView?, url: String?) {
                                        super.onPageFinished(view, url)
                                        view?.loadUrl("javascript:if(window.map){ window.map.resize(); }")
                                    }
                                }

                                addJavascriptInterface(object {
                                    @JavascriptInterface
                                    fun onLocationChange(lat: Double, lng: Double) {
                                        pickedLat = lat
                                        pickedLng = lng
                                    }
                                }, "Android")
                                
                                val html = """
                                    <!DOCTYPE html>
                                    <html>
                                    <head>
                                        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                                        <link href='https://unpkg.com/maplibre-gl@4.1.2/dist/maplibre-gl.css' rel='stylesheet' />
                                        <script src='https://unpkg.com/maplibre-gl@4.1.2/dist/maplibre-gl.js'></script>
                                        <style>
                                            html, body, #map { height: 100vh; width: 100vw; margin: 0; padding: 0; background-color: #f0f0f0; }
                                        </style>
                                    </head>
                                    <body>
                                        <div id="map"></div>
                                        <script>
                                            window.onload = function() {
                                                try {
                                                    window.map = new maplibregl.Map({
                                                        container: 'map',
                                                        style: 'https://tiles.openfreemap.org/styles/liberty',
                                                        center: [$initialLng, $initialLat],
                                                        zoom: 15,
                                                        attributionControl: false
                                                    });

                                                    window.map.on('move', function() {
                                                        var center = window.map.getCenter();
                                                        if (window.Android) {
                                                            window.Android.onLocationChange(center.lat, center.lng);
                                                        }
                                                    });

                                                    setTimeout(function(){ window.map.resize(); }, 500);
                                                } catch (e) {
                                                    console.error("MapLibre Fail: " + e.message);
                                                }
                                            };
                                        </script>
                                    </body>
                                    </html>
                                """.trimIndent()
                                loadDataWithBaseURL("https://openfreemap.org", html, "text/html", "UTF-8", null)
                            }
                        },
                        modifier = Modifier.fillMaxSize()
                    )

                    // STATIC PIN OVERLAY
                    Icon(
                        imageVector = Icons.Default.LocationOn,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier
                            .size(48.dp)
                            .align(Alignment.Center)
                            .offset(y = (-24).dp) 
                    )
                    
                    Surface(
                        modifier = Modifier
                            .align(Alignment.BottomCenter)
                            .padding(bottom = 32.dp, start = 16.dp, end = 16.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.9f),
                        shape = MaterialTheme.shapes.medium
                    ) {
                        Text(
                            stringResource(R.string.map_instruction),
                            modifier = Modifier.padding(12.dp),
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                }
            }
        }
    }
}
