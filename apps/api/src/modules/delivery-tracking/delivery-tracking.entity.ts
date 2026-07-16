// ── Delivery Tracking Entities ──

export enum DeliveryStatus {
  Pending = 'PENDING',
  PickedUp = 'PICKED_UP',
  InTransit = 'IN_TRANSIT',
  Arrived = 'ARRIVED',
  Delivered = 'DELIVERED',
  Failed = 'FAILED',
}

export enum DeliveryMethod {
  SelfPickup = 'SELF_PICKUP',
  Courier = 'COURIER',
  Express = 'EXPRESS',
  ThirdParty = 'THIRD_PARTY',
}

export interface DeliveryRecord {
  id: string
  deliveryNo: string
  orderNo: string
  method: DeliveryMethod
  status: DeliveryStatus
  carrier: string
  trackingNo: string
  sender: string
  receiver: string
  receiverPhone: string
  receiverAddress: string
  estimatedAt: string
  deliveredAt?: string
  remark?: string
  tenantId: string
  createdAt: string
}

export interface DeliveryEvent {
  id: string
  deliveryId: string
  status: DeliveryStatus
  location: string
  description: string
  timestamp: string
}
