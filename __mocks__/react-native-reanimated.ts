// Mock react-native-reanimated
const Reanimated = {
  default: {
    call: jest.fn(),
    createAnimatedComponent: (component: any) => component,
    Value: jest.fn(),
    event: jest.fn(),
  },
  useSharedValue: jest.fn((init: any) => ({ value: init })),
  useAnimatedStyle: jest.fn(() => ({})),
  withTiming: jest.fn((toValue: any) => toValue),
  withSpring: jest.fn((toValue: any) => toValue),
  withSequence: jest.fn((...args: any[]) => args[args.length - 1]),
  withDelay: jest.fn((_delay: any, anim: any) => anim),
  FadeIn: { duration: jest.fn(() => ({ delay: jest.fn() })) },
  FadeOut: { duration: jest.fn(() => ({ delay: jest.fn() })) },
  SlideInRight: { duration: jest.fn() },
  SlideOutLeft: { duration: jest.fn() },
  Layout: { duration: jest.fn() },
  LinearTransition: { duration: jest.fn() },
};

module.exports = Reanimated;
