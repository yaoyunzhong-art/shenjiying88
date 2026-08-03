import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CameraView, Camera } from 'expo-camera';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

interface ScanResult {
  skuId: string;
  title: string;
  quantity: number;
  location: string;
}

const mockScanResults: Record<string, ScanResult> = {
  'SKU-COF-001': {
    skuId: 'SKU-COF-001',
    title: '阿拉比卡咖啡豆 500g',
    quantity: 156,
    location: 'A区-01-03',
  },
  'SKU-MILK-001': {
    skuId: 'SKU-MILK-001',
    title: '鲜牛奶 1L',
    quantity: 8,
    location: '冷藏区-02-01',
  },
  'SKU-CUP-001': {
    skuId: 'SKU-CUP-001',
    title: '一次性纸杯 100只装',
    quantity: 0,
    location: 'B区-03-05',
  },
};

export function InventoryScanScreen() {
  const navigation = useNavigation();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);

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

    const result = mockScanResults[data];
    if (result) {
      setScanResult(result);
      setScanHistory((prev) => {
        const exists = prev.find((item) => item.skuId === result.skuId);
        if (exists) return prev;
        return [result, ...prev].slice(0, 10);
      });
    } else {
      Alert.alert('提示', `未找到商品: ${data}`, [
        { text: '继续扫描', onPress: () => setScanned(false) },
      ]);
    }
  };

  const handleContinueScan = () => {
    setScanned(false);
    setScanResult(null);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>加载中...</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>数据获取失败: {error}</Text>
        <Button
          title="重试"
          onPress={() => setError(null)}
          style={styles.permissionButton}
        />
      </View>
    );
  }

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
        <Button
          title="返回"
          onPress={() => navigation.goBack()}
          style={styles.permissionButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!scanResult ? (
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
          {scanned && (
            <View style={styles.scanResultOverlay}>
              <Card style={styles.loadingCard}>
                <Text style={styles.loadingText}>正在识别...</Text>
              </Card>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.resultContainer}>
          <Card style={styles.resultCard}>
            <Text style={styles.resultTitle}>扫描结果</Text>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>SKU</Text>
              <Text style={styles.resultValue}>{scanResult.skuId}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>商品名称</Text>
              <Text style={styles.resultValue}>{scanResult.title}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>库存数量</Text>
              <Text
                style={[
                  styles.resultValue,
                  scanResult.quantity === 0 && styles.dangerValue,
                ]}
              >
                {scanResult.quantity} 件
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>存放位置</Text>
              <Text style={styles.resultValue}>{scanResult.location}</Text>
            </View>
          </Card>
          <View style={styles.resultButtons}>
            <Button
              title="继续扫描"
              onPress={handleContinueScan}
              style={styles.resultButton}
            />
            <Button
              title="返回"
              onPress={() => navigation.goBack()}
              variant="outline"
              style={styles.resultButton}
            />
          </View>
        </View>
      )}

      {scanHistory.length > 0 && (
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>扫描历史</Text>
          <View style={styles.historyList}>
            {scanHistory.map((item) => (
              <TouchableOpacity
                key={item.skuId}
                style={styles.historyItem}
                onPress={() => {
                  setScanResult(item);
                }}
              >
                <Text style={styles.historySku}>{item.skuId}</Text>
                <Text style={styles.historyName} numberOfLines={1}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  permissionButton: {
    marginHorizontal: 32,
    marginTop: 24,
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
  scanResultOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  loadingCard: {
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#333333',
  },
  resultContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  resultCard: {
    padding: 20,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  resultLabel: {
    fontSize: 14,
    color: '#666666',
  },
  resultValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  dangerValue: {
    color: '#FF3B30',
  },
  resultButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  resultButton: {
    flex: 1,
  },
  historyContainer: {
    backgroundColor: '#1A1A1A',
    padding: 16,
  },
  historyTitle: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 12,
  },
  historyList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  historyItem: {
    backgroundColor: '#333333',
    borderRadius: 8,
    padding: 8,
    minWidth: 100,
  },
  historySku: {
    fontSize: 12,
    color: '#007AFF',
    marginBottom: 2,
  },
  historyName: {
    fontSize: 11,
    color: '#CCCCCC',
  },
});
