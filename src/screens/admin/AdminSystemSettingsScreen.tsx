import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, ActivityIndicator, Alert } from 'react-native';
import { Settings, Truck, Package } from 'lucide-react-native';
import { getSystemSettings, updateSystemSettings } from '../../services/firebaseService';
import { SystemSettings } from '../../types/adminTypes';

export const AdminSystemSettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getSystemSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings', error);
      Alert.alert('Error', 'Could not load system settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: keyof SystemSettings, value: boolean) => {
    if (!settings) return;

    // Optimistic update
    setSettings({ ...settings, [key]: value });
    setSaving(true);

    try {
      await updateSystemSettings({ [key]: value });
    } catch (error) {
      console.error('Failed to update setting', error);
      Alert.alert('Error', 'Failed to update setting. Reverting change.');
      // Revert on failure
      setSettings({ ...settings, [key]: !value });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Settings size={28} color="#1E293B" />
        <Text style={styles.title}>System Settings</Text>
      </View>

      <Text style={styles.subtitle}>Configure global platform features and integrations.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Delivery Partners</Text>
        <Text style={styles.cardDescription}>
          Turn delivery integrations on or off. When disabled, the option will immediately be hidden from buyers during checkout.
        </Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Truck size={24} color="#F59E0B" />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingName}>Shiprocket</Text>
              <Text style={styles.settingDesc}>Enable standard delivery via Shiprocket</Text>
            </View>
          </View>
          <Switch
            value={settings?.shiprocketEnabled ?? true}
            onValueChange={(val) => handleToggle('shiprocketEnabled', val)}
            trackColor={{ false: '#CBD5E1', true: '#4F46E5' }}
            thumbColor={'#FFFFFF'}
            disabled={saving}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Package size={24} color="#10B981" />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingName}>Shadowfax</Text>
              <Text style={styles.settingDesc}>Enable local delivery via Shadowfax</Text>
            </View>
          </View>
          <Switch
            value={settings?.shadowfaxEnabled ?? true}
            onValueChange={(val) => handleToggle('shadowfaxEnabled', val)}
            trackColor={{ false: '#CBD5E1', true: '#4F46E5' }}
            thumbColor={'#FFFFFF'}
            disabled={saving}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Settings size={24} color="#EF4444" />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingName}>Maintenance Warning</Text>
              <Text style={styles.settingDesc}>Turn on to show warning banner to junior admins during delete operations</Text>
            </View>
          </View>
          <Switch
            value={settings?.maintenanceWarningEnabled ?? false}
            onValueChange={(val) => handleToggle('maintenanceWarningEnabled', val)}
            trackColor={{ false: '#CBD5E1', true: '#EF4444' }}
            thumbColor={'#FFFFFF'}
            disabled={saving}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  settingDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
});
