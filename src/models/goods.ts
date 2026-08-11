export interface Sku { id: string; spec: string; price: number; stock: number; image?: string }
export interface Goods {
  id: string; name: string; subtitle: string; cover: string; images: string[]
  price: number; originalPrice: number; categoryId: string
  tags: string[]; sales: number; stock: number; desc: string
  skus: Sku[]; status: 'on' | 'off'
}
export interface Category { id: string; name: string; children: Category[] }
export interface Banner { id: string; image: string; goodsId?: string }
export interface CartItem { goodsId: string; skuId: string; quantity: number; checked: boolean; addedAt: number }
export interface FootprintItem { goodsId: string; time: number }
