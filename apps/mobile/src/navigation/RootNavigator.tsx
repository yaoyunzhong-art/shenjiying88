/**
 * RootNavigator.tsx - Phase-21 T52
 * 根路由:根据登录状态切换 Auth vs Main
 *
 * - 未登录 → AuthStack (Login)
 * - 已登录 → MainStack (Drawer + Tab)
 */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { ActivityIndicator, View } from 'react-native';

import { useAuthStore } from '../store/authStore';
import { LoginScreen } from '../screens/LoginScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { OrdersScreen } from '../screens/OrdersScreen';
import { MembersScreen } from '../screens/MembersScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

export type RootStackParamList = {
  Main: undefined;
  Login: undefined;
};

export type MainDrawerParamList = {
  Tabs: undefined;
  Profile: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Orders: undefined;
  Members: undefined;
  Notifications: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator<MainDrawerParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

/** 主 Tab 栏:首页/订单/会员/通知 */
const MainTabs: React.FC = () => (
  <Tab.Navigator>
    <Tab.Screen name="Home" component={HomeScreen} options={{ title: '首页' }} />
    <Tab.Screen name="Orders" component={OrdersScreen} options={{ title: '订单' }} />
    <Tab.Screen name="Members" component={MembersScreen} options={{ title: '会员' }} />
    <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ title: '通知' }} />
  </Tab.Navigator>
);

/** 主 Drawer:Tab + Profile */
const MainDrawer: React.FC = () => (
  <Drawer.Navigator>
    <Drawer.Screen name="Tabs" component={MainTabs} options={{ title: '神机营' }} />
    <Drawer.Screen name="Profile" component={ProfileScreen} options={{ title: '我的' }} />
  </Drawer.Navigator>
);

/** 根路由 - 根据登录态切换 */
export const RootNavigator: React.FC = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  // 等待会话恢复 (AsyncStorage 读取)
  if (!isHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Screen name="Main" component={MainDrawer} />
        ) : (
          <RootStack.Screen name="Login" component={LoginScreen} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};