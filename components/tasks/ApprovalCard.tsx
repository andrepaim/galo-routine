import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button, Icon, TextInput } from 'react-native-paper';
import { format } from 'date-fns';
import { Colors, Layout } from '../../constants';
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

  const handleReject = () => {
    onReject(reason.trim() || 'Not completed properly');
    setShowReject(false);
    setReason('');
  };

  return (
    <Card style={styles.card}>
      <Card.Title
        title={completion.taskName}
        titleVariant="titleMedium"
        subtitle={`Completed ${format(completion.completedAt.toDate(), 'MMM d, h:mm a')}`}
        left={(props) => (
          <Icon {...props} source="clock-outline" color={Colors.neutral} />
        )}
        right={() => (
          <StarDisplay count={completion.taskStarValue} maxStars={completion.taskStarValue} size={18} showEmpty={false} />
        )}
      />
      {showReject ? (
        <Card.Content style={styles.rejectContent}>
          <TextInput
            label="Reason for rejection (optional)"
            value={reason}
            onChangeText={setReason}
            mode="outlined"
            dense
            style={styles.reasonInput}
          />
          <View style={styles.rejectActions}>
            <Button mode="text" onPress={() => setShowReject(false)}>
              Cancel
            </Button>
            <Button
              mode="contained"
              buttonColor={Colors.penalty}
              onPress={handleReject}
              loading={isLoading}
            >
              Reject
            </Button>
          </View>
        </Card.Content>
      ) : (
        <Card.Actions style={styles.actions}>
          <Button
            mode="outlined"
            textColor={Colors.penalty}
            onPress={() => setShowReject(true)}
            disabled={isLoading}
          >
            Reject
          </Button>
          <Button
            mode="contained"
            buttonColor={Colors.reward}
            onPress={onApprove}
            loading={isLoading}
            icon="check"
          >
            Approve
          </Button>
        </Card.Actions>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: Layout.padding.xs,
    backgroundColor: Colors.surface,
  },
  actions: {
    justifyContent: 'flex-end',
    gap: Layout.padding.sm,
  },
  rejectContent: {
    gap: Layout.padding.sm,
  },
  reasonInput: {
    marginBottom: Layout.padding.sm,
  },
  rejectActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Layout.padding.sm,
    paddingBottom: Layout.padding.sm,
  },
});
