import { gql } from '@apollo/client'

/**
 * Magento 购物车相关 GraphQL 文档
 * 对齐 Magento 2.4.x GraphQL Schema
 */

/** 购物车商品字段片段 */
export const CART_ITEM_FIELDS = gql`
  fragment CartItemFields on CartItemInterface {
    id
    uid
    quantity
    product {
      id
      name
      sku
      url_key
      thumbnail { url label }
      price { value currency }
    }
    prices {
      price { value currency }
      row_total { value currency }
      row_total_including_tax { value currency }
    }
  }
`

/** 购物车字段片段 */
export const CART_FIELDS = gql`
  fragment CartFields on Cart {
    id
    email
    total_quantity
    items { ...CartItemFields }
    prices {
      subtotal_excluding_tax { value currency }
      subtotal_including_tax { value currency }
      grand_total { value currency }
    }
  }
  ${CART_ITEM_FIELDS}
`

/** 创建空购物车（游客模式） */
export const CREATE_EMPTY_CART = gql`
  mutation CreateEmptyCart {
    createEmptyCart
  }
`

/** 加入简单商品到购物车 */
export const ADD_SIMPLE_PRODUCTS_TO_CART = gql`
  mutation AddSimpleProductsToCart(
    $cartId: String!
    $cartItems: [CartItemInput!]!
  ) {
    addSimpleProductsToCart(
      input: { cart_id: $cartId, cart_items: $cartItems }
    ) {
      cart { ...CartFields }
    }
  }
  ${CART_FIELDS}
`

/** 获取购物车详情 */
export const GET_CART = gql`
  query GetCart($cartId: String!) {
    cart(cart_id: $cartId) {
      ...CartFields
    }
  }
  ${CART_FIELDS}
`

/** 更新购物车商品数量 */
export const UPDATE_CART_ITEMS = gql`
  mutation UpdateCartItems(
    $cartId: String!
    $cartItems: [CartItemUpdateInput!]!
  ) {
    updateCartItems(
      input: { cart_id: $cartId, cart_items: $cartItems }
    ) {
      cart { ...CartFields }
    }
  }
  ${CART_FIELDS}
`

/** 删除购物车商品 */
export const REMOVE_ITEM_FROM_CART = gql`
  mutation RemoveItemFromCart(
    $cartId: String!
    $itemId: Int!
  ) {
    removeItemFromCart(
      input: { cart_id: $cartId, cart_item_id: $itemId }
    ) {
      cart { ...CartFields }
    }
  }
  ${CART_FIELDS}
`
