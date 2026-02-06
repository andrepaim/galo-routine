import { Tabs, useRouter } from 'expo-router';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Icon, IconButton, Text } from 'react-native-paper';
import { ChildColors, ChildSizes } from '../../constants';
import { useAuthStore } from '../../lib/stores';

// Galo shield image
const GaloShield = require('../../assets/images/mascot/galo-shield.png');

export default function ChildLayout() {
  const router = useRouter();
  const setRole = useAuthStore((s) => s.setRole);

  const switchToParent = async () => {
    await setRole('parent');
    router.replace('/(parent)');
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ChildColors.tabActive,
        tabBarInactiveTintColor: ChildColors.tabInactive,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        headerStyle: styles.header,
        headerTintColor: ChildColors.textPrimary,
        headerTitleStyle: styles.headerTitle,
        headerRight: () => (
          <TouchableOpacity onPress={switchToParent} style={styles.headerRightContainer}>
            <Image source={GaloShield} style={styles.headerShield} resizeMode="contain" />
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hoje',
          headerTitle: 'Meu Dia',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconContainer, focused && styles.tabIconActive]}>
              <Icon source="star-face" size={ChildSizes.tabIconSize} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tarefas',
          headerTitle: 'Minhas Tarefas',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconContainer, focused && styles.tabIconActive]}>
              <Icon source="format-list-checks" size={ChildSizes.tabIconSize} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="stars"
        options={{
          title: 'Estrelas',
          headerTitle: 'Minhas Estrelas',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconContainer, focused && styles.tabIconActive]}>
              <Icon source="star-shooting" size={ChildSizes.tabIconSize} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Loja',
          headerTitle: 'Loja de Prêmios',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconContainer, focused && styles.tabIconActive]}>
              <Icon source="gift" size={ChildSizes.tabIconSize} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="badges"
        options={{
          title: 'Troféus',
          headerTitle: 'Meus Troféus',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconContainer, focused && styles.tabIconActive]}>
              <Icon source="trophy" size={ChildSizes.tabIconSize} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          headerTitle: 'Meu Perfil',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconContainer, focused && styles.tabIconActive]}>
              <Icon source="account-circle" size={ChildSizes.tabIconSize} color={color} />
            </View>
          ),
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
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  tabItem: {
    paddingTop: 4,
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
