import React, { useState, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { 
  View, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions,
  StatusBar,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  withSpring,
} from 'react-native-reanimated';
import { ChildColors, ChildSizes } from '../../constants';
import { useAuthStore } from '../../lib/stores';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Import the screens
import ChildTodayScreen from './index';
import ProgressScreen from './progress';

// Galo shield image
const GaloShield = require('../../assets/images/mascot/galo-shield.png');

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ChildLayout() {
  const router = useRouter();
  const setRole = useAuthStore((s) => s.setRole);
  const childName = useAuthStore((s) => s.childName);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useSharedValue(0);
  const [currentScreen, setCurrentScreen] = useState(0);

  const switchToParent = async () => {
    await setRole('parent');
    router.replace('/(parent)');
  };

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  const onMomentumScrollEnd = (event: any) => {
    const screenIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    setCurrentScreen(screenIndex);
  };

  const navigateToScreen = (index: number) => {
    scrollViewRef.current?.scrollTo({ x: index * screenWidth, animated: true });
    setCurrentScreen(index);
  };

  // Animated header styles
  const headerAnimatedStyle = useAnimatedStyle(() => {
    const progress = interpolate(scrollX.value, [0, screenWidth], [0, 1]);
    
    return {
      transform: [
        {
          translateY: withSpring(interpolate(progress, [0, 1], [0, -10])),
        },
      ],
    };
  });

  const todayHeaderStyle = useAnimatedStyle(() => {
    const progress = interpolate(scrollX.value, [0, screenWidth], [1, 0]);
    return {
      opacity: withSpring(progress),
      transform: [
        {
          translateY: withSpring(interpolate(progress, [0, 1], [20, 0])),
        },
      ],
    };
  });

  const progressHeaderStyle = useAnimatedStyle(() => {
    const progress = interpolate(scrollX.value, [0, screenWidth], [0, 1]);
    return {
      opacity: withSpring(progress),
      transform: [
        {
          translateY: withSpring(interpolate(progress, [0, 1], [20, 0])),
        },
      ],
    };
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={ChildColors.galoBlack} />
      
      {/* Custom Header */}
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <Animated.View style={[styles.header, headerAnimatedStyle]}>
          <View style={styles.headerContent}>
            {/* Dynamic Title */}
            <View style={styles.titleContainer}>
              <Animated.View style={[styles.titleWrapper, todayHeaderStyle]}>
                <Text style={styles.greeting}>
                  BOM DIA, {(childName || 'VITOR').toUpperCase()}!
                </Text>
                <Text style={styles.date}>
                  {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR }).toUpperCase()}
                </Text>
              </Animated.View>
              
              <Animated.View style={[styles.titleWrapper, progressHeaderStyle, { position: 'absolute' }]}>
                <Text style={styles.greeting}>
                  SEU PROGRESSO
                </Text>
                <Text style={styles.date}>
                  SEMANA E CLASSIFICAÇÃO
                </Text>
              </Animated.View>
            </View>

            {/* Parent Switch Button */}
            <TouchableOpacity onPress={switchToParent} style={styles.headerRightContainer}>
              <Image source={GaloShield} style={styles.headerShield} resizeMode="contain" />
            </TouchableOpacity>
          </View>

          {/* Screen Indicator */}
          <View style={styles.screenIndicator}>
            <TouchableOpacity
              style={[styles.dot, currentScreen === 0 && styles.activeDot]}
              onPress={() => navigateToScreen(0)}
            />
            <TouchableOpacity
              style={[styles.dot, currentScreen === 1 && styles.activeDot]}
              onPress={() => navigateToScreen(1)}
            />
          </View>
          
          {/* Swipe Hint */}
          <View style={styles.swipeHint}>
            <Text style={styles.swipeText}>
              {currentScreen === 0 ? '⬆️ Deslize para ver progresso' : '⬇️ Voltar para hoje'}
            </Text>
          </View>
        </Animated.View>
      </SafeAreaView>

      {/* Scrollable Screens */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {/* Screen 1: Today (Home) */}
        <View style={styles.screen}>
          <ChildTodayScreen />
        </View>

        {/* Screen 2: Progress */}
        <View style={styles.screen}>
          <ProgressScreen />
        </View>
      </ScrollView>

      {/* Bottom Swipe Indicator */}
      <SafeAreaView edges={['bottom']} style={styles.bottomSafeArea}>
        <View style={styles.bottomIndicator}>
          <Text style={styles.bottomText}>
            {currentScreen === 0 ? 'HOJE' : 'PROGRESSO'}
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChildColors.galoBlack,
  },
  headerSafeArea: {
    backgroundColor: ChildColors.galoBlack,
  },
  header: {
    backgroundColor: ChildColors.galoBlack,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
    position: 'relative',
    height: 60,
  },
  titleWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: ChildColors.textPrimary,
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: ChildColors.textSecondary,
    textTransform: 'capitalize',
  },
  headerRightContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerShield: {
    width: 28,
    height: 36,
  },
  screenIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ChildColors.textMuted,
  },
  activeDot: {
    backgroundColor: ChildColors.starGold,
    width: 24,
  },
  swipeHint: {
    alignItems: 'center',
  },
  swipeText: {
    fontSize: 12,
    color: ChildColors.textSecondary,
    fontStyle: 'italic',
  },
  scrollView: {
    flex: 1,
  },
  screen: {
    width: screenWidth,
    flex: 1,
  },
  bottomSafeArea: {
    backgroundColor: ChildColors.galoBlack,
  },
  bottomIndicator: {
    paddingVertical: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: ChildColors.cardBorder,
  },
  bottomText: {
    fontSize: 14,
    fontWeight: '700',
    color: ChildColors.starGold,
  },
});
