import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Text, Switch, IconButton, SegmentedButtons } from 'react-native-paper';
import { Colors, Layout, REWARD_ICONS } from '../../constants';
import { ChildColors, ChildSizes } from '../../constants/childTheme';
import type { RewardFormData } from '../../lib/types';

interface RewardFormProps {
  initialData?: Partial<RewardFormData>;
  onSubmit: (data: RewardFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function RewardForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = 'Create Reward',
}: RewardFormProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [starCost, setStarCost] = useState(String(initialData?.starCost ?? 10));
  const [icon, setIcon] = useState(initialData?.icon ?? 'gift');
  const [availability, setAvailability] = useState<'unlimited' | 'limited'>(initialData?.availability ?? 'unlimited');
  const [quantity, setQuantity] = useState(String(initialData?.quantity ?? 1));
  const [requiresApproval, setRequiresApproval] = useState(initialData?.requiresApproval ?? true);

  const handleSubmit = () => {
    if (!name.trim()) return;
    const cost = parseInt(starCost, 10);
    if (isNaN(cost) || cost < 1) return;
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      starCost: cost,
      icon,
      availability,
      quantity: availability === 'limited' ? parseInt(quantity, 10) || 1 : undefined,
      requiresApproval,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TextInput
        label="Reward Name"
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

      <TextInput
        label="Star Cost"
        value={starCost}
        onChangeText={(t) => setStarCost(t.replace(/[^0-9]/g, ''))}
        mode="outlined"
        keyboardType="number-pad"
        style={styles.input}
      />

      <Text variant="titleSmall" style={styles.label}>
        Icon
      </Text>
      <View style={styles.iconGrid}>
        {REWARD_ICONS.map((ic) => (
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
        Availability
      </Text>
      <SegmentedButtons
        value={availability}
        onValueChange={(v) => setAvailability(v as typeof availability)}
        buttons={[
          { value: 'unlimited', label: 'Unlimited' },
          { value: 'limited', label: 'Limited' },
        ]}
        style={styles.segment}
      />

      {availability === 'limited' && (
        <TextInput
          label="Quantity"
          value={quantity}
          onChangeText={(t) => setQuantity(t.replace(/[^0-9]/g, ''))}
          mode="outlined"
          keyboardType="number-pad"
          style={styles.input}
        />
      )}

      <View style={styles.switchRow}>
        <Text variant="bodyMedium">Requires parent approval</Text>
        <Switch value={requiresApproval} onValueChange={setRequiresApproval} />
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
    backgroundColor: ChildColors.cardBackground,
  },
  label: {
    marginTop: Layout.padding.sm,
    marginBottom: Layout.padding.sm,
    color: ChildColors.textPrimarySecondary,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: Layout.padding.md,
  },
  segment: {
    marginBottom: Layout.padding.md,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Layout.padding.sm,
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
