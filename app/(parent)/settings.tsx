import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, SegmentedButtons, Card, Switch, Icon, List, ProgressBar } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Layout, DAY_NAMES, getCategoryById } from '../../constants';
import { ChildColors, ChildSizes } from '../../constants/childTheme';
import { useAuthStore, useTaskStore, useCompletionStore, usePeriodStore, useGoalStore } from '../../lib/stores';
import { updateFamilySettings, updateFamily } from '../../lib/firebase/firestore';
import { hashPin } from '../../lib/utils/pin';
import { StarBudgetRing } from '../../components/stars/StarBudgetRing';
import { StreakDisplay } from '../../components/streaks/StreakDisplay';
import { useStarBudget } from '../../lib/hooks/useStarBudget';
import { useCurrentPeriod } from '../../lib/hooks/useCurrentPeriod';
import { PeriodSummary } from '../../components/periods/PeriodSummary';
import { GoalCard } from '../../components/goals/GoalCard';
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

  // Section expansion states
  const [expandedSection, setExpandedSection] = useState<string | null>('system');

  // Analytics data
  const { tasks } = useTaskStore();
  const { completions } = useCompletionStore();
  const { periods } = usePeriodStore();
  const { goals, addGoal, removeGoal } = useGoalStore();
  const starProgress = useStarBudget();
  const { activePeriod } = useCurrentPeriod();

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

  // Goals form state
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [goalTargetStars, setGoalTargetStars] = useState('100');
  const [goalRewardDescription, setGoalRewardDescription] = useState('');
  const [goalSaving, setGoalSaving] = useState(false);

  const initializedRef = useRef(false);

  // Analytics calculations
  const taskStats = useMemo(() => {
    const stats: Record<string, { name: string; total: number; approved: number; category?: string }> = {};
    for (const c of completions) {
      if (!stats[c.taskId]) {
        const task = tasks.find((t) => t.id === c.taskId);
        stats[c.taskId] = { name: c.taskName, total: 0, approved: 0, category: task?.category };
      }
      stats[c.taskId].total++;
      if (c.status === 'approved') stats[c.taskId].approved++;
    }
    return Object.values(stats).sort((a, b) => {
      const rateA = a.total > 0 ? a.approved / a.total : 0;
      const rateB = b.total > 0 ? b.approved / b.total : 0;
      return rateA - rateB;
    });
  }, [completions, tasks]);

  const categoryStats = useMemo(() => {
    const stats: Record<string, { total: number; approved: number }> = {};
    for (const c of completions) {
      const task = tasks.find((t) => t.id === c.taskId);
      const cat = task?.category ?? 'other';
      if (!stats[cat]) stats[cat] = { total: 0, approved: 0 };
      stats[cat].total++;
      if (c.status === 'approved') stats[cat].approved++;
    }
    return Object.entries(stats)
      .map(([id, data]) => ({ id, ...data, rate: data.total > 0 ? data.approved / data.total : 0 }))
      .sort((a, b) => b.rate - a.rate);
  }, [completions, tasks]);

  const overallRate = completions.length > 0
    ? completions.filter((c) => c.status === 'approved').length / completions.length
    : 0;

  const lifetimeStars = family?.lifetimeStarsEarned ?? 0;
  const activeGoals = goals.filter((g) => !g.isCompleted);
  const completedGoals = goals.filter((g) => g.isCompleted);

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
      Alert.alert('Salvo', 'Configurações atualizadas com sucesso');
    } catch (e) {
      console.error('Failed to save settings:', e);
      Alert.alert('Erro', 'Falha ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sair', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', onPress: () => logout() },
    ]);
  };

  // Goal handlers
  const handleCreateGoal = async () => {
    if (!familyId || !goalName.trim()) return;
    setGoalSaving(true);
    try {
      await addGoal(familyId, {
        name: goalName.trim(),
        description: goalDescription.trim(),
        targetStars: parseInt(goalTargetStars, 10) || 100,
        rewardDescription: goalRewardDescription.trim(),
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowGoalForm(false);
      setGoalName('');
      setGoalDescription('');
      setGoalTargetStars('100');
      setGoalRewardDescription('');
    } catch (e) {
      console.error('Failed to create goal:', e);
      Alert.alert('Erro', 'Não foi possível criar a meta.');
    } finally {
      setGoalSaving(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!familyId) return;
    try {
      await removeGoal(familyId, goalId);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (e) {
      console.error('Failed to delete goal:', e);
      Alert.alert('Erro', 'Não foi possível excluir a meta.');
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Analytics Section */}
        <Animated.View entering={FadeInUp.delay(0).duration(400)}>
          <List.Accordion
            title="📊 Relatórios"
            titleStyle={styles.sectionTitle}
            style={styles.accordionHeader}
            expanded={expandedSection === 'analytics'}
            onPress={() => toggleSection('analytics')}
            left={(props) => <List.Icon {...props} icon="chart-line" color={ChildColors.starGold} />}
          >
            <Card style={styles.sectionCard}>
              <Card.Content>
                <View style={styles.overviewContent}>
                  <View style={styles.overviewStat}>
                    <Text variant="headlineMedium" style={styles.overviewNumber}>
                      {Math.round(overallRate * 100)}%
                    </Text>
                    <Text variant="bodySmall" style={styles.overviewLabel}>
                      Taxa de Conclusão
                    </Text>
                  </View>
                  <View style={styles.overviewStat}>
                    <StreakDisplay
                      currentStreak={family?.currentStreak ?? 0}
                      bestStreak={family?.bestStreak ?? 0}
                      compact
                    />
                  </View>
                  {starProgress && (
                    <View style={styles.overviewStat}>
                      <Text variant="headlineMedium" style={styles.overviewNumber}>
                        {Math.round(starProgress.earnedPercent)}%
                      </Text>
                      <Text variant="bodySmall" style={styles.overviewLabel}>
                        Estrelas Ganhas
                      </Text>
                    </View>
                  )}
                </View>

                {categoryStats.length > 0 && (
                  <View>
                    <Text variant="titleSmall" style={[styles.subSectionTitle, { marginTop: 16 }]}>
                      Por Categoria
                    </Text>
                    {categoryStats.slice(0, 3).map((stat) => {
                      const category = getCategoryById(stat.id);
                      return (
                        <View key={stat.id} style={styles.categoryItem}>
                          <View style={styles.categoryHeader}>
                            <Icon
                              source={category?.icon || 'help-circle'}
                              size={16}
                              color={category?.color || ChildColors.textSecondary}
                            />
                            <Text variant="bodyMedium" style={styles.categoryName}>
                              {category?.name || 'Outros'}
                            </Text>
                            <Text variant="bodySmall" style={styles.categoryRate}>
                              {Math.round(stat.rate * 100)}%
                            </Text>
                          </View>
                          <ProgressBar
                            progress={stat.rate}
                            style={styles.categoryProgress}
                            color={category?.color || ChildColors.starGold}
                          />
                        </View>
                      );
                    })}
                  </View>
                )}
              </Card.Content>
            </Card>
          </List.Accordion>
        </Animated.View>

        {/* Goals Section */}
        <Animated.View entering={FadeInUp.delay(50).duration(400)}>
          <List.Accordion
            title="🎯 Metas"
            titleStyle={styles.sectionTitle}
            style={styles.accordionHeader}
            expanded={expandedSection === 'goals'}
            onPress={() => toggleSection('goals')}
            left={(props) => <List.Icon {...props} icon="flag-checkered" color={ChildColors.starGold} />}
          >
            <Card style={styles.sectionCard}>
              <Card.Content>
                <View style={styles.goalsHeader}>
                  <Text variant="bodyMedium" style={styles.goalsLifetime}>
                    Estrelas vitalícias: {lifetimeStars} ⭐
                  </Text>
                  <Button
                    mode="outlined"
                    icon="plus"
                    onPress={() => setShowGoalForm(!showGoalForm)}
                    style={styles.addGoalButton}
                    textColor={ChildColors.starGold}
                    compact
                  >
                    Nova Meta
                  </Button>
                </View>

                {showGoalForm && (
                  <Card style={styles.goalForm}>
                    <Card.Content>
                      <TextInput
                        label="Nome da Meta"
                        value={goalName}
                        onChangeText={setGoalName}
                        style={styles.input}
                      />
                      <TextInput
                        label="Descrição (opcional)"
                        value={goalDescription}
                        onChangeText={setGoalDescription}
                        style={styles.input}
                      />
                      <TextInput
                        label="Estrelas necessárias"
                        value={goalTargetStars}
                        onChangeText={setGoalTargetStars}
                        keyboardType="numeric"
                        style={styles.input}
                      />
                      <TextInput
                        label="Prêmio da meta"
                        value={goalRewardDescription}
                        onChangeText={setGoalRewardDescription}
                        style={styles.input}
                      />
                      <View style={styles.goalFormActions}>
                        <Button
                          mode="outlined"
                          onPress={() => setShowGoalForm(false)}
                          style={styles.goalFormButton}
                        >
                          Cancelar
                        </Button>
                        <Button
                          mode="contained"
                          onPress={handleCreateGoal}
                          loading={goalSaving}
                          disabled={goalSaving}
                          style={styles.goalFormButton}
                          buttonColor={ChildColors.starGold}
                          textColor={ChildColors.galoBlack}
                        >
                          Criar
                        </Button>
                      </View>
                    </Card.Content>
                  </Card>
                )}

                {activeGoals.length > 0 && (
                  <View>
                    <Text variant="titleSmall" style={styles.subSectionTitle}>
                      Metas Ativas
                    </Text>
                    {activeGoals.map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        lifetimeStars={lifetimeStars}
                        onDelete={() => handleDeleteGoal(goal.id!)}
                      />
                    ))}
                  </View>
                )}

                {completedGoals.length > 0 && (
                  <View>
                    <Text variant="titleSmall" style={styles.subSectionTitle}>
                      Metas Concluídas
                    </Text>
                    {completedGoals.slice(0, 2).map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        lifetimeStars={lifetimeStars}
                        onDelete={() => handleDeleteGoal(goal.id!)}
                      />
                    ))}
                  </View>
                )}
              </Card.Content>
            </Card>
          </List.Accordion>
        </Animated.View>

        {/* Periods Section */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)}>
          <List.Accordion
            title="📅 Períodos"
            titleStyle={styles.sectionTitle}
            style={styles.accordionHeader}
            expanded={expandedSection === 'periods'}
            onPress={() => toggleSection('periods')}
            left={(props) => <List.Icon {...props} icon="calendar-range" color={ChildColors.starGold} />}
          >
            <Card style={styles.sectionCard}>
              <Card.Content>
                {activePeriod && (
                  <View>
                    <Text variant="titleSmall" style={styles.subSectionTitle}>
                      Período Atual
                    </Text>
                    <PeriodSummary period={activePeriod} />
                  </View>
                )}
                <View style={styles.periodActions}>
                  <Button
                    mode="outlined"
                    icon="history"
                    onPress={() => router.push('/(parent)/periods/history')}
                    style={styles.periodButton}
                    textColor={ChildColors.starGold}
                  >
                    Ver Histórico
                  </Button>
                  <Button
                    mode="outlined"
                    icon="cog"
                    onPress={() => router.push('/(parent)/periods')}
                    style={styles.periodButton}
                    textColor={ChildColors.starGold}
                  >
                    Gerenciar
                  </Button>
                </View>
              </Card.Content>
            </Card>
          </List.Accordion>
        </Animated.View>

        {/* System Settings Section */}
        <Animated.View entering={FadeInUp.delay(150).duration(400)}>
          <List.Accordion
            title="⚙️ Sistema"
            titleStyle={styles.sectionTitle}
            style={styles.accordionHeader}
            expanded={expandedSection === 'system'}
            onPress={() => toggleSection('system')}
            left={(props) => <List.Icon {...props} icon="cog" color={ChildColors.starGold} />}
          >
            <Card style={styles.sectionCard}>
              <Card.Content>
                <Text variant="titleSmall" style={styles.subSectionTitle}>
                  Limites de Recompensa
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
                  Limite de Recompensa: {rewardThreshold}%
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
                  Limite de Penalidade: {penaltyThreshold}%
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

                {/* Messages */}
                <Text variant="titleSmall" style={[styles.subSectionTitle, { marginTop: 16 }]}>
                  Mensagens de Recompensa e Penalidade
                </Text>
                <TextInput
                  label="Mensagem de Recompensa"
                  value={rewardDesc}
                  onChangeText={setRewardDesc}
                  placeholder="Parabéns! Você ganhou sua recompensa!"
                  style={styles.input}
                />
                <TextInput
                  label="Mensagem de Penalidade"
                  value={penaltyDesc}
                  onChangeText={setPenaltyDesc}
                  placeholder="Você perdeu suas estrelas desta vez..."
                  style={styles.input}
                />

                {/* Period Settings */}
                <Text variant="titleSmall" style={[styles.subSectionTitle, { marginTop: 16 }]}>
                  Configuração de Períodos
                </Text>
                <SegmentedButtons
                  value={periodType}
                  onValueChange={(value) => setPeriodType(value as PeriodType)}
                  buttons={[
                    { value: 'weekly', label: 'Semanal' },
                    { value: 'biweekly', label: '2 Semanas' },
                    { value: 'monthly', label: 'Mensal' },
                    { value: 'custom', label: 'Personalizado' },
                  ]}
                  style={styles.segment}
                />

                {periodType === 'custom' && (
                  <TextInput
                    label="Duração (dias)"
                    value={customDays}
                    onChangeText={setCustomDays}
                    keyboardType="number-pad"
                    style={styles.input}
                  />
                )}

                {(periodType === 'weekly' || periodType === 'biweekly') && (
                  <View>
                    <Text variant="bodyMedium" style={styles.label}>Dia de Início</Text>
                    <View style={styles.daysRow}>
                      {DAY_NAMES.map((name, i) => (
                        <Button
                          key={i}
                          mode={periodStartDay === i ? 'contained' : 'outlined'}
                          compact
                          onPress={() => setPeriodStartDay(i)}
                          style={styles.dayBtn}
                          labelStyle={styles.dayBtnLabel}
                          buttonColor={periodStartDay === i ? ChildColors.starGold : undefined}
                          textColor={periodStartDay === i ? ChildColors.galoBlack : ChildColors.starGold}
                        >
                          {name}
                        </Button>
                      ))}
                    </View>
                  </View>
                )}

                <View style={styles.switchRow}>
                  <Text variant="bodyMedium">Períodos automáticos</Text>
                  <Switch value={autoRoll} onValueChange={setAutoRoll} />
                </View>

                {/* Bonus Settings */}
                <Text variant="titleSmall" style={[styles.subSectionTitle, { marginTop: 16 }]}>
                  Estrelas Bônus
                </Text>
                
                <View style={styles.switchRow}>
                  <View style={styles.switchLabel}>
                    <Text variant="bodyMedium">Bônus Pontualidade</Text>
                    <Text variant="bodySmall" style={styles.switchDescription}>
                      +{onTimeBonusStars} estrela quando concluído no horário
                    </Text>
                  </View>
                  <Switch value={onTimeBonusEnabled} onValueChange={setOnTimeBonusEnabled} />
                </View>
                {onTimeBonusEnabled && (
                  <View style={styles.bonusValueRow}>
                    <Text variant="bodySmall" style={styles.sliderLabel}>
                      Bônus: {onTimeBonusStars} {onTimeBonusStars === 1 ? 'estrela' : 'estrelas'}
                    </Text>
                    <Slider
                      value={onTimeBonusStars}
                      onValueChange={(v) => setOnTimeBonusStars(Math.round(v))}
                      minimumValue={1}
                      maximumValue={5}
                      step={1}
                      minimumTrackTintColor={ChildColors.starGold}
                      maximumTrackTintColor={ChildColors.cardBackgroundVariant}
                      thumbTintColor={ChildColors.starGold}
                      style={styles.bonusSlider}
                    />
                  </View>
                )}

                <View style={styles.switchRow}>
                  <View style={styles.switchLabel}>
                    <Text variant="bodyMedium">Bônus Dia Perfeito</Text>
                    <Text variant="bodySmall" style={styles.switchDescription}>
                      +{perfectDayBonusStars} estrelas quando todas as tarefas diárias são aprovadas
                    </Text>
                  </View>
                  <Switch value={perfectDayBonusEnabled} onValueChange={setPerfectDayBonusEnabled} />
                </View>
                {perfectDayBonusEnabled && (
                  <View style={styles.bonusValueRow}>
                    <Text variant="bodySmall" style={styles.sliderLabel}>
                      Bônus: {perfectDayBonusStars} estrelas
                    </Text>
                    <Slider
                      value={perfectDayBonusStars}
                      onValueChange={(v) => setPerfectDayBonusStars(Math.round(v))}
                      minimumValue={1}
                      maximumValue={10}
                      step={1}
                      minimumTrackTintColor={ChildColors.starGold}
                      maximumTrackTintColor={ChildColors.cardBackgroundVariant}
                      thumbTintColor={ChildColors.starGold}
                      style={styles.bonusSlider}
                    />
                  </View>
                )}

                {/* Streak Settings */}
                <Text variant="titleSmall" style={[styles.subSectionTitle, { marginTop: 16 }]}>
                  Configurações de Sequência
                </Text>
                <View style={styles.bonusValueRow}>
                  <Text variant="bodySmall" style={styles.sliderLabel}>
                    Custo do congelamento: {streakFreezeCost} estrelas
                  </Text>
                  <Slider
                    value={streakFreezeCost}
                    onValueChange={(v) => setStreakFreezeCost(Math.round(v))}
                    minimumValue={5}
                    maximumValue={50}
                    step={5}
                    minimumTrackTintColor={ChildColors.accentBlue}
                    maximumTrackTintColor={ChildColors.cardBackgroundVariant}
                    thumbTintColor={ChildColors.accentBlue}
                    style={styles.bonusSlider}
                  />
                </View>
                <View style={styles.bonusValueRow}>
                  <Text variant="bodySmall" style={styles.sliderLabel}>
                    Max. congelamentos por período: {maxFreezes}
                  </Text>
                  <Slider
                    value={maxFreezes}
                    onValueChange={(v) => setMaxFreezes(Math.round(v))}
                    minimumValue={0}
                    maximumValue={10}
                    step={1}
                    minimumTrackTintColor={ChildColors.accentBlue}
                    maximumTrackTintColor={ChildColors.cardBackgroundVariant}
                    thumbTintColor={ChildColors.accentBlue}
                    style={styles.bonusSlider}
                  />
                </View>

                {/* PIN & Account */}
                <Text variant="titleSmall" style={[styles.subSectionTitle, { marginTop: 16 }]}>
                  Segurança e Conta
                </Text>
                <TextInput
                  label="Novo PIN da Criança (4+ dígitos)"
                  value={newPin}
                  onChangeText={setNewPin}
                  keyboardType="numeric"
                  secureTextEntry
                  placeholder="Deixe vazio para manter atual"
                  style={styles.input}
                />

                <View style={styles.systemActions}>
                  <Button
                    mode="contained"
                    onPress={handleSave}
                    loading={saving}
                    disabled={saving}
                    style={styles.saveButton}
                    buttonColor={ChildColors.starGold}
                    textColor={ChildColors.galoBlack}
                    icon="content-save"
                  >
                    Salvar Configurações
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={handleLogout}
                    style={styles.logoutButton}
                    textColor={ChildColors.accentRed}
                    icon="logout"
                  >
                    Sair
                  </Button>
                </View>
              </Card.Content>
            </Card>
          </List.Accordion>
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
    borderWidth: 1,
    borderColor: ChildColors.cardBorder,
    borderRadius: ChildSizes.cardRadius,
    marginBottom: Layout.padding.md,
    marginLeft: 16, // Indent content under accordion
    marginRight: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: ChildColors.textPrimary,
    fontSize: 16,
  },
  subSectionTitle: {
    fontWeight: '600',
    color: ChildColors.textPrimary,
    marginBottom: 8,
    marginTop: 8,
  },
  accordionHeader: {
    backgroundColor: ChildColors.cardBackgroundLight,
    borderRadius: ChildSizes.cardRadius,
    marginBottom: 8,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: Layout.padding.md,
  },
  sliderLabel: {
    color: ChildColors.textSecondary,
    marginBottom: Layout.padding.xs,
  },
  slider: {
    marginBottom: Layout.padding.md,
    height: 40,
  },
  input: {
    marginBottom: Layout.padding.sm,
    backgroundColor: ChildColors.cardBackgroundLight,
  },
  segment: {
    marginBottom: Layout.padding.md,
  },
  label: {
    color: ChildColors.textSecondary,
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
    borderColor: ChildColors.starGold,
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
    color: ChildColors.textSecondary,
    marginTop: 2,
  },
  bonusValueRow: {
    paddingLeft: Layout.padding.md,
    marginBottom: Layout.padding.sm,
  },
  bonusSlider: {
    height: 32,
  },
  systemActions: {
    gap: 12,
    marginTop: 16,
  },
  saveButton: {
    marginBottom: Layout.padding.sm,
  },
  accountContent: {
    gap: Layout.padding.sm,
  },
  switchButton: {
    borderColor: ChildColors.starGold,
  },
  logoutButton: {
    borderColor: ChildColors.accentRed,
    backgroundColor: ChildColors.accentRedContainer,
  },
  // Analytics styles
  overviewContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
  },
  overviewStat: {
    alignItems: 'center',
  },
  overviewNumber: {
    fontWeight: 'bold',
    color: ChildColors.textPrimary,
  },
  overviewLabel: {
    color: ChildColors.textSecondary,
    textAlign: 'center',
  },
  categoryItem: {
    marginBottom: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryName: {
    flex: 1,
    marginLeft: 8,
    color: ChildColors.textPrimary,
  },
  categoryRate: {
    color: ChildColors.textSecondary,
  },
  categoryProgress: {
    height: 4,
    borderRadius: 2,
    backgroundColor: ChildColors.cardBackgroundVariant,
  },
  // Goals styles
  goalsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalsLifetime: {
    color: ChildColors.textSecondary,
  },
  addGoalButton: {
    borderColor: ChildColors.starGold,
  },
  goalForm: {
    backgroundColor: ChildColors.cardBackgroundLight,
    borderRadius: 12,
    marginBottom: 16,
  },
  goalFormActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  goalFormButton: {
    minWidth: 80,
  },
  // Periods styles
  periodActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  periodButton: {
    flex: 1,
    borderColor: ChildColors.starGold,
  },
});