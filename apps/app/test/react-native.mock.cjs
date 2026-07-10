/**
 * Minimal react-native mock for node:test with react-test-renderer.
 * Avoids esbuild transform errors on Flow-typed `import typeof` syntax.
 */
const React = require('react');

function createComponent(name) {
  const comp = function (props) {
    return React.createElement(name, props, props.children);
  };
  comp.displayName = name;
  return comp;
}

const View = createComponent('View');
const Text = createComponent('Text');
const TouchableOpacity = createComponent('TouchableOpacity');
const Switch = createComponent('Switch');
const Alert = { alert: function alert() {} };
const ScrollView = createComponent('ScrollView');
const FlatList = createComponent('FlatList');
const SectionList = createComponent('SectionList');
const Image = createComponent('Image');
const TextInput = createComponent('TextInput');
const Modal = createComponent('Modal');
const ActivityIndicator = createComponent('ActivityIndicator');
const Pressable = createComponent('Pressable');
const KeyboardAvoidingView = createComponent('KeyboardAvoidingView');
const SafeAreaView = createComponent('SafeAreaView');
const StatusBar = createComponent('StatusBar');
const StyleSheet = {
  create: function create(styles) { return styles; },
  flatten: function flatten() {},
  hairlineWidth: 1,
};
const Platform = {
  OS: 'web',
  select: function select(obj) { return obj.web ?? obj.default; },
};
const Dimensions = {
  get: function get() { return { width: 375, height: 812 }; },
};
const PixelRatio = {
  get: function get() { return 2; },
};
const Animated = {
  View: createComponent('Animated.View'),
  Text: createComponent('Animated.Text'),
  Image: createComponent('Animated.Image'),
  ScrollView: createComponent('Animated.ScrollView'),
  createAnimatedComponent: function(comp) { return comp; },
  timing: function() { return { start: function() {} }; },
  spring: function() { return { start: function() {} }; },
  Value: function(val) { this._value = val; },
  ValueXY: function() {},
};
const AppState = {
  currentState: 'active',
  addEventListener: function() { return { remove: function() {} }; },
};
const Linking = {
  openURL: function() { return Promise.resolve(true); },
  canOpenURL: function() { return Promise.resolve(false); },
  addEventListener: function() {},
};
const Clipboard = {
  getString: function() { return Promise.resolve(''); },
  setString: function() {},
};
const I18nManager = {
  isRTL: false,
  allowRTL: function() {},
  forceRTL: function() {},
};
const InteractionManager = {
  runAfterInteractions: function(fn) { fn(); },
  createInteractionHandle: function() {},
  clearInteractionHandle: function() {},
};

module.exports = {
  View,
  Text,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
  FlatList,
  SectionList,
  Image,
  TextInput,
  Modal,
  ActivityIndicator,
  Pressable,
  KeyboardAvoidingView,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Platform,
  Dimensions,
  PixelRatio,
  Animated,
  AppState,
  Linking,
  Clipboard,
  I18nManager,
  InteractionManager,
  // Default export
  default: {
    View,
    Text,
    TouchableOpacity,
    Switch,
    Alert,
    StyleSheet,
    Platform,
  },
};
