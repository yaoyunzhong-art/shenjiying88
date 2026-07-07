/**
 * Pure-JS mock for react-native, avoiding FB's Flow-incompatible index.js.
 * Provides the minimum surface needed for vitest tests.
 */

const React = require('react');

function createComponent(displayName) {
  function Comp(props) {
    // When react-test-renderer renders us, React passes children as props.children
    // AND as additional arguments to createElement. We pass them back correctly.
    return React.createElement(displayName, props, props.children);
  }
  Comp.displayName = displayName;
  return Comp;
}

// Components
const View = createComponent('View');
const Text = createComponent('Text');
const ScrollView = createComponent('RCTScrollView');
const SafeAreaView = createComponent('SafeAreaView');
const KeyboardAvoidingView = createComponent('KeyboardAvoidingView');
const TouchableOpacity = createComponent('TouchableOpacity');
const TouchableHighlight = createComponent('TouchableHighlight');
const TouchableWithoutFeedback = createComponent('TouchableWithoutFeedback');
const TouchableNativeFeedback = createComponent('TouchableNativeFeedback');
const Modal = createComponent('Modal');

function FlatList(props) {
  return React.createElement('FlatList', props);
}
FlatList.displayName = 'FlatList';

function SectionList(props) {
  return React.createElement('SectionList', props);
}
SectionList.displayName = 'SectionList';

function VirtualizedList(props) {
  return React.createElement('VirtualizedList', props);
}
VirtualizedList.displayName = 'VirtualizedList';

const TextInput = createComponent('TextInput');
const Image = createComponent('Image');
const ImageBackground = createComponent('ImageBackground');
const ActivityIndicator = createComponent('ActivityIndicator');
const StatusBar = createComponent('StatusBar');
const Pressable = createComponent('Pressable');
const RefreshControl = createComponent('RefreshControl');
const Button = createComponent('Button');
const Switch = createComponent('Switch');

const Alert = { alert: function() {} };

const StyleSheet = {
  create: function(styles) { return styles; },
  flatten: function(style) { return style; },
  absoluteFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  hairlineWidth: 0.5,
  absoluteFillObject: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
};

const Platform = {
  OS: 'ios',
  Version: '0',
  select: function(obj) { return obj.ios || obj.default; },
  isTesting: true,
};

const Dimensions = {
  get: function() { return { width: 375, height: 812 }; },
  addEventListener: function() { return { remove: function() {} }; },
  removeEventListener: function() {},
};

const PixelRatio = {
  get: function() { return 2; },
  getFontScale: function() { return 1; },
  getPixelSizeForLayoutSize: function(s) { return s * 2; },
  roundToNearestPixel: function(s) { return s; },
  startDetecting: function() {},
};

const AppState = {
  currentState: 'active',
  addEventListener: function() { return { remove: function() {} }; },
  removeEventListener: function() {},
};

const Animated = {
  View: createComponent('Animated.View'),
  Text: createComponent('Animated.Text'),
  Image: createComponent('Animated.Image'),
  ScrollView: createComponent('Animated.ScrollView'),
  FlatList: createComponent('Animated.FlatList'),
  Value: function(val) { return val; },
  timing: function() { return { start: function(cb) { cb && cb(); } }; },
  spring: function() { return { start: function(cb) { cb && cb(); } }; },
  sequence: function() { return { start: function(cb) { cb && cb(); } }; },
  parallel: function() { return { start: function(cb) { cb && cb(); } }; },
  delay: function() { return { start: function(cb) { cb && cb(); } }; },
  loop: function() { return { start: function(cb) { cb && cb(); } }; },
  createAnimatedComponent: function(c) { return c; },
};

const Linking = {
  openURL: function() { return Promise.resolve(true); },
  canOpenURL: function() { return Promise.resolve(true); },
  addEventListener: function() { return { remove: function() {} }; },
};

const LogBox = {
  ignoreLogs: function() {},
};

function useColorScheme() {
  return 'light';
}

module.exports = {
  View,
  Text,
  ScrollView,
  FlatList,
  SectionList,
  VirtualizedList,
  TouchableOpacity,
  TouchableHighlight,
  TouchableWithoutFeedback,
  TouchableNativeFeedback,
  TextInput,
  Image,
  ImageBackground,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
  Pressable,
  RefreshControl,
  KeyboardAvoidingView,
  Modal,
  Button,
  Switch,
  Alert,
  StyleSheet,
  Platform,
  Dimensions,
  PixelRatio,
  AppState,
  Animated,
  Linking,
  LogBox,
  useColorScheme,
};
