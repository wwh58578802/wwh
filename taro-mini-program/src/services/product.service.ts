import type { Category, Product, ProductsResult } from '@/types/magento'
import { apolloClient } from './graphql/apollo-client'
import {
  GET_FEATURED_PRODUCTS,
  GET_PRODUCTS,
  GET_PRODUCTS_BY_CATEGORY,
  GET_PRODUCT_DETAIL,
  GET_CATEGORIES,
} from './graphql/documents/product.documents'

/** 产品列表排序方式 */
export type ProductSort = 'position' | 'name' | 'price'

/* ---------- GraphQL 响应/变量类型 ---------- */

type ProductsData = { products: ProductsResult }
type ProductDetailData = { products: { items: Product[] } }
type CategoriesData = { categories: { items: Category[] } }

type ProductsVars = {
  search?: string
  filter?: { category_id?: { eq: string } }
  pageSize?: number
  currentPage?: number
  sort?: Record<string, string>
}

type CategoryProductsVars = {
  categoryId: string
  pageSize?: number
  currentPage?: number
  sort?: Record<string, string>
}

/** 排序字段映射 */
function mapSort(sort: ProductSort): Record<string, string> {
  switch (sort) {
    case 'name': return { name: 'ASC' }
    case 'price': return { price: 'ASC' }
    default: return { position: 'ASC' }
  }
}

/**
 * 产品服务
 *
 * 封装 Magento GraphQL 产品查询：
 * - 首页推荐商品
 * - 搜索/筛选产品列表（分页）
 * - 分类产品列表（分页）
 * - 产品详情
 * - 分类目录树
 */
export const productService = {
  /** 获取首页推荐商品 */
  async getFeatured(pageSize = 10): Promise<ProductsResult> {
    const result = await apolloClient.query<ProductsData>({
      query: GET_FEATURED_PRODUCTS,
      variables: { pageSize },
    })
    return result.data!.products
  },

  /** 搜索/筛选产品列表（无 search 时回退到默认分类过滤） */
  async getProducts(params: {
    search?: string
    pageSize?: number
    currentPage?: number
    sort?: ProductSort
  }): Promise<ProductsResult> {
    const { search, pageSize = 20, currentPage = 1, sort = 'position' } = params
    // Magento 要求 products 查询必须带 search 或 filter，无搜索时回退到默认分类
    const fallbackFilter = search ? {} : { filter: { category_id: { eq: '2' } } }
    const result = await apolloClient.query<ProductsData, ProductsVars>({
      query: GET_PRODUCTS,
      variables: { search, pageSize, currentPage, sort: mapSort(sort), ...fallbackFilter },
    })
    return result.data!.products
  },

  /** 按分类获取产品列表 */
  async getProductsByCategory(params: {
    categoryId: number | string
    pageSize?: number
    currentPage?: number
    sort?: ProductSort
  }): Promise<ProductsResult> {
    const { categoryId, pageSize = 20, currentPage = 1, sort = 'position' } = params
    const result = await apolloClient.query<ProductsData, CategoryProductsVars>({
      query: GET_PRODUCTS_BY_CATEGORY,
      variables: { categoryId: String(categoryId), pageSize, currentPage, sort: mapSort(sort) },
    })
    return result.data!.products
  },

  /** 获取产品详情（按 URL key） */
  async getDetail(urlKey: string): Promise<Product | null> {
    const result = await apolloClient.query<ProductDetailData>({
      query: GET_PRODUCT_DETAIL,
      variables: { urlKey },
    })
    return result.data!.products.items[0] ?? null
  },

  /** 获取分类目录树 */
  async getCategories(): Promise<Category[]> {
    const result = await apolloClient.query<CategoriesData>({
      query: GET_CATEGORIES,
    })
    return result.data!.categories.items
  },
}
