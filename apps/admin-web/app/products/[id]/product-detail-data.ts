export interface ProductDetailSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'product-detail-mock'
  id: string
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export async function loadProductDetailSnapshot(id: string): Promise<ProductDetailSnapshot> {
  return {
    deliveryMode: 'mock',
    sourceLabel: 'product-detail-mock',
    id,
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadProductDetailSnapshot -> local E54 snapshot shell',
    businessDataSource: 'products-data mock catalog',
    refreshPath: `loadProductDetailSnapshot(${id})`,
    note: '当前页面以 E54 商品详情壳层承载 mock 明细与刷新证据。',
  }
}
