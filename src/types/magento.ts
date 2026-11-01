/**
 * Magento GraphQL 业务模型
 * 对齐 Magento 2 GraphQL Schema 中的核心类型
 */

/* ---------- 产品相关 ---------- */

export interface Money {
  value: number
  currency: string
}

export interface ProductImage {
  url: string
  label: string | null
}

export interface ProductMediaGalleryEntry {
  url: string
  label: string | null
  position: number
  disabled?: boolean
}

export interface ProductPriceRange {
  minimum_price: {
    regular_price: Money
    final_price: Money
    discount?: { amount_off: number; percent_off: number } | null
  }
}

export interface Product {
  id: number
  name: string
  sku: string
  url_key: string
  url_suffix?: string
  description?: { html: string } | null
  short_description?: { html: string } | null
  image?: ProductImage | null
  small_image?: ProductImage | null
  thumbnail?: ProductImage | null
  media_gallery?: ProductMediaGalleryEntry[]
  price?: Money | null
  price_range?: ProductPriceRange
  special_price?: number | null
  rating_summary?: number
  review_count?: number
  stock_status?: 'IN_STOCK' | 'OUT_OF_STOCK'
  __typename?: string
}

export interface ProductPageInfo {
  current_page: number
  page_size: number
  total_pages: number
}

export interface ProductsResult {
  items: Product[]
  page_info: ProductPageInfo
  total_count: number
}

/* ---------- 分类相关 ---------- */

export interface Category {
  id: number
  name: string
  url_key?: string
  url_path?: string
  product_count?: number
  children?: Category[]
  image?: string | null
}

export interface CategoryTree {
  id: number
  name: string
  children: Category[]
}

/* ---------- 购物车相关 ---------- */

export interface CartItemProduct {
  id: number
  name: string
  sku: string
  url_key?: string
  thumbnail?: { url: string; label: string | null } | null
  price?: Money
}

export interface CartItem {
  id: string
  uid: string
  quantity: number
  product: CartItemProduct
  prices: {
    price: Money
    row_total: Money
    row_total_including_tax: Money
  }
}

export interface CartPrices {
  subtotal_excluding_tax: Money
  subtotal_including_tax?: Money
  grand_total: Money
}

export interface Cart {
  id: string
  email?: string | null
  items: CartItem[]
  total_quantity: number
  prices: CartPrices
}
