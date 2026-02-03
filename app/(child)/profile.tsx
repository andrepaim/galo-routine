import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Icon, IconButton, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Colors, Layout, AVATAR_OPTIONS, ACCENT_COLOR_OPTIONS, ALL_BADGES } from '../../constants';
import { useAuthStore, useBadgeStore } from '../../lib/stores';
import { updateFamily } from '../../lib/firebase/firestore';
import { StreakDisplay } from '../../components/streaks/StreakDisplay';

export default function ChildProfileScreen() {
  const { familyId, childName, family } = useAuthStore();
  const { earnedBadges } = useBadgeStore();
  const [selectedAvatar, setSelectedAvatar] = useState(family?.childAvatar ?? 'account-circle');
  const [selectedColor, setSelectedColor] = useState(family?.childAccentColor ?? Colors.secondary);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!familyId) return;
    setSaving(true);
    try {
      await updateFamily(familyId, {
        childAvatar: selectedAvatar,
        childAccentColor: selectedColor,
      } as any);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved!', 'Your profile has been updated.');
    } catch (e) {
      console.error('Failed to save profile:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar section */}
        <Animated.View entering={FadeInUp.duration(400)} style={styles.avatarSection}>
          <View style={[styles.currentAvatar, { borderColor: selectedColor }]}>
            <Icon source={selectedAvatar} size={64} color={selectedColor} />
          </View>
          <Text variant="headlineSmall" style={styles.name}>
            {childName || 'Star'}
          </Text>
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon source="star" size={24} color={Colors.starFilled} />
              <Text variant="headlineSmall" style={styles.statNumber}>
                {family?.starBalance ?? 0}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>Stars</Text>
            </Card.Content>
          </Card>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon source="star-shooting" size={24} color={Colors.primary} />
              <Text variant="headlineSmall" style={styles.statNumber}>
                {family?.lifetimeStarsEarned ?? 0}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>Lifetime</Text>
            </Card.Content>
          </Card>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon source="shield-star" size={24} color={Colors.badgeGold} />
              <Text variant="headlineSmall" style={styles.statNumber}>
                {earnedBadges.length}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>Badges</Text>
            </Card.Content>
          </Card>
        </Animated.View>

        {/* Streak */}
        <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.section}>
          <StreakDisplay
            currentStreak={family?.currentStreak ?? 0}
            bestStreak={family?.bestStreak ?? 0}
          />
        </Animated.View>

        {/* Avatar picker */}
        <Animated.View entering={FadeInUp.delay(300).duration(400)}>
          <Card style={styles.sectionCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Choose Avatar
              </Text>
              <View style={styles.avatarGrid}>
                {AVATAR_OPTIONS.map((av) => (
                  <IconButton
                    key={av}
                    icon={av}
                    size={32}
                    mode={selectedAvatar === av ? 'contained' : 'outlined'}
                    onPress={() => setSelectedAvatar(av)}
                    iconColor={selectedAvatar === av ? Colors.white : Colors.text}
                    containerColor={selectedAvatar === av ? selectedColor : undefined}
                  />
                ))}
              </View>
            </Card.Content>
          </Card>
        </Animated.View>

        {/* Color picker */}
        <Animated.View entering={FadeInUp.delay(400).duration(400)}>
          <Card style={styles.sectionCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Accent Color
              </Text>
              <View style={styles.colorRow}>
                {ACCENT_COLOR_OPTIONS.map((color) => (
                  <IconButton
                    key={color}
                    icon={selectedColor === color ? 'check-circle' : 'circle'}
                    size={32}
                    iconColor={color}
                    onPress={() => setSelectedColor(color)}
                  />
                ))}
              </View>
            </Card.Content>
          </Card>
        </Animated.View>

        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          style={styles.saveBtn}
        >
          Save Profile
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondaryContainer,
  },
  content: {
    padding: Layout.padding.md,
    paddingBottom: Layout.padding.xl * 2,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Layout.padding.lg,
  },
  currentAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  name: {
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Layout.padding.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Layout.padding.sm,
    marginBottom: Layout.padding.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  statContent: {
    alignItems: 'center',
    gap: 2,
  },
  statNumber: {
    fontWeight: 'bold',
    color: Colors.text,
  },
  statLabel: {
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: Layout.padding.lg,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    marginBottom: Layout.padding.md,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Layout.padding.sm,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  saveBtn: {
    marginTop: Layout.padding.sm,
  },
});
