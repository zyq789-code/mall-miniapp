/** 规格维度：如 { name: '颜色', values: ['黑', '白'] } */
export interface SpecGroup {
  name: string
  values: string[]
}
export interface Sku {
  id: string
  attrs: Record<string, string>   // 如 { 颜色: '黑', 内存: '128G' }
  price: number                    // 分
  stock: number
  image?: string
}
export interface Goods {
  id: string; name: string; subtitle: string; cover: string; images: string[]
  price: number; originalPrice: number; categoryId: string
  tags: string[]; sales: number; stock: number; desc: string
  specs: SpecGroup[]               // 规格维度
  skus: Sku[]
  status: 'on' | 'off'
}
export interface Category { id: string; name: string; children: Category[] }
export interface Banner { id: string; image: string; goodsId?: string }
export interface CartItem { goodsId: string; skuId: string; quantity: number; checked: boolean; addedAt: number }
export interface FootprintItem { goodsId: string; time: number }
