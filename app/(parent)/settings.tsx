import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, SegmentedButtons, Divider, Switch } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Layout, DAY_NAMES } from '../../constants';
import { useAuthStore } from '../../lib/stores';
import { updateFamilySettings, updateFamily } from '../../lib/firebase/firestore';
import { hashPin } from '../../lib/utils/pin';
import type { PeriodType } from '../../lib/types';

export default function SettingsScreen() {
  const router = useRouter();
  const { familyId, family, logout } = useAuthStore();

  const [rewardThreshold, setRewardThreshold] = useState('80');
  const [penaltyThreshold, setPenaltyThreshold] = useState('50');
  const [rewardDesc, setRewardDesc] = useState('');
  const [penaltyDesc, setPenaltyDesc] = useState('');
  const [periodType, setPeriodType] = useState<PeriodType>('weekly');
  const [periodStartDay, setPeriodStartDay] = useState(1);
  const [autoRoll, setAutoRoll] = useState(true);
  const [customDays, setCustomDays] = useState('7');
  const [newPin, setNewPin] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (family?.settings) {
      setRewardThreshold(String(family.settings.rewardThresholdPercent));
      setPenaltyThreshold(String(family.settings.penaltyThresholdPercent));
      setRewardDesc(family.settings.rewardDescription);
      setPenaltyDesc(family.settings.penaltyDescription);
      setPeriodType(family.settings.periodType);
      setPeriodStartDay(family.settings.periodStartDay);
      setAutoRoll(family.settings.autoRollPeriods);
      if (family.settings.customPeriodDays) {
        setCustomDays(String(family.settings.customPeriodDays));
      }
    }
  }, [family]);

  const handleSave = async () => {
    if (!familyId) return;
    setSaving(true);
    try {
      await updateFamilySettings(familyId, {
        rewardThresholdPercent: parseInt(rewardThreshold, 10) || 80,
        penaltyThresholdPercent: parseInt(penaltyThreshold, 10) || 50,
        rewardDescription: rewardDesc,
        penaltyDescription: penaltyDesc,
        periodType,
        periodStartDay,
        autoRollPeriods: autoRoll,
        customPeriodDays: periodType === 'custom' ? parseInt(customDays, 10) || 7 : undefined,
      });

      if (newPin.length >= 4) {
        const hashed = await hashPin(newPin);
        await updateFamily(familyId, { childPin: hashed });
        setNewPin('');
      }

      Alert.alert('Saved', 'Settings updated successfully');
    } catch (e) {
      console.error('Failed to save settings:', e);
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', onPress: () => logout() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Thresholds
        </Text>
        <TextInput
          label="Reward Threshold (%)"
          value={rewardThreshold}
          onChangeText={setRewardThreshold}
          mode="outlined"
          keyboardType="number-pad"
          style={styles.input}
        />
        <TextInput
          label="Penalty Threshold (%)"
          value={penaltyThreshold}
          onChangeText={setPenaltyThreshold}
          mode="outlined"
          keyboardType="number-pad"
          style={styles.input}
        />

        <Divider style={styles.divider} />

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Reward & Penalty Messages
        </Text>
        <TextInput
          label="Reward Message"
          value={rewardDesc}
          onChangeText={setRewardDesc}
          mode="outlined"
          multiline
          style={styles.input}
        />
        <TextInput
          label="Penalty Message"
          value={penaltyDesc}
          onChangeText={setPenaltyDesc}
          mode="outlined"
          multiline
          style={styles.input}
        />

        <Divider style={styles.divider} />

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Period Settings
        </Text>
        <SegmentedButtons
          value={periodType}
          onValueChange={(v) => setPeriodType(v as PeriodType)}
          buttons={[
            { value: 'weekly', label: 'Weekly' },
            { value: 'biweekly', label: 'Biweekly' },
            { value: 'monthly', label: 'Monthly' },
            { value: 'custom', label: 'Custom' },
          ]}
          style={styles.segment}
        />

        {periodType === 'custom' && (
          <TextInput
            label="Custom Period (days)"
            value={customDays}
            onChangeText={setCustomDays}
            mode="outlined"
            keyboardType="number-pad"
            style={styles.input}
          />
        )}

        {(periodType === 'weekly' || periodType === 'biweekly') && (
          <View>
            <Text variant="bodyMedium" style={styles.label}>Start Day</Text>
            <View style={styles.daysRow}>
              {DAY_NAMES.map((name, i) => (
                <Button
                  key={i}
                  mode={periodStartDay === i ? 'contained' : 'outlined'}
                  compact
                  onPress={() => setPeriodStartDay(i)}
                  style={styles.dayBtn}
                  labelStyle={styles.dayBtnLabel}
                >
                  {name}
                </Button>
              ))}
            </View>
          </View>
        )}

        <View style={styles.switchRow}>
          <Text variant="bodyMedium">Auto-roll periods</Text>
          <Switch value={autoRoll} onValueChange={setAutoRoll} />
        </View>

        <Divider style={styles.divider} />

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Child PIN
        </Text>
        <TextInput
          label="New Child PIN (leave blank to keep current)"
          value={newPin}
          onChangeText={(t) => setNewPin(t.replace(/[^0-9]/g, '').slice(0, 6))}
          mode="outlined"
          keyboardType="number-pad"
          maxLength={6}
          style={styles.input}
        />

        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          style={styles.saveButton}
        >
          Save Settings
        </Button>

        <Divider style={styles.divider} />

        <Button
          mode="outlined"
          icon="logout"
          textColor={Colors.error}
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          Log Out
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Layout.padding.md,
    paddingBottom: Layout.padding.xl * 2,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Layout.padding.sm,
  },
  input: {
    marginBottom: Layout.padding.sm,
    backgroundColor: Colors.surface,
  },
  divider: {
    marginVertical: Layout.padding.lg,
  },
  segment: {
    marginBottom: Layout.padding.md,
  },
  label: {
    color: Colors.textSecondary,
    marginBottom: Layout.padding.sm,
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: Layout.padding.md,
  },
  dayBtn: {
    minWidth: 44,
  },
  dayBtnLabel: {
    fontSize: 12,
    marginHorizontal: 4,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Layout.padding.sm,
  },
  saveButton: {
    marginTop: Layout.padding.md,
  },
  logoutButton: {
    borderColor: Colors.error,
  },
});
