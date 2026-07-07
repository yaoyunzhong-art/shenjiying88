import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Card } from '../../components/common/Card';

type RootTabParamList = {
  Home: undefined;
  Member: undefined;
  Payment: { orderId?: string };
  Orders: undefined;
  Inventory: undefined;
  Scan: undefined;
  Settings: undefined;
};

type ScanNavigationProp = BottomTabNavigationProp<RootTabParamList>;

interface ScanHistoryItem {
  id: string;
  code: string;
  type: 'ORDER' | 'PRODUCT' | 'MEMBER' | 'UNKNOWN';
  result?: string;
  scannedAt: string;
}

const mockHistory: ScanHistoryItem[] = [
  {
    id: 'scan-001',
    code: 'ORD20260612001',
    type: 'ORDER',
    result: '订单已找到',
    scannedAt: '2026-07-04T10:30:00.000Z',
  },
  {
    id: 'scan-002',
    code: 'SKU-COF-001',
    type: 'PRODUCT',
    result: '阿拉比卡咖啡豆 500g',
    scannedAt: '2026-07-04T09:15:00.000Z',
  },
  {
    id: 'scan-003',
    code: 'MEM-2024-001',
    type: 'MEMBER',
    result: '会员：张三',
    scannedAt: '2026-07-03T16:45:00.000Z',
  },
];

const codeTypeIcons: Record<string, string> = {
  ORDER: '📋',
  PRODUCT: '📦',
  MEMBER: '👤',
  UNKNOWN: '❓',
};

export function ScanScreen() {
  const navigation = useNavigation<ScanNavigationProp>();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [scanHistory] = useState<ScanHistoryItem[]>(mockHistory);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };
    getCameraPermissions();
  }, []);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    let type: ScanHistoryItem['type'] = 'UNKNOWN';
    let result = '';

    if (data.startsWith('ORD')) {
      type = 'ORDER';
      result = '订单已找到';
      Alert.alert('订单扫码', `订单号: ${data}`, [
        { text: '查看详情', onPress: () => navigation.navigate('Orders') },
        { text: '继续扫描', onPress: () => setScanned(false) },
      ]);
    } else if (data.startsWith('SKU')) {
      type = 'PRODUCT';
      result = '商品已找到';
      Alert.alert('商品扫码', `SKU: ${data}`, [
        { text: '查看库存', onPress: () => navigation.navigate('Inventory') },
        { text: '继续扫描', onPress: () => setScanned(false) },
      ]);
    } else if (data.startsWith('MEM')) {
      type = 'MEMBER';
      result = '会员已找到';
      Alert.alert('会员扫码', `会员码: ${data}`, [
        { text: '查看会员', onPress: () => navigation.navigate('Member') },
        { text: '继续扫描', onPress: () => setScanned(false) },
      ]);
    } else {
      Alert.alert('未知编码', `无法识别的条码: ${data}`, [
        { text: '继续扫描', onPress: () => setScanned(false) },
      ]);
    }
  };

  const handleQuickScan = (scanType: 'ORDER' | 'PRODUCT' | 'MEMBER') => {
    const mockCodes = {
      ORDER: 'ORD20260612001',
      PRODUCT: 'SKU-COF-001',
      MEMBER: 'MEM-2024-001',
    };
    handleBarCodeScanned({ data: mockCodes[scanType] });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderHistoryItem = ({ item }: { item: ScanHistoryItem }) => (
    <Card style={styles.historyCard}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyIcon}>{codeTypeIcons[item.type]}</Text>
        <View style={styles.historyInfo}>
          <Text style={styles.historyCode}>{item.code}</Text>
          <Text style={styles.historyResult}>{item.result}</Text>
        </View>
        <Text style={styles.historyTime}>{formatTime(item.scannedAt)}</Text>
      </View>
    </Card>
  );

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>正在请求相机权限...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>无法访问相机，请授权相机权限</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          barcodeScannerSettings={{
            barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39'],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        >
          <View style={styles.overlay}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <Text style={styles.scanHint}>将条码放入框内即可自动扫描</Text>
          </View>
        </CameraView>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.quickScanContainer}>
          <Text style={styles.sectionTitle}>快捷扫码</Text>
          <View style={styles.quickScanButtons}>
            <TouchableOpacity
              style={styles.quickScanButton}
              onPress={() => handleQuickScan('ORDER')}
            >
              <Text style={styles.quickScanIcon}>📋</Text>
              <Text style={styles.quickScanText}>订单</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickScanButton}
              onPress={() => handleQuickScan('PRODUCT')}
            >
              <Text style={styles.quickScanIcon}>📦</Text>
              <Text style={styles.quickScanText}>商品</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickScanButton}
              onPress={() => handleQuickScan('MEMBER')}
            >
              <Text style={styles.quickScanIcon}>👤</Text>
              <Text style={styles.quickScanText}>会员</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.historyToggle}
          onPress={() => setShowHistory(!showHistory)}
        >
          <Text style={styles.historyToggleText}>
            {showHistory ? '收起历史' : '查看历史'}
          </Text>
        </TouchableOpacity>

        {showHistory && (
          <FlatList
            data={scanHistory}
            renderItem={renderHistoryItem}
            keyExtractor={(item) => item.id}
            style={styles.historyList}
            ListEmptyComponent={
              <Text style={styles.emptyHistory}>暂无扫描历史</Text>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  permissionText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#007AFF',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scanHint: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bottomSection: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 16,
    maxHeight: '40%',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  quickScanContainer: {
    marginBottom: 16,
  },
  quickScanButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickScanButton: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    width: 90,
  },
  quickScanIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  quickScanText: {
    fontSize: 13,
    color: '#333333',
    fontWeight: '500',
  },
  historyToggle: {
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  historyToggleText: {
    fontSize: 14,
    color: '#007AFF',
  },
  historyList: {
    maxHeight: 200,
  },
  historyCard: {
    padding: 12,
    marginBottom: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  historyResult: {
    fontSize: 12,
    color: '#666666',
  },
  historyTime: {
    fontSize: 11,
    color: '#999999',
  },
  emptyHistory: {
    textAlign: 'center',
    color: '#999999',
    paddingVertical: 20,
  },
});
