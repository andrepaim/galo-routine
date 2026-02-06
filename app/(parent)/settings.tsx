import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, SegmentedButtons, Card, Switch } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Layout, DAY_NAMES } from '../../constants';
import { ChildColors, ChildSizes } from '../../constants/childTheme';
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

  // Existing settings
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

  // Bonus star settings
  const [onTimeBonusEnabled, setOnTimeBonusEnabled] = useState(true);
  const [onTimeBonusStars, setOnTimeBonusStars] = useState(1);
  const [perfectDayBonusEnabled, setPerfectDayBonusEnabled] = useState(true);
  const [perfectDayBonusStars, setPerfectDayBonusStars] = useState(3);
  const [earlyFinishBonusEnabled, setEarlyFinishBonusEnabled] = useState(false);
  const [earlyFinishBonusStars, setEarlyFinishBonusStars] = useState(2);
  const [earlyFinishCutoff, setEarlyFinishCutoff] = useState('20:00');

  // Streak settings
  const [streakFreezeCost, setStreakFreezeCost] = useState(10);
  const [maxFreezes, setMaxFreezes] = useState(2);

  const initializedRef = useRef(false);
  useEffect(() => {
    if (family?.settings && !initializedRef.current) {
      initializedRef.current = true;
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
      // Bonus settings
      if (family.settings.onTimeBonusEnabled !== undefined) setOnTimeBonusEnabled(family.settings.onTimeBonusEnabled);
      if (family.settings.onTimeBonusStars !== undefined) setOnTimeBonusStars(family.settings.onTimeBonusStars);
      if (family.settings.perfectDayBonusEnabled !== undefined) setPerfectDayBonusEnabled(family.settings.perfectDayBonusEnabled);
      if (family.settings.perfectDayBonusStars !== undefined) setPerfectDayBonusStars(family.settings.perfectDayBonusStars);
      if (family.settings.earlyFinishBonusEnabled !== undefined) setEarlyFinishBonusEnabled(family.settings.earlyFinishBonusEnabled);
      if (family.settings.earlyFinishBonusStars !== undefined) setEarlyFinishBonusStars(family.settings.earlyFinishBonusStars);
      if (family.settings.earlyFinishCutoff) setEarlyFinishCutoff(family.settings.earlyFinishCutoff);
      // Streak settings
      if (family.settings.streakFreezeCost !== undefined) setStreakFreezeCost(family.settings.streakFreezeCost);
      if (family.settings.maxStreakFreezesPerPeriod !== undefined) setMaxFreezes(family.settings.maxStreakFreezesPerPeriod);
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
        // Bonus settings
        onTimeBonusEnabled,
        onTimeBonusStars,
        perfectDayBonusEnabled,
        perfectDayBonusStars,
        earlyFinishBonusEnabled,
        earlyFinishBonusStars,
        earlyFinishCutoff,
        // Streak settings
        streakFreezeCost,
        maxStreakFreezesPerPeriod: maxFreezes,
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
                minimumTrackTintColor={ChildColors.accentGreen}
                maximumTrackTintColor={ChildColors.cardBackgroundVariant}
                thumbTintColor={ChildColors.accentGreen}
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
                minimumTrackTintColor={ChildColors.accentRed}
                maximumTrackTintColor={ChildColors.cardBackgroundVariant}
                thumbTintColor={ChildColors.accentRed}
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

        {/* Bonus Star Settings */}
        <Animated.View entering={FadeInUp.delay(300).duration(400)}>
          <Card style={styles.sectionCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Bonus Stars
              </Text>

              <View style={styles.switchRow}>
                <View style={styles.switchLabel}>
                  <Text variant="bodyMedium">On-Time Bonus</Text>
                  <Text variant="bodySmall" style={styles.switchDescription}>
                    +{onTimeBonusStars} star when task completed within scheduled time
                  </Text>
                </View>
                <Switch value={onTimeBonusEnabled} onValueChange={setOnTimeBonusEnabled} />
              </View>
              {onTimeBonusEnabled && (
                <View style={styles.bonusValueRow}>
                  <Text variant="bodySmall" style={styles.sliderLabel}>
                    Bonus: {onTimeBonusStars} {onTimeBonusStars === 1 ? 'star' : 'stars'}
                  </Text>
                  <Slider
                    value={onTimeBonusStars}
                    onValueChange={(v) => setOnTimeBonusStars(Math.round(v))}
                    minimumValue={1}
                    maximumValue={5}
                    step={1}
                    minimumTrackTintColor={Colors.starFilled}
                    maximumTrackTintColor={ChildColors.cardBackgroundVariant}
                    thumbTintColor={Colors.starFilled}
                    style={styles.bonusSlider}
                  />
                </View>
              )}

              <View style={styles.switchRow}>
                <View style={styles.switchLabel}>
                  <Text variant="bodyMedium">Perfect Day Bonus</Text>
                  <Text variant="bodySmall" style={styles.switchDescription}>
                    +{perfectDayBonusStars} stars when all daily tasks approved
                  </Text>
                </View>
                <Switch value={perfectDayBonusEnabled} onValueChange={setPerfectDayBonusEnabled} />
              </View>
              {perfectDayBonusEnabled && (
                <View style={styles.bonusValueRow}>
                  <Text variant="bodySmall" style={styles.sliderLabel}>
                    Bonus: {perfectDayBonusStars} stars
                  </Text>
                  <Slider
                    value={perfectDayBonusStars}
                    onValueChange={(v) => setPerfectDayBonusStars(Math.round(v))}
                    minimumValue={1}
                    maximumValue={10}
                    step={1}
                    minimumTrackTintColor={Colors.starFilled}
                    maximumTrackTintColor={ChildColors.cardBackgroundVariant}
                    thumbTintColor={Colors.starFilled}
                    style={styles.bonusSlider}
                  />
                </View>
              )}

              <View style={styles.switchRow}>
                <View style={styles.switchLabel}>
                  <Text variant="bodyMedium">Early Finish Bonus</Text>
                  <Text variant="bodySmall" style={styles.switchDescription}>
                    +{earlyFinishBonusStars} stars when all tasks done before {earlyFinishCutoff}
                  </Text>
                </View>
                <Switch value={earlyFinishBonusEnabled} onValueChange={setEarlyFinishBonusEnabled} />
              </View>
              {earlyFinishBonusEnabled && (
                <View style={styles.bonusValueRow}>
                  <Text variant="bodySmall" style={styles.sliderLabel}>
                    Bonus: {earlyFinishBonusStars} stars
                  </Text>
                  <Slider
                    value={earlyFinishBonusStars}
                    onValueChange={(v) => setEarlyFinishBonusStars(Math.round(v))}
                    minimumValue={1}
                    maximumValue={10}
                    step={1}
                    minimumTrackTintColor={Colors.starFilled}
                    maximumTrackTintColor={ChildColors.cardBackgroundVariant}
                    thumbTintColor={Colors.starFilled}
                    style={styles.bonusSlider}
                  />
                  <TextInput
                    label="Cutoff Time (HH:mm)"
                    value={earlyFinishCutoff}
                    onChangeText={setEarlyFinishCutoff}
                    mode="outlined"
                    style={styles.input}
                  />
                </View>
              )}
            </Card.Content>
          </Card>
        </Animated.View>

        {/* Streak Settings */}
        <Animated.View entering={FadeInUp.delay(350).duration(400)}>
          <Card style={styles.sectionCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Streak Settings
              </Text>
              <Text variant="bodySmall" style={styles.sliderLabel}>
                Streak Freeze Cost: {streakFreezeCost} stars
              </Text>
              <Slider
                value={streakFreezeCost}
                onValueChange={(v) => setStreakFreezeCost(Math.round(v))}
                minimumValue={5}
                maximumValue={50}
                step={5}
                minimumTrackTintColor={Colors.streak}
                maximumTrackTintColor={ChildColors.cardBackgroundVariant}
                thumbTintColor={Colors.streak}
                style={styles.slider}
              />
              <Text variant="bodySmall" style={styles.sliderLabel}>
                Max Freezes Per Period: {maxFreezes}
              </Text>
              <Slider
                value={maxFreezes}
                onValueChange={(v) => setMaxFreezes(Math.round(v))}
                minimumValue={0}
                maximumValue={5}
                step={1}
                minimumTrackTintColor={Colors.streak}
                maximumTrackTintColor={ChildColors.cardBackgroundVariant}
                thumbTintColor={Colors.streak}
                style={styles.slider}
              />
            </Card.Content>
          </Card>
        </Animated.View>

        {/* Child PIN Section */}
        <Animated.View entering={FadeInUp.delay(400).duration(400)}>
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
        <Animated.View entering={FadeInUp.delay(500).duration(400)}>
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
    backgroundColor: ChildColors.galoBlack,
  },
  content: {
    padding: Layout.padding.md,
    paddingBottom: Layout.padding.xl * 2,
  },
  sectionCard: {
    backgroundColor: ChildColors.cardBackground,
    elevation: Layout.elevation.low,
    marginBottom: Layout.padding.md,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: ChildColors.textPrimary,
    marginBottom: Layout.padding.sm,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: Layout.padding.md,
  },
  sliderLabel: {
    color: ChildColors.textPrimarySecondary,
    marginBottom: Layout.padding.xs,
  },
  slider: {
    marginBottom: Layout.padding.md,
    height: 40,
  },
  input: {
    marginBottom: Layout.padding.sm,
    backgroundColor: ChildColors.cardBackground,
  },
  segment: {
    marginBottom: Layout.padding.md,
  },
  label: {
    color: ChildColors.textPrimarySecondary,
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
  switchLabel: {
    flex: 1,
    marginRight: Layout.padding.md,
  },
  switchDescription: {
    color: ChildColors.textPrimarySecondary,
    marginTop: 2,
  },
  bonusValueRow: {
    paddingLeft: Layout.padding.md,
    marginBottom: Layout.padding.sm,
  },
  bonusSlider: {
    height: 32,
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
    backgroundColor: ChildColors.accentRedContainer,
  },
});
