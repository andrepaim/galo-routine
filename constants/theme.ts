import { MD3DarkTheme } from 'react-native-paper';
import { ChildColors } from './childTheme';

export const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: ChildColors.starGold,
    primaryContainer: ChildColors.cardBackground,
    secondary: ChildColors.starGoldLight,
    secondaryContainer: ChildColors.cardBackgroundLight,
    background: ChildColors.galoBlack,
    surface: ChildColors.cardBackground,
    surfaceVariant: ChildColors.cardBackgroundLight,
    onSurface: ChildColors.textPrimary,
    onSurfaceVariant: ChildColors.textSecondary,
    outline: ChildColors.cardBorder,
    error: ChildColors.accentRed,
  },
  roundness: 12,
};
