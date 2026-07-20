import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, StyleSheet } from 'react-native';

import { HomeScreen } from '../screens/home/HomeScreen';
import { MemberCenterScreen } from '../screens/member/MemberCenterScreen';
import { MemberHomeScreen } from '../screens/member/MemberHomeScreen';
import { MemberLoginScreen } from '../screens/member/MemberLoginScreen';
import { MemberProfileScreen } from '../screens/member/MemberProfileScreen';
import { MyOrdersScreen } from '../screens/member/MyOrdersScreen';
import { MyCouponsScreen } from '../screens/member/MyCouponsScreen';
import { StoreSearchScreen } from '../screens/member/StoreSearchScreen';
import { PaymentScreen } from '../screens/cashier/PaymentScreen';
import { RefundScreen } from '../screens/cashier/RefundScreen';
import { OrderListScreen } from '../screens/orders/OrderListScreen';
import { OrderDetailScreen } from '../screens/orders/OrderDetailScreen';
import { InventoryScreen } from '../screens/inventory/InventoryScreen';
import { InventoryScanScreen } from '../screens/inventory/InventoryScanScreen';
import { StaffManageScreen } from '../screens/staff/StaffManageScreen';
import { ScheduleScreen } from '../screens/staff/ScheduleScreen';
import { HandoffScreen } from '../screens/staff/HandoffScreen';
import { ScanScreen } from '../screens/scan/ScanScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { BiometricSettingsScreen } from '../screens/settings/BiometricSettingsScreen';
import { NotificationSettingsScreen } from '../screens/settings/NotificationSettingsScreen';
import { LanguageSettingsScreen } from '../screens/settings/LanguageSettingsScreen';
import { ToolRegistryScreen } from '../screens/settings/ToolRegistryScreen';
import { ReportDashboardScreen } from '../screens/report/ReportDashboardScreen';
import { DeviceMonitorScreen } from '../screens/device/DeviceMonitorScreen';
import { MarketingScreen } from '../screens/marketing/MarketingScreen';
import { TicketWorkplaceScreen } from '../screens/cs/TicketWorkplaceScreen';
import { KnowledgeBaseScreen } from '../screens/cs/KnowledgeBaseScreen';
import { CustomerFeedbackScreen } from '../screens/cs/CustomerFeedbackScreen';
import { OfflineIndicator } from '../components/OfflineIndicator';
import type {
  OrderDetailRouteParams,
  OrderRuntimeRouteParams,
  PaymentRouteParams,
  RefundRouteParams,
} from '../utils/order-route';

// Settings stack types
export type SettingsStackParamList = {
  SettingsMain: undefined;
  BiometricSettings: undefined;
  NotificationSettings: undefined;
  LanguageSettings: undefined;
  ToolRegistry: { initialFilter?: import('../screens/settings/ToolRegistryScreen').ToolFilter } | undefined;
};

// Tab types
export type RootTabParamList = {
  HomeTab: undefined;
  WorkTab: undefined;
  MemberTab: undefined;
  CSTab: undefined;
  SettingsTab: undefined;
};

// Work stack types
export type WorkStackParamList = {
  WorkHome: undefined;
  Payment: PaymentRouteParams | undefined;
  Refund: RefundRouteParams | undefined;
  Orders: OrderRuntimeRouteParams | undefined;
  OrderDetail: OrderDetailRouteParams;
  Inventory: undefined;
  InventoryScan: undefined;
  Scan: undefined;
  Report: undefined;
  Device: undefined;
  Marketing: undefined;
  StaffManage: undefined;
  Schedule: undefined;
  Handoff: undefined;
};

// Member stack types
export type MemberStackParamList = {
  MemberHome: undefined;
  MemberCenter: undefined;
  MemberLogin: undefined;
  MemberProfile: undefined;
  MyOrders: undefined;
  MyCoupons: undefined;
  StoreSearch: undefined;
};

// CS stack types
export type CSStackParamList = {
  TicketWorkplace: undefined;
  KnowledgeBase: undefined;
  CustomerFeedback: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const WorkStack = createNativeStackNavigator<WorkStackParamList>();
const MemberStack = createNativeStackNavigator<MemberStackParamList>();
const CSStack = createNativeStackNavigator<CSStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

interface TabIconProps {
  focused: boolean;
  icon: string;
  label: string;
}

function TabIcon({ focused, icon, label }: TabIconProps) {
  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{icon}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
    </View>
  );
}

function WorkNavigator() {
  return (
    <WorkStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* 工作台首页 */}
      <WorkStack.Screen
        name="WorkHome"
        component={WorkHomeScreen}
        options={{ title: '工作台' }}
      />
      {/* 收款 */}
      <WorkStack.Screen name="Payment" component={PaymentScreen} />
      <WorkStack.Screen
        name="Refund"
        component={RefundScreen}
        options={{ headerShown: true, title: '申请退款' }}
      />
      {/* 订单 */}
      <WorkStack.Screen name="Orders" component={OrderListScreen} />
      <WorkStack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ headerShown: true, title: '订单详情' }}
      />
      {/* 库存 */}
      <WorkStack.Screen name="Inventory" component={InventoryScreen} />
      <WorkStack.Screen
        name="InventoryScan"
        component={InventoryScanScreen}
        options={{ headerShown: true, title: '库存扫码' }}
      />
      {/* 扫码 */}
      <WorkStack.Screen name="Scan" component={ScanScreen} />
      {/* 报表 */}
      <WorkStack.Screen
        name="Report"
        component={ReportDashboardScreen}
        options={{ headerShown: true, title: '数据报表' }}
      />
      {/* 设备 */}
      <WorkStack.Screen
        name="Device"
        component={DeviceMonitorScreen}
        options={{ headerShown: true, title: '设备监控' }}
      />
      {/* 营销 */}
      <WorkStack.Screen
        name="Marketing"
        component={MarketingScreen}
        options={{ headerShown: true, title: '营销活动' }}
      />
      {/* 员工 */}
      <WorkStack.Screen name="StaffManage" component={StaffManageScreen} />
      <WorkStack.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{ headerShown: true, title: '排班调度' }}
      />
      <WorkStack.Screen
        name="Handoff"
        component={HandoffScreen}
        options={{ headerShown: true, title: '交接班' }}
      />
    </WorkStack.Navigator>
  );
}

