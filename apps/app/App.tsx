import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './navigation/AppNavigator';
import { AppProvider } from './context/AppContext';
import { OfflineProvider } from './context/OfflineContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaProvider>
      <OfflineProvider>
        <AppProvider>
          <StatusBar style="dark" />
          <AppNavigator />
        </AppProvider>
      </OfflineProvider>
    </SafeAreaProvider>
  );
}
