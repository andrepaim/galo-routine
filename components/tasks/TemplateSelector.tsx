import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Chip, Button, Icon, Checkbox } from 'react-native-paper';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Layout, TASK_TEMPLATES, getCategoryById } from '../../constants';
import { ChildColors, ChildSizes } from '../../constants/childTheme';
import { StarDisplay } from '../stars/StarDisplay';
import { formatTimeRange } from '../../lib/utils/time';
import type { TaskTemplate } from '../../lib/types';

interface TemplateSelectorProps {
  onSelect: (templates: TaskTemplate[]) => void;
  onCancel: () => void;
}

export function TemplateSelector({ onSelect, onCancel }: TemplateSelectorProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const getTemplateKey = (catId: string, idx: number) => `${catId}_${idx}`;

  const toggleTemplate = (catId: string, idx: number) => {
    const key = getTemplateKey(catId, idx);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleCategory = (catId: string, templates: TaskTemplate[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const allSelected = templates.every((_, i) => next.has(getTemplateKey(catId, i)));
      templates.forEach((_, i) => {
        const key = getTemplateKey(catId, i);
        if (allSelected) next.delete(key);
        else next.add(key);
      });
      return next;
    });
  };

  const handleConfirm = () => {
    const templates: TaskTemplate[] = [];
    for (const cat of TASK_TEMPLATES) {
      cat.templates.forEach((tmpl, i) => {
        if (selected.has(getTemplateKey(cat.id, i))) {
          templates.push(tmpl);
        }
      });
    }
    onSelect(templates);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineSmall" style={styles.heading}>
        Add from Templates
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Select tasks to add to your routine
      </Text>

      {TASK_TEMPLATES.map((cat, catIdx) => (
        <Animated.View key={cat.id} entering={FadeInDown.delay(catIdx * 100).duration(400)}>
          <Card style={styles.categoryCard}>
            <Card.Content>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryTitleRow}>
                  <Icon source={cat.icon} size={24} color={ChildColors.starGold} />
                  <Text variant="titleMedium" style={styles.categoryTitle}>
                    {cat.name}
                  </Text>
                </View>
                <Button
                  mode="text"
                  compact
                  onPress={() => toggleCategory(cat.id, cat.templates)}
                >
                  {cat.templates.every((_, i) => selected.has(getTemplateKey(cat.id, i)))
                    ? 'Deselect All'
                    : 'Select All'}
                </Button>
              </View>

              {cat.templates.map((tmpl, i) => {
                const key = getTemplateKey(cat.id, i);
                const isSelected = selected.has(key);
                const category = getCategoryById(tmpl.category);
                const timeRange = formatTimeRange(tmpl.startTime, tmpl.endTime);

                return (
                  <View key={i} style={styles.templateRow}>
                    <Checkbox
                      status={isSelected ? 'checked' : 'unchecked'}
                      onPress={() => toggleTemplate(cat.id, i)}
                    />
                    <View style={styles.templateInfo}>
                      <Text variant="bodyMedium" style={styles.templateName}>
                        {tmpl.name}
                      </Text>
                      <View style={styles.templateMeta}>
                        {timeRange && (
                          <Text variant="bodySmall" style={styles.templateTime}>
                            {timeRange}
                          </Text>
                        )}
                        {category && (
                          <Chip
                            compact
                            style={[styles.miniCategoryChip, { backgroundColor: category.color + '20' }]}
                            textStyle={{ color: category.color, fontSize: 10 }}
                          >
                            {category.name}
                          </Chip>
                        )}
                      </View>
                    </View>
                    <StarDisplay count={tmpl.starValue} maxStars={tmpl.starValue} size={16} showEmpty={false} />
                  </View>
                );
              })}
            </Card.Content>
          </Card>
        </Animated.View>
      ))}

      <View style={styles.actions}>
        <Button mode="outlined" onPress={onCancel} style={styles.actionBtn}>
          Cancel
        </Button>
        <Button
          mode="contained"
          onPress={handleConfirm}
          disabled={selected.size === 0}
          style={styles.actionBtn}
        >
          Add {selected.size} {selected.size === 1 ? 'Task' : 'Tasks'}
        </Button>
      </View>
    </ScrollView>
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
  heading: {
    fontWeight: 'bold',
    color: ChildColors.textPrimary,
  },
  subtitle: {
    color: ChildColors.textPrimarySecondary,
    marginBottom: Layout.padding.lg,
  },
  categoryCard: {
    backgroundColor: ChildColors.cardBackground,
    marginBottom: Layout.padding.md,
    elevation: Layout.elevation.low,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.padding.sm,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.sm,
  },
  categoryTitle: {
    fontWeight: 'bold',
    color: ChildColors.textPrimary,
  },
  templateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Layout.padding.xs,
  },
  templateInfo: {
    flex: 1,
    marginLeft: Layout.padding.xs,
  },
  templateName: {
    color: ChildColors.textPrimary,
  },
  templateMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.sm,
    marginTop: 2,
  },
  templateTime: {
    color: ChildColors.textPrimarySecondary,
  },
  miniCategoryChip: {
    height: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: Layout.padding.md,
    marginTop: Layout.padding.lg,
  },
  actionBtn: {
    flex: 1,
  },
});
