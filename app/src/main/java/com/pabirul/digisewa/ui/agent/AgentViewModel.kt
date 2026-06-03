package com.pabirul.digisewa.ui.agent

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pabirul.digisewa.data.model.OnboardingLead
import com.pabirul.digisewa.data.repository.AgentRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class AgentState {
    object Idle : AgentState()
    object Loading : AgentState()
    object Success : AgentState()
    data class Error(val message: String) : AgentState()
}

class AgentViewModel(private val repository: AgentRepository = AgentRepository()) : ViewModel() {
    private val _state = MutableStateFlow<AgentState>(AgentState.Idle)
    val state = _state.asStateFlow()

    private val _leads = MutableStateFlow<List<OnboardingLead>>(emptyList())
    val leads = _leads.asStateFlow()

    fun onboardProvider(lead: OnboardingLead) {
        viewModelScope.launch {
            _state.value = AgentState.Loading
            val result = repository.onboardProvider(lead)
            result.onSuccess {
                _state.value = AgentState.Success
                loadLeads(lead.agentId)
            }.onFailure {
                _state.value = AgentState.Error(it.message ?: "Failed to onboard provider")
            }
        }
    }

    fun loadLeads(agentId: String) {
        viewModelScope.launch {
            _leads.value = repository.getMyLeads(agentId)
        }
    }

    fun resetState() {
        _state.value = AgentState.Idle
    }
}
