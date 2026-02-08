import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, SegmentedButtons, Text, Chip, IconButton, Switch, Icon } from 'react-native-paper';
import { Colors, Layout, DAY_NAMES, GOAL_VALUES, TASK_ICONS, TASK_CATEGORIES } from '../../constants';
import { ChildColors, ChildSizes } from '../../constants/childTheme';
import { TimePicker } from '../ui/TimePicker';
import type { TaskFormData, TaskCategoryId } from '../../lib/types';

interface TaskFormProps {
  initialData?: Partial<TaskFormData>;
  onSubmit: (data: TaskFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function TaskForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = 'Create Task',
}: TaskFormProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [goals, setGoals] = useState(initialData?.goals ?? 1);
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'specific_days' | 'once'>(
    initialData?.recurrenceType ?? 'daily',
  );
  const [days, setDays] = useState<number[]>(initialData?.days ?? []);
  const [icon, setIcon] = useState(initialData?.icon ?? 'star-circle');
  const [startTime, setStartTime] = useState<string | undefined>(initialData?.startTime);
  const [endTime, setEndTime] = useState<string | undefined>(initialData?.endTime);
  const [category, setCategory] = useState<string | undefined>(initialData?.category);
  const [requiresProof, setRequiresProof] = useState(initialData?.requiresProof ?? false);

  const toggleDay = (day: number) => {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      goals,
      icon,
      recurrenceType,
      days,
      startTime,
      endTime,
      category: category as TaskCategoryId,
      requiresProof,
      taskType: 'routine',
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TextInput
        label="Task Name"
        value={name}
        onChangeText={setName}
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Description (optional)"
        value={description}
        onChangeText={setDescription}
        mode="outlined"
        multiline
        style={styles.input}
      />

      <Text variant="titleSmall" style={styles.label}>
        Category
      </Text>
      <View style={styles.categoryGrid}>
        {TASK_CATEGORIES.map((cat) => (
          <Chip
            key={cat.id}
            selected={category === cat.id}
            onPress={() => setCategory(category === cat.id ? undefined : cat.id)}
            icon={() => <Icon source={cat.icon} size={16} color={category === cat.id ? ChildColors.galoWhite : cat.color} />}
            style={[
              styles.categoryChip,
              category === cat.id && { backgroundColor: cat.color },
            ]}
            textStyle={category === cat.id ? { color: ChildColors.galoWhite } : undefined}
          >
            {cat.name}
          </Chip>
        ))}
      </View>

      <Text variant="titleSmall" style={styles.label}>
        Gols
      </Text>
      <View style={styles.starRow}>
        {GOAL_VALUES.map((v) => (
          <Chip
            key={v}
            selected={goals === v}
            onPress={() => setGoals(v)}
            style={[styles.starChip, goals === v && styles.starChipSelected]}
            textStyle={goals === v ? styles.starChipTextSelected : undefined}
          >
            {'⚽'.repeat(v)}
          </Chip>
        ))}
      </View>

      <Text variant="titleSmall" style={styles.label}>
        Icon
      </Text>
      <View style={styles.iconGrid}>
        {TASK_ICONS.map((ic) => (
          <IconButton
            key={ic}
            icon={ic}
            mode={icon === ic ? 'contained' : 'outlined'}
            size={24}
            onPress={() => setIcon(ic)}
          />
        ))}
      </View>

      <Text variant="titleSmall" style={styles.label}>
        Recurrence
      </Text>
      <SegmentedButtons
        value={recurrenceType}
        onValueChange={(v) => setRecurrenceType(v as typeof recurrenceType)}
        buttons={[
          { value: 'daily', label: 'Daily' },
          { value: 'specific_days', label: 'Specific Days' },
          { value: 'once', label: 'One Time' },
        ]}
        style={styles.segment}
      />

      <Text variant="titleSmall" style={styles.label}>
        Schedule (optional)
      </Text>
      <TimePicker label="Start Time" value={startTime} onChange={setStartTime} />
      <TimePicker label="End Time" value={endTime} onChange={setEndTime} />

      {recurrenceType === 'specific_days' && (
        <View style={styles.daysRow}>
          {DAY_NAMES.map((dayName, index) => (
            <Chip
              key={index}
              selected={days.includes(index)}
              onPress={() => toggleDay(index)}
              style={styles.dayChip}
            >
              {dayName}
            </Chip>
          ))}
        </View>
      )}

      <View style={styles.switchRow}>
        <Text variant="bodyMedium">Requires proof (photo/note)</Text>
        <Switch value={requiresProof} onValueChange={setRequiresProof} />
      </View>

      <View style={styles.actions}>
        <Button mode="outlined" onPress={onCancel} style={styles.actionBtn}>
          Cancel
        </Button>
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={isLoading}
          disabled={!name.trim() || isLoading}
          style={styles.actionBtn}
        >
          {submitLabel}
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Layout.padding.md,
  },
  input: {
    marginBottom: Layout.padding.md,
  },
  label: {
    marginTop: Layout.padding.sm,
    marginBottom: Layout.padding.sm,
    color: ChildColors.textSecondary,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.padding.sm,
    marginBottom: Layout.padding.md,
  },
  categoryChip: {
    backgroundColor: ChildColors.galoDark,
  },
  starRow: {
    flexDirection: 'row',
    gap: Layout.padding.sm,
    flexWrap: 'wrap',
  },
  starChip: {
    backgroundColor: ChildColors.galoDark,
  },
  starChipSelected: {
    backgroundColor: ChildColors.galoDark,
  },
  starChipTextSelected: {
    color: ChildColors.starGoldDark,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  segment: {
    marginBottom: Layout.padding.md,
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.padding.sm,
    marginBottom: Layout.padding.md,
  },
  dayChip: {},
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Layout.padding.sm,
    marginBottom: Layout.padding.sm,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Layout.padding.md,
    marginTop: Layout.padding.xl,
    paddingBottom: Layout.padding.xl,
  },
  actionBtn: {
    flex: 1,
  },
});
