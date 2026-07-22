# TASK-P0-04: H5 支付页 QR 渲染改造（已预准备）

## 文件
`apps/storefront-web/app/h5/payment/[orderId]/page.tsx`

## 改动

### 1. 替换 import
删除：
```typescript
import Image from 'next/image';
```

### 2. 添加 import
```typescript
import { QRCodeDisplay } from '@m5/ui';
```

### 3. 替换二维码渲染区块
找到：
```typescript
{payment.qrCode && payment.status === 'pending' && (
  <H5Card style={{ marginBottom: 16, textAlign: 'center' }}>
    <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 12 }}>
      请使用{getPaymentMethodLabel(selectedMethod)}扫码支付
    </div>
    <div
      style={{
        display: 'inline-block',
        padding: 16,
        background: '#fff',
        borderRadius: 12,
        marginBottom: 12,
      }}
    >
      <Image
        src={payment.qrCode}
        alt="支付二维码"
        width={180}
        height={180}
        unoptimized
      />
    </div>
    <div style={{ fontSize: 12, color: '#64748b' }}>
      打开{getPaymentMethodLabel(selectedMethod)}扫一扫完成支付
    </div>
  </H5Card>
)}
```

替换为：
```typescript
{payment.qrCode && payment.status === 'pending' && (
  <H5Card style={{ marginBottom: 16, textAlign: 'center' }}>
    <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 12 }}>
      请使用{getPaymentMethodLabel(selectedMethod)}扫码支付
    </div>
    <QRCodeDisplay
      value={payment.qrCode}
      type="payment"
      label={`${getPaymentMethodLabel(selectedMethod)}扫码支付`}
      size={180}
    />
    <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
      打开{getPaymentMethodLabel(selectedMethod)}扫一扫完成支付
    </div>
  </H5Card>
)}
```

## 验证
1. `pnpm build`（storefront-web）通过
2. `pnpm lint` 通过
3. 浏览器打开 H5 支付页，二维码显示正常（有 SVG 占位 QR 图案）
4. 无 Image import 残留
