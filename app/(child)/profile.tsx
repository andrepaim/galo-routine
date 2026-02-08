import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { Text, Icon, IconButton, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { AVATAR_OPTIONS, ACCENT_COLOR_OPTIONS, ALL_BADGES } from '../../constants';
import { ChildColors, ChildSizes, GALO_EMOJI, STAR_EMOJI, TROPHY_EMOJI } from '../../constants/childTheme';

// Galo Volpi mascot image (white version for dark background)
const GaloVolpiImage = require('../../assets/images/mascot/galo-volpi-white.png');
import { useAuthStore, useBadgeStore } from '../../lib/stores';
import { updateFamily } from '../../lib/firebase/firestore';

export default function ChildProfileScreen() {
  const { familyId, childName, family } = useAuthStore();
  const { earnedBadges } = useBadgeStore();
  const [selectedAvatar, setSelectedAvatar] = useState(family?.childAvatar ?? 'account-circle');
  const [selectedColor, setSelectedColor] = useState(family?.childAccentColor ?? ChildColors.starGold);
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
      Alert.alert('Salvo!', 'Seu perfil foi atualizado.');
    } catch (e) {
      console.error('Failed to save profile:', e);
      Alert.alert('Erro', 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar Section */}
        <Animated.View entering={FadeInUp.duration(400)} style={styles.avatarSection}>
          <View style={[styles.avatarRing, { borderColor: selectedColor }]}>
            <View style={styles.avatarInner}>
              <Icon source={selectedAvatar} size={64} color={selectedColor} />
            </View>
          </View>
          <Text style={styles.name}>{childName || 'Campeão'}</Text>
          <View style={styles.subtitleRow}>
            <Text style={styles.subtitle}>Jogador do Galo</Text>
            <Image source={GaloVolpiImage} style={styles.miniMascot} resizeMode="contain" />
          </View>
        </Animated.View>

        {/* Stats Row */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>{STAR_EMOJI}</Text>
            <Text style={styles.statNumber}>{family?.goalBalance ?? 0}</Text>
            <Text style={styles.statLabel}>Gols</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🌟</Text>
            <Text style={styles.statNumber}>{family?.lifetimeGoalsEarned ?? 0}</Text>
            <Text style={styles.statLabel}>Total Ganhas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>{TROPHY_EMOJI}</Text>
            <Text style={styles.statNumber}>{earnedBadges.length}</Text>
            <Text style={styles.statLabel}>Troféus</Text>
          </View>
        </Animated.View>

        {/* Streak Card */}
        <Animated.View entering={FadeInUp.delay(150).duration(400)} style={styles.streakCard}>
          <View style={styles.streakHeader}>
            <Icon source="fire" size={28} color={ChildColors.accentRed} />
            <Text style={styles.streakTitle}>Sequência</Text>
          </View>
          <View style={styles.streakStats}>
            <View style={styles.streakItem}>
              <Text style={styles.streakNumber}>{family?.currentStreak ?? 0}</Text>
              <Text style={styles.streakLabel}>Dias seguidos</Text>
            </View>
            <View style={styles.streakDivider} />
            <View style={styles.streakItem}>
              <Text style={styles.streakNumber}>{family?.bestStreak ?? 0}</Text>
              <Text style={styles.streakLabel}>Recorde</Text>
            </View>
          </View>
        </Animated.View>

        {/* Avatar Picker */}
        <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Escolha seu Avatar</Text>
          <View style={styles.avatarGrid}>
            {AVATAR_OPTIONS.map((av) => (
              <IconButton
                key={av}
                icon={av}
                size={32}
                mode={selectedAvatar === av ? 'contained' : 'outlined'}
                onPress={() => setSelectedAvatar(av)}
                iconColor={selectedAvatar === av ? ChildColors.galoBlack : ChildColors.textSecondary}
                containerColor={selectedAvatar === av ? ChildColors.starGold : ChildColors.cardBackgroundLight}
                style={styles.avatarOption}
              />
            ))}
          </View>
        </Animated.View>

        {/* Color Picker */}
        <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Cor Favorita</Text>
          <View style={styles.colorRow}>
            {ACCENT_COLOR_OPTIONS.map((color) => (
              <IconButton
                key={color}
                icon={selectedColor === color ? 'check-circle' : 'circle'}
                size={36}
                iconColor={color}
                onPress={() => setSelectedColor(color)}
                style={[
                  styles.colorOption,
                  selectedColor === color && styles.colorSelected,
                ]}
              />
            ))}
          </View>
        </Animated.View>

        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          style={styles.saveBtn}
          buttonColor={ChildColors.starGold}
          textColor={ChildColors.galoBlack}
          labelStyle={styles.saveBtnLabel}
        >
          Salvar Perfil
        </Button>
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
    padding: 16,
    paddingBottom: 100,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ChildColors.cardBackground,
  },
  avatarInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: ChildColors.galoDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: ChildColors.textPrimary,
    marginTop: 16,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 16,
    color: ChildColors.textSecondary,
  },
  miniMascot: {
    width: 24,
    height: 40,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: ChildColors.cardBackground,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  statEmoji: {
    fontSize: 24,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: ChildColors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: ChildColors.textSecondary,
    textAlign: 'center',
  },
  streakCard: {
    backgroundColor: ChildColors.cardBackground,
    borderRadius: ChildSizes.cardRadius,
    padding: 20,
    marginBottom: 16,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  streakTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: ChildColors.textPrimary,
  },
  streakStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakItem: {
    flex: 1,
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: ChildColors.starGold,
  },
  streakLabel: {
    fontSize: 13,
    color: ChildColors.textSecondary,
    marginTop: 4,
  },
  streakDivider: {
    width: 1,
    height: 40,
    backgroundColor: ChildColors.cardBorder,
  },
  sectionCard: {
    backgroundColor: ChildColors.cardBackground,
    borderRadius: ChildSizes.cardRadius,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: ChildColors.textPrimary,
    marginBottom: 16,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  avatarOption: {
    margin: 0,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  colorOption: {
    margin: 0,
  },
  colorSelected: {
    backgroundColor: ChildColors.cardBackgroundLight,
    borderRadius: 20,
  },
  saveBtn: {
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 4,
  },
  saveBtnLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
