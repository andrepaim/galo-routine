import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button, Icon, TextInput } from 'react-native-paper';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as Haptics from 'expo-haptics';
import { Layout } from '../../constants';
import { ChildColors, ChildSizes } from '../../constants/childTheme';
import { StarDisplay } from '../stars/StarDisplay';
import type { TaskCompletion } from '../../lib/types';

interface ApprovalCardProps {
  completion: TaskCompletion;
  onApprove: () => void;
  onReject: (reason: string) => void;
  isLoading?: boolean;
}

export function ApprovalCard({ completion, onApprove, onReject, isLoading }: ApprovalCardProps) {
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState('');

  const handleApprove = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onApprove();
  };

  const handleReject = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onReject(reason.trim() || 'Não completou corretamente');
    setShowReject(false);
    setReason('');
  };

  return (
    <Card style={styles.card}>
      <Card.Title
        title={completion.taskName}
        titleVariant="titleMedium"
        titleStyle={styles.title}
        subtitle={`Concluído ${format(completion.completedAt.toDate(), "d 'de' MMM, HH:mm", { locale: ptBR })}`}
        subtitleStyle={styles.subtitle}
        left={(props) => (
          <View style={styles.iconContainer}>
            <Icon {...props} source="check-circle-outline" color={ChildColors.pendingGold} />
          </View>
        )}
        right={() => (
          <StarDisplay count={completion.taskGoalValue} maxStars={completion.taskGoalValue} size={18} showEmpty={false} />
        )}
      />
      {showReject ? (
        <Card.Content style={styles.rejectContent}>
          <TextInput
            label="Motivo da rejeição (opcional)"
            value={reason}
            onChangeText={setReason}
            mode="outlined"
            dense
            style={styles.reasonInput}
            textColor={ChildColors.textPrimary}
            outlineColor={ChildColors.cardBorder}
            activeOutlineColor={ChildColors.starGold}
          />
          <View style={styles.rejectActions}>
            <Button 
              mode="text" 
              onPress={() => setShowReject(false)}
              textColor={ChildColors.textSecondary}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              buttonColor={ChildColors.accentRed}
              onPress={handleReject}
              loading={isLoading}
            >
              Rejeitar
            </Button>
          </View>
        </Card.Content>
      ) : (
        <Card.Actions style={styles.actions}>
          <Button
            mode="outlined"
            textColor={ChildColors.accentRed}
            style={styles.rejectBtn}
            onPress={() => setShowReject(true)}
            disabled={isLoading}
          >
            Rejeitar
          </Button>
          <Button
            mode="contained"
            buttonColor={ChildColors.accentGreen}
            onPress={handleApprove}
            loading={isLoading}
            icon="check"
          >
            Aprovar
          </Button>
        </Card.Actions>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 4,
    backgroundColor: ChildColors.cardBackground,
    borderRadius: ChildSizes.cardRadius,
    borderWidth: 1,
    borderColor: ChildColors.cardBorder,
  },
  title: {
    color: ChildColors.textPrimary,
  },
  subtitle: {
    color: ChildColors.textSecondary,
  },
  iconContainer: {
    backgroundColor: ChildColors.galoDark,
    borderRadius: 20,
    padding: 8,
  },
  actions: {
    justifyContent: 'flex-end',
    gap: 8,
  },
  rejectBtn: {
    borderColor: ChildColors.accentRed,
  },
  rejectContent: {
    gap: 8,
  },
  reasonInput: {
    marginBottom: 8,
    backgroundColor: ChildColors.cardBackground,
  },
  rejectActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingBottom: 8,
  },
});
