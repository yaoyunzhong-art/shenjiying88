export interface ProductsPageSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'products-page-mock'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export async function loadProductsPageSnapshot(): Promise<ProductsPageSnapshot> {
  return {
    deliveryMode: 'mock',
    sourceLabel: 'products-page-mock',
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadProductsPageSnapshot -> local E54 snapshot shell',
    businessDataSource: 'legacy client logic preserved under E54 wrapper',
    refreshPath: `loadProductsPageSnapshot(${'root'})`,
    note: '当前页面仍以 legacy 商品工作台交互为主，本轮完成 E54 壳层化与来源态透明化。',
  }
}
