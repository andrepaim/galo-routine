module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|date-fns)',
  ],
  setupFilesAfterSetup: [],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    // Mock the teams.json data file
    '../../assets/data/teams\\.json': '<rootDir>/__mocks__/teams.json',
    // Mock app firebase modules (must come before SDK patterns)
    '../firebase/config': '<rootDir>/__mocks__/firebase/config.ts',
    '../../lib/firebase/config': '<rootDir>/__mocks__/firebase/config.ts',
    '\\.\\./firebase/firestore$': '<rootDir>/__mocks__/lib/firebase/firestore.ts',
    '../../lib/firebase/firestore$': '<rootDir>/__mocks__/lib/firebase/firestore.ts',
    '\\.\\./firebase/auth$': '<rootDir>/__mocks__/lib/firebase/auth.ts',
    '../../lib/firebase/auth$': '<rootDir>/__mocks__/lib/firebase/auth.ts',
    // Mock firebase SDK modules (generic patterns last)
    '^firebase/firestore$': '<rootDir>/__mocks__/firebase/firestore.ts',
    '^firebase/auth$': '<rootDir>/__mocks__/firebase/auth.ts',
    '^firebase/app$': '<rootDir>/__mocks__/firebase/app.ts',
    // Mock native modules
    'expo-secure-store': '<rootDir>/__mocks__/expo-secure-store.ts',
    'expo-haptics': '<rootDir>/__mocks__/expo-haptics.ts',
    'expo-notifications': '<rootDir>/__mocks__/expo-notifications.ts',
    'expo-image-picker': '<rootDir>/__mocks__/expo-image-picker.ts',
    'react-native-reanimated': '<rootDir>/__mocks__/react-native-reanimated.ts',
  },
  testPathIgnorePatterns: ['/node_modules/', '/functions/'],
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    'constants/**/*.{ts,tsx}',
    '!lib/firebase/**',
    '!lib/types/**',
    '!**/*.d.ts',
  ],
};