// 工作台首页 - 从 HomeScreen 改造
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

function WorkHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<WorkStackParamList>>();
  
  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      {/* Header */}
      <View style={{ backgroundColor: '#1E40AF', padding: 20, paddingTop: 60 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#fff' }}>工作台</Text>
        <Text style={{ fontSize: 14, color: '#93C5FD', marginTop: 4 }}>神机营体育·城西店</Text>
      </View>
      
      {/* 功能网格 */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 }}>
        {[
          { icon: '💰', label: '收款', screen: 'Payment' as const },
          { icon: '📋', label: '订单', screen: 'Orders' as const },
          { icon: '📦', label: '库存', screen: 'Inventory' as const },
          { icon: '📷', label: '扫码', screen: 'Scan' as const },
          { icon: '📊', label: '报表', screen: 'Report' as const },
          { icon: '🖥️', label: '设备', screen: 'Device' as const },
          { icon: '🎯', label: '营销', screen: 'Marketing' as const },
          { icon: '👥', label: '员工', screen: 'StaffManage' as const },
          { icon: '🔄', label: '交接班', screen: 'Handoff' as const },
        ].map((item) => (
          <View key={item.screen} style={{ width: '30%' }}>
            <TouchableOpacity
              style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
              onPress={() => navigation.navigate(item.screen as any)}
            >
              <Text style={{ fontSize: 32 }}>{item.icon}</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1E293B', marginTop: 8 }}>{item.label}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
}

import { TouchableOpacity } from 'react-native';

function MemberNavigator() {
  return (
    <MemberStack.Navigator screenOptions={{ headerShown: false }}>
      <MemberStack.Screen name="MemberHome" component={MemberHomeScreen} />
      <MemberStack.Screen name="MemberCenter" component={MemberCenterScreen} />
      <MemberStack.Screen
        name="MemberLogin"
        component={MemberLoginScreen}
        options={{ headerShown: true, title: '会员登录' }}
      />
      <MemberStack.Screen
        name="MemberProfile"
        component={MemberProfileScreen}
        options={{ headerShown: true, title: '会员资料' }}
      />
      <MemberStack.Screen
        name="MyOrders"
        component={MyOrdersScreen}
        options={{ headerShown: true, title: '我的订单' }}
      />
      <MemberStack.Screen
        name="MyCoupons"
        component={MyCouponsScreen}
        options={{ headerShown: true, title: '我的优惠券' }}
      />
      <MemberStack.Screen
        name="StoreSearch"
        component={StoreSearchScreen}
        options={{ headerShown: true, title: '门店搜索' }}
      />
    </MemberStack.Navigator>
  );
}

function CSNavigator() {
  return (
    <CSStack.Navigator screenOptions={{ headerShown: false }}>
      <CSStack.Screen
        name="TicketWorkplace"
        component={TicketWorkplaceScreen}
      />
      <CSStack.Screen
        name="KnowledgeBase"
        component={KnowledgeBaseScreen}
        options={{ headerShown: true, title: '知识库详情' }}
      />
      <CSStack.Screen
        name="CustomerFeedback"
        component={CustomerFeedbackScreen}
        options={{ headerShown: true, title: '客户反馈' }}
      />
    </CSStack.Navigator>
  );
}

function SettingsNavigator() {
  return (
    <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
      <SettingsStack.Screen
        name="SettingsMain"
        component={SettingsScreen}
      />
      <SettingsStack.Screen
        name="BiometricSettings"
        component={BiometricSettingsScreen}
        options={{ headerShown: true, title: '生物识别设置' }}
      />
      <SettingsStack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{ headerShown: true, title: '通知设置' }}
      />
      <SettingsStack.Screen
        name="LanguageSettings"
        component={LanguageSettingsScreen}
        options={{ headerShown: true, title: '语言设置' }}
      />
      <SettingsStack.Screen
        name="ToolRegistry"
        component={ToolRegistryScreen}
        options={{ headerShown: true, title: '工具注册管理' }}
      />
    </SettingsStack.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <OfflineIndicator />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarShowLabel: false,
        }}
      >
        <Tab.Screen
          name="HomeTab"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon="🏠" label="首页" />
            ),
          }}
        />
        <Tab.Screen
          name="WorkTab"
          component={WorkNavigator}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon="💼" label="工作台" />
            ),
          }}
        />
        <Tab.Screen
          name="MemberTab"
          component={MemberNavigator}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon="👤" label="会员" />
            ),
          }}
        />
        <Tab.Screen
          name="CSTab"
          component={CSNavigator}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon="🎧" label="客服" />
            ),
          }}
        />
        <Tab.Screen
          name="SettingsTab"
          component={SettingsNavigator}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon="⚙️" label="设置" />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 84,
    paddingTop: 8,
    paddingBottom: 28,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  tabIconFocused: {
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    fontSize: 10,
    color: '#999999',
  },
  tabLabelFocused: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
