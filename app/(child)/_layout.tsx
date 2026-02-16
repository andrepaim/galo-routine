import React from 'react';
import { Stack } from 'expo-router';
import { View, StyleSheet, StatusBar } from 'react-native';
import { ChildColors } from '../../constants';

export default function ChildLayout() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={ChildColors.galoBlack} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: ChildColors.galoBlack },
          animation: 'slide_from_right',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChildColors.galoBlack,
  },
});
