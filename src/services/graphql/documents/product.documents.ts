import { gql } from '@apollo/client'

/**
 * Magento 产品相关 GraphQL 文档
 * 对齐 Magento 2.4.x GraphQL Schema
 */

/** 产品列表/详情共用的字段片段 */
export const PRODUCT_FIELDS = gql`
  fragment ProductFields on ProductInterface {
    id
    name
    sku
    url_key
    url_suffix
    image { url label }
    small_image { url label }
    thumbnail { url label }
    price_range {
      minimum_price {
        regular_price { value currency }
        final_price { value currency }
        discount { amount_off percent_off }
      }
    }
    stock_status
    rating_summary
    review_count
  }
`

/** 产品详情扩展字段（含描述、媒体图集等） */
export const PRODUCT_DETAIL_FIELDS = gql`
  fragment ProductDetailFields on ProductInterface {
    ...ProductFields
    description { html }
    short_description { html }
    media_gallery { url label position disabled }
    special_price
  }
  ${PRODUCT_FIELDS}
`

/** 产品列表查询 */
export const GET_PRODUCTS = gql`
  query GetProducts(
    $search: String
    $filter: ProductAttributeFilterInput
    $pageSize: Int = 20
    $currentPage: Int = 1
    $sort: ProductAttributeSortInput
  ) {
    products(
      search: $search
      filter: $filter
      pageSize: $pageSize
      currentPage: $currentPage
      sort: $sort
    ) {
      items { ...ProductFields }
      page_info { current_page page_size total_pages }
      total_count
    }
  }
  ${PRODUCT_FIELDS}
`

/** 产品详情查询（按 URL key） */
export const GET_PRODUCT_DETAIL = gql`
  query GetProductDetail($urlKey: String!) {
    products(filter: { url_key: { eq: $urlKey } }) {
      items { ...ProductDetailFields }
    }
  }
  ${PRODUCT_DETAIL_FIELDS}
`

/** 分类目录树 */
export const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      items {
        id
        name
        url_key
        url_path
        product_count
        image
        children {
          id
          name
          url_key
          url_path
          product_count
          image
          children_count
        }
      }
    }
  }
`

/** 按分类获取产品列表 */
export const GET_PRODUCTS_BY_CATEGORY = gql`
  query GetProductsByCategory(
    $categoryId: String!
    $pageSize: Int = 20
    $currentPage: Int = 1
    $sort: ProductAttributeSortInput
  ) {
    products(
      filter: { category_id: { eq: $categoryId } }
      pageSize: $pageSize
      currentPage: $currentPage
      sort: $sort
    ) {
      items { ...ProductFields }
      page_info { current_page page_size total_pages }
      total_count
    }
  }
  ${PRODUCT_FIELDS}
`

/** 首页推荐商品（按默认分类 2 即根分类过滤，Magento 要求 search 或 filter 至少传一个） */
export const GET_FEATURED_PRODUCTS = gql`
  query GetFeaturedProducts($pageSize: Int = 10) {
    products(
      filter: { category_id: { eq: "2" } }
      pageSize: $pageSize
      sort: { position: ASC }
    ) {
      items { ...ProductFields }
      page_info { current_page page_size total_pages }
      total_count
    }
  }
  ${PRODUCT_FIELDS}
`
