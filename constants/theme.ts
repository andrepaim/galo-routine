import { MD3LightTheme } from 'react-native-paper';
import { Colors } from './colors';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: Colors.primary,
    primaryContainer: Colors.primaryContainer,
    secondary: Colors.secondary,
    secondaryContainer: Colors.secondaryContainer,
    background: Colors.background,
    surface: Colors.surface,
    surfaceVariant: Colors.surfaceVariant,
    error: Colors.error,
  },
  roundness: 12,
};
