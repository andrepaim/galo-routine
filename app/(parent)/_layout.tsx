import { Tabs, useRouter } from 'expo-router';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-paper';
import { ChildColors, ChildSizes } from '../../constants';

// Galo shield image
const GaloShield = require('../../assets/images/mascot/galo-shield.png');

export default function ParentLayout() {
  const router = useRouter();

  const switchToChild = () => {
    router.replace('/(auth)/child-pin');
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ChildColors.starGold,
        tabBarInactiveTintColor: ChildColors.tabInactive,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        headerStyle: styles.header,
        headerTintColor: ChildColors.textPrimary,
        headerTitleStyle: styles.headerTitle,
        headerRight: () => (
          <TouchableOpacity onPress={switchToChild} style={styles.headerRightContainer}>
            <Image source={GaloShield} style={styles.headerShield} resizeMode="contain" />
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconContainer, focused && styles.tabIconActive]}>
              <Icon source="home" size={ChildSizes.tabIconSize} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tarefas',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconContainer, focused && styles.tabIconActive]}>
              <Icon source="format-list-checks" size={ChildSizes.tabIconSize} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: 'Prêmios',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconContainer, focused && styles.tabIconActive]}>
              <Icon source="gift" size={ChildSizes.tabIconSize} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Configurações',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconContainer, focused && styles.tabIconActive]}>
              <Icon source="cog" size={ChildSizes.tabIconSize} color={color} />
            </View>
          ),
        }}
      />
      {/* Hidden tabs - keep for routing but don't show in tab bar */}
      <Tabs.Screen
        name="approvals"
        options={{
          href: null, // Hide from tab bar
          title: 'Aprovar',
        }}
      />
      <Tabs.Screen
        name="periods"
        options={{
          href: null, // Hide from tab bar
          title: 'Períodos',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          href: null, // Hide from tab bar
          title: 'Metas',
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          href: null, // Hide from tab bar
          title: 'Relatórios',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: ChildColors.tabBackground,
    borderTopWidth: 0,
    height: ChildSizes.tabBarHeight,
    paddingBottom: 8,
    paddingTop: 8,
    elevation: 8,
    shadowColor: ChildColors.shadowColor,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  tabIconContainer: {
    padding: 4,
    borderRadius: 12,
  },
  tabIconActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
  },
  header: {
    backgroundColor: ChildColors.galoBlack,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTitle: {
    color: ChildColors.textPrimary,
    fontWeight: '700',
    fontSize: 18,
  },
  headerRightContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerShield: {
    width: 28,
    height: 36,
  },
});
