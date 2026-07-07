/**
 * Mock react-native for vitest tests.
 * Replaces the real react-native (which contains Flow syntax) with
 * a vitest mock that provides just the exports our test files need.
 */
import { vi } from 'vitest';

// Minimal react-native mock providing common RN exports used in screens
vi.mock('react-native', () => {
  // The real react-native has Flow syntax that rolldown can't parse,
  // so we replace it with a pure-JS mock at the module resolution level.
  const React = require('react');

  const mockComponent = <P extends object>(displayName: string) => {
    return React.forwardRef<unknown, P>((props: P, ref: React.Ref<unknown>) => {
      return React.createElement(displayName as any, { ...props, ref } as any);
    });
  };

  return {
    // Core components
    View: mockComponent('View'),
    Text: mockComponent('Text'),
    ScrollView: mockComponent('RCTScrollView'),
    FlatList: mockComponent('FlatList'),
    TouchableOpacity: mockComponent('TouchableOpacity'),
    StyleSheet: {
      create: (styles: Record<string, any>) => styles,
      flatten: (style: any) => style,
      absoluteFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
      hairlineWidth: 0.5,
    },
    Platform: {
      OS: 'ios',
      Version: '0',
      select: (obj: Record<string, any>) => obj.ios ?? obj.default,
    },
    ActivityIndicator: mockComponent('ActivityIndicator'),
    SafeAreaView: mockComponent('SafeAreaView'),
    Image: mockComponent('Image'),
    Modal: mockComponent('Modal'),
    StatusBar: mockComponent('StatusBar'),
    Pressable: mockComponent('Pressable'),
    RefreshControl: mockComponent('RefreshControl'),
    SectionList: mockComponent('SectionList'),
    VirtualizedList: mockComponent('VirtualizedList'),
    Alert: {
      alert: (..._args: any[]) => {},
    },
    Dimensions: {
      get: () => ({ width: 375, height: 812 }),
      addEventListener: () => ({ remove: () => {} }),
      removeEventListener: () => {},
    },
    PixelRatio: {
      get: () => 2,
      getFontScale: () => 1,
      getPixelSizeForLayoutSize: (size: number) => size * 2,
      roundToNearestPixel: (size: number) => size,
    },
    AppState: {
      currentState: 'active',
      addEventListener: () => ({ remove: () => {} }),
      removeEventListener: () => {},
    },
    // Styles
    StatusBarStyle: {} as any,
    KeyboardAvoidingView: mockComponent('KeyboardAvoidingView'),
    // Default export
    default: {},
  };
});
