import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Button, IconButton } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, Layout } from '../../constants';
import { formatTimeDisplay } from '../../lib/utils/time';

interface TimePickerProps {
  label: string;
  value?: string; // "HH:mm" format
  onChange: (time: string | undefined) => void;
}

export function TimePicker({ label, value, onChange }: TimePickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  const dateValue = value ? timeStringToDate(value) : new Date();

  const handleChange = (_event: unknown, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      onChange(`${hours}:${minutes}`);
    }
  };

  const handleConfirmIOS = () => {
    setShowPicker(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Button
          mode="outlined"
          icon="clock-outline"
          onPress={() => setShowPicker(true)}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          {value ? formatTimeDisplay(value) : label}
        </Button>
        {value && (
          <IconButton
            icon="close"
            size={18}
            onPress={() => onChange(undefined)}
          />
        )}
      </View>
      {showPicker && (
        <View>
          <DateTimePicker
            value={dateValue}
            mode="time"
            is24Hour={false}
            onChange={handleChange}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          />
          {Platform.OS === 'ios' && (
            <Button mode="text" onPress={handleConfirmIOS} style={styles.doneButton}>
              Done
            </Button>
          )}
        </View>
      )}
    </View>
  );
}

function timeStringToDate(time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Layout.padding.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    flex: 1,
  },
  buttonContent: {
    justifyContent: 'flex-start',
  },
  doneButton: {
    alignSelf: 'flex-end',
  },
});
