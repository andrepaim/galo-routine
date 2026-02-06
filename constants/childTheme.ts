/**
 * Child Theme - Atlético Mineiro "Galo" inspired
 * Black, white, gold with playful gradients
 */

export const ChildColors = {
  // Galo Primary - Black & White
  galoBlack: '#1A1A1A',
  galoWhite: '#FFFFFF',
  galoDark: '#0D0D0D',
  
  // Gold accents (stars!)
  starGold: '#FFD700',
  starGoldLight: '#FFE44D',
  starGoldDark: '#E6C200',
  starGlow: 'rgba(255, 215, 0, 0.3)',
  
  // Playful accent colors (still kid-friendly)
  accentRed: '#E63946',      // For penalties/urgent
  accentGreen: '#2ECC71',    // For success/approved
  accentPurple: '#9B59B6',   // For pending/magic
  accentBlue: '#3498DB',     // For info
  
  // Gradients (for backgrounds)
  gradientStart: '#1A1A1A',
  gradientMid: '#2D2D2D', 
  gradientEnd: '#3D3D3D',
  
  // Soft background for cards (not pure black)
  cardBackground: '#2A2A2A',
  cardBackgroundLight: '#3A3A3A',
  cardBorder: '#444444',
  
  // Text on dark
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textMuted: '#707070',
  textGold: '#FFD700',
  
  // Status colors
  statusPending: '#9B59B6',
  statusApproved: '#2ECC71',
  statusRejected: '#E63946',
  
  // Category colors (bright on dark)
  categoryHygiene: '#00D4FF',
  categorySchool: '#FF6B9D',
  categoryStudy: '#7C4DFF',
  categoryChores: '#FF9500',
  categoryMeals: '#34C759',
  categoryExercise: '#FF453A',
  categoryExtracurricular: '#30D158',
  categoryRest: '#AC8E68',
  categoryOther: '#8E8E93',
  
  // Tab bar
  tabActive: '#FFD700',
  tabInactive: '#666666',
  tabBackground: '#1A1A1A',
  
  // Shadows & effects
  shadowColor: '#000000',
  glowGold: 'rgba(255, 215, 0, 0.4)',
} as const;

// Gradient definitions for LinearGradient
export const ChildGradients = {
  background: ['#1A1A1A', '#2D2D2D', '#1A1A1A'],
  card: ['#2A2A2A', '#323232'],
  goldShine: ['#FFD700', '#FFE44D', '#FFD700'],
  success: ['#27AE60', '#2ECC71'],
  header: ['#0D0D0D', '#1A1A1A'],
} as const;

// Fun rooster emoji for the mascot
export const GALO_EMOJI = '🐓';
export const STAR_EMOJI = '⭐';
export const TROPHY_EMOJI = '🏆';

// Layout adjustments for kid-friendly sizing
export const ChildSizes = {
  // Larger touch targets for kids
  buttonMinHeight: 56,
  cardPadding: 20,
  cardRadius: 20,
  
  // Bigger text
  titleSize: 28,
  subtitleSize: 18,
  bodySize: 16,
  
  // More spacing
  sectionGap: 24,
  itemGap: 16,
  
  // Tab bar
  tabBarHeight: 72,
  tabIconSize: 28,
} as const;
