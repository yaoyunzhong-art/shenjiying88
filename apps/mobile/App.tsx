/**
 * App.tsx - Phase-21 T51
 * 神机营 SaaS 移动端 - 根组件
 *
 * 启动顺序:
 * 1. SafeAreaProvider (屏幕安全区域)
 * 2. GestureHandlerRootView (手势)
 * 3. QueryClientProvider (React Query)
 * 4. NetInfoProvider (网络状态)
 * 5. RootNavigator (路由)
 */
import React, { useEffect } from 'react';
import { StatusBar, useColorScheme, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';

import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuthStore } from './src/store/authStore';
import { setupNotifications } from './src/network/push';

// React Query 客户端
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 离线优先:30s 内数据视为新鲜
      staleTime: 30 * 1000,
      // 失败后重试 1 次
      retry: 1,
      // 后台重新获取:聚焦时刷新
      refetchOnWindowFocus: false,
    },
  },
});

// 屏蔽已知 RN 警告 (开发体验优化)
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

const App: React.FC = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const restoreSession = useAuthStore((s) => s.restoreSession);

  // 应用启动时恢复会话 + 注册推送
  useEffect(() => {
    restoreSession();
    setupNotifications().catch((err) =>
      console.warn('[push] setup failed', err),
    );
    // 监听网络状态变化
    const unsubscribe = NetInfo.addEventListener((state) => {
      console.log('[net] connection:', state.isConnected, state.type);
    });
    return () => unsubscribe();
  }, [restoreSession]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
          <RootNavigator />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;