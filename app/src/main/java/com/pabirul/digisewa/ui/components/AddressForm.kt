package com.pabirul.digisewa.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.pabirul.digisewa.ui.address.PincodeUiState
import com.pabirul.digisewa.ui.address.PincodeViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddressForm(
    initialPinCode: String = "",
    initialAddress: String = "", // House / Flat / Street
    initialVtc: String = "",
    initialPostOffice: String = "",
    initialPoliceStation: String = "",
    initialDistrict: String = "",
    initialState: String = "",
    onAddressChanged: (String, String, String, String, String, String, String) -> Unit // pin, addr, vtc, po, ps, dist, state
) {
    var pinCode by remember { mutableStateOf(initialPinCode) }
    var address by remember { mutableStateOf(initialAddress) }
    var vtc by remember { mutableStateOf(initialVtc) }
    var postOffice by remember { mutableStateOf(initialPostOffice) }
    var policeStation by remember { mutableStateOf(initialPoliceStation) }
    var district by remember { mutableStateOf(initialDistrict) }
    var state by remember { mutableStateOf(initialState) }

    val viewModel: PincodeViewModel = viewModel()
    val uiState by viewModel.uiState.collectAsState()

    var expandedPo by remember { mutableStateOf(false) }

    LaunchedEffect(pinCode) {
        if (pinCode.length == 6) {
            viewModel.fetchPincodeDetails(pinCode)
        } else {
            viewModel.resetState()
        }
    }

    LaunchedEffect(uiState) {
        when (val s = uiState) {
            is PincodeUiState.Success -> {
                state = s.state
                district = s.district
                onAddressChanged(pinCode, address, vtc, postOffice, policeStation, district, state)
            }
            else -> {}
        }
    }

    val notifyChanges = {
        onAddressChanged(pinCode, address, vtc, postOffice, policeStation, district, state)
    }

    Column(modifier = Modifier.fillMaxWidth()) {
        OutlinedTextField(
            value = pinCode,
            onValueChange = {
                if (it.length <= 6) {
                    pinCode = it
                    notifyChanges()
                }
            },
            label = { Text("6-digit PIN Code") },
            modifier = Modifier.fillMaxWidth(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            shape = RoundedCornerShape(16.dp),
            isError = uiState is PincodeUiState.Error,
            supportingText = {
                if (uiState is PincodeUiState.Error) {
                    Text((uiState as PincodeUiState.Error).message)
                }
            },
            trailingIcon = {
                if (uiState is PincodeUiState.Loading) {
                    CircularProgressIndicator(modifier = Modifier.size(24.dp))
                }
            }
        )

        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(
            value = address,
            onValueChange = {
                address = it
                notifyChanges()
            },
            label = { Text("House No. / Street / Landmark") },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp)
        )

        Spacer(modifier = Modifier.height(12.dp))

        Row(modifier = Modifier.fillMaxWidth()) {
            OutlinedTextField(
                value = state,
                onValueChange = {},
                label = { Text("State") },
                modifier = Modifier.weight(1f),
                readOnly = true,
                shape = RoundedCornerShape(16.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    disabledContainerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
                )
            )
            Spacer(modifier = Modifier.width(8.dp))
            OutlinedTextField(
                value = district,
                onValueChange = {},
                label = { Text("District") },
                modifier = Modifier.weight(1f),
                readOnly = true,
                shape = RoundedCornerShape(16.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    disabledContainerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
                )
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Searchable Dropdown for Post Office (Success state) or TextField
        if (uiState is PincodeUiState.Success) {
            val s = uiState as PincodeUiState.Success
            ExposedDropdownMenuBox(
                expanded = expandedPo,
                onExpandedChange = { expandedPo = !expandedPo },
                modifier = Modifier.fillMaxWidth()
            ) {
                OutlinedTextField(
                    value = postOffice,
                    onValueChange = {
                        postOffice = it
                        expandedPo = true
                        notifyChanges()
                    },
                    label = { Text("Select Post Office") },
                    modifier = Modifier.menuAnchor().fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedPo) }
                )

                val filteredOptions = s.postOffices.filter { it.name.contains(postOffice, ignoreCase = true) }
                if (filteredOptions.isNotEmpty()) {
                    ExposedDropdownMenu(
                        expanded = expandedPo,
                        onDismissRequest = { expandedPo = false }
                    ) {
                        filteredOptions.forEach { option ->
                            DropdownMenuItem(
                                text = { Text(option.name) },
                                onClick = {
                                    postOffice = option.name
                                    expandedPo = false
                                    notifyChanges()
                                }
                            )
                        }
                    }
                }
            }
        } else {
            OutlinedTextField(
                value = postOffice,
                onValueChange = {
                    postOffice = it
                    notifyChanges()
                },
                label = { Text("Post Office") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp)
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(
            value = vtc,
            onValueChange = {
                vtc = it
                notifyChanges()
            },
            label = { Text("Village / Town / City") },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp)
        )

        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(
            value = policeStation,
            onValueChange = {
                policeStation = it
                notifyChanges()
            },
            label = { Text("Police Station") },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp)
        )
    }
}
