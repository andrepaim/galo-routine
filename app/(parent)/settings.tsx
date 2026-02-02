import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, SegmentedButtons, Card, Switch } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, Layout, DAY_NAMES } from '../../constants';
import { useAuthStore } from '../../lib/stores';
import { updateFamilySettings, updateFamily } from '../../lib/firebase/firestore';
import { hashPin } from '../../lib/utils/pin';
import { StarBudgetRing } from '../../components/stars/StarBudgetRing';
import type { PeriodType, StarProgress } from '../../lib/types';

const MOCK_PROGRESS: StarProgress = {
  earned: 65,
  pending: 5,
  budget: 100,
  earnedPercent: 65,
  pendingPercent: 5,
  isRewardZone: false,
  isPenaltyZone: false,
  isNeutralZone: true,
};

export default function SettingsScreen() {
  const router = useRouter();
  const { familyId, family, logout } = useAuthStore();

  const [rewardThreshold, setRewardThreshold] = useState(80);
  const [penaltyThreshold, setPenaltyThreshold] = useState(50);
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
      setRewardThreshold(family.settings.rewardThresholdPercent);
      setPenaltyThreshold(family.settings.penaltyThresholdPercent);
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
        rewardThresholdPercent: rewardThreshold,
        penaltyThresholdPercent: penaltyThreshold,
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

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
        {/* Thresholds Section */}
        <Animated.View entering={FadeInUp.delay(0).duration(400)}>
          <Card style={styles.sectionCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Thresholds
              </Text>

              <View style={styles.previewContainer}>
                <StarBudgetRing
                  progress={MOCK_PROGRESS}
                  size={120}
                  strokeWidth={10}
                  rewardPercent={rewardThreshold}
                  penaltyPercent={penaltyThreshold}
                />
              </View>

              <Text variant="bodyMedium" style={styles.sliderLabel}>
                Reward Threshold: {rewardThreshold}%
              </Text>
              <Slider
                value={rewardThreshold}
                onValueChange={(v) => {
                  const val = Math.round(v / 5) * 5;
                  setRewardThreshold(val);
                  if (penaltyThreshold >= val - 5) {
                    setPenaltyThreshold(Math.max(10, val - 10));
                  }
                }}
                minimumValue={50}
                maximumValue={100}
                step={5}
                minimumTrackTintColor={Colors.reward}
                maximumTrackTintColor={Colors.surfaceVariant}
                thumbTintColor={Colors.reward}
                style={styles.slider}
              />

              <Text variant="bodyMedium" style={styles.sliderLabel}>
                Penalty Threshold: {penaltyThreshold}%
              </Text>
              <Slider
                value={penaltyThreshold}
                onValueChange={(v) => setPenaltyThreshold(Math.round(v / 5) * 5)}
                minimumValue={10}
                maximumValue={rewardThreshold - 5}
                step={5}
                minimumTrackTintColor={Colors.penalty}
                maximumTrackTintColor={Colors.surfaceVariant}
                thumbTintColor={Colors.penalty}
                style={styles.slider}
              />
            </Card.Content>
          </Card>
        </Animated.View>

        {/* Messages Section */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)}>
          <Card style={styles.sectionCard}>
            <Card.Content>
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
            </Card.Content>
          </Card>
        </Animated.View>

        {/* Period Settings Section */}
        <Animated.View entering={FadeInUp.delay(200).duration(400)}>
          <Card style={styles.sectionCard}>
            <Card.Content>
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
            </Card.Content>
          </Card>
        </Animated.View>

        {/* Child PIN Section */}
        <Animated.View entering={FadeInUp.delay(300).duration(400)}>
          <Card style={styles.sectionCard}>
            <Card.Content>
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
            </Card.Content>
          </Card>
        </Animated.View>

        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          style={styles.saveButton}
        >
          Save Settings
        </Button>

        {/* Account Section */}
        <Animated.View entering={FadeInUp.delay(400).duration(400)}>
          <Card style={styles.sectionCard}>
            <Card.Content style={styles.accountContent}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Account
              </Text>
              <Button
                mode="outlined"
                icon="account-child"
                onPress={() => router.replace('/(auth)/child-pin')}
                style={styles.switchButton}
              >
                Switch to Child Mode
              </Button>

              <Button
                mode="outlined"
                icon="logout"
                textColor={Colors.error}
                onPress={handleLogout}
                style={styles.logoutButton}
              >
                Log Out
              </Button>
            </Card.Content>
          </Card>
        </Animated.View>
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
  sectionCard: {
    backgroundColor: Colors.surface,
    elevation: Layout.elevation.low,
    marginBottom: Layout.padding.md,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Layout.padding.sm,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: Layout.padding.md,
  },
  sliderLabel: {
    color: Colors.textSecondary,
    marginBottom: Layout.padding.xs,
  },
  slider: {
    marginBottom: Layout.padding.md,
    height: 40,
  },
  input: {
    marginBottom: Layout.padding.sm,
    backgroundColor: Colors.surface,
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
    marginBottom: Layout.padding.md,
  },
  accountContent: {
    gap: Layout.padding.sm,
  },
  switchButton: {
    borderColor: Colors.secondary,
  },
  logoutButton: {
    borderColor: Colors.error,
    backgroundColor: Colors.penaltyContainer,
  },
});
