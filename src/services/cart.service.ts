import Taro from '@tarojs/taro'
import { apolloClient } from './graphql/apollo-client'
import {
  ADD_SIMPLE_PRODUCTS_TO_CART,
  CREATE_EMPTY_CART,
  GET_CART,
  REMOVE_ITEM_FROM_CART,
  UPDATE_CART_ITEMS,
} from './graphql/documents/cart.documents'
import type { Cart } from '@/types/magento'

/** 购物车 ID 在本地存储中的 key */
const CART_ID_STORAGE_KEY = 'magento_cart_id'

/* ---------- GraphQL 响应/变量类型 ---------- */

type CreateCartData = { createEmptyCart: string }
type AddToCartData = { addSimpleProductsToCart: { cart: Cart } }
type GetCartData = { cart: Cart }
type UpdateCartData = { updateCartItems: { cart: Cart } }
type RemoveItemData = { removeItemFromCart: { cart: Cart } }

type AddToCartVars = {
  cartId: string
  cartItems: { data: { sku: string; quantity: number }; quantity?: number }[]
}

type UpdateCartVars = {
  cartId: string
  cartItems: { cart_item_id: string; quantity: number }[]
}

type RemoveItemVars = {
  cartId: string
  itemId: number
}

/**
 * 购物车服务
 *
 * 基于 Magento GraphQL 购物车 mutation/query：
 * - createEmptyCart：创建游客购物车，cartId 持久化到本地存储
 * - addSimpleProductsToCart：加入简单商品
 * - cart：查询购物车详情
 * - updateCartItems：修改数量
 * - removeItemFromCart：删除商品
 */
export const cartService = {
  /** 获取或创建购物车 ID */
  async ensureCartId(): Promise<string> {
    let cartId = ''
    try {
      cartId = Taro.getStorageSync(CART_ID_STORAGE_KEY) || ''
    } catch {
      // ignore
    }
    if (!cartId) {
      const result = await apolloClient.mutate<CreateCartData>({
        mutation: CREATE_EMPTY_CART,
        context: { auth: false },
      })
      cartId = result.data!.createEmptyCart
      Taro.setStorageSync(CART_ID_STORAGE_KEY, cartId)
    }
    return cartId
  },

  /** 加入商品到购物车 */
  async add(sku: string, quantity = 1): Promise<Cart> {
    const cartId = await this.ensureCartId()
    const result = await apolloClient.mutate<AddToCartData, AddToCartVars>({
      mutation: ADD_SIMPLE_PRODUCTS_TO_CART,
      variables: {
        cartId,
        cartItems: [{ data: { sku, quantity } }],
      },
      context: { auth: false },
    })
    return result.data!.addSimpleProductsToCart.cart
  },

  /** 获取购物车详情 */
  async get(): Promise<Cart> {
    const cartId = await this.ensureCartId()
    const result = await apolloClient.query<GetCartData, { cartId: string }>({
      query: GET_CART,
      variables: { cartId },
    })
    return result.data!.cart
  },

  /** 更新购物车商品数量 */
  async updateQuantity(itemId: string, quantity: number): Promise<Cart> {
    const cartId = await this.ensureCartId()
    const result = await apolloClient.mutate<UpdateCartData, UpdateCartVars>({
      mutation: UPDATE_CART_ITEMS,
      variables: {
        cartId,
        cartItems: [{ cart_item_id: itemId, quantity }],
      },
      context: { auth: false },
    })
    return result.data!.updateCartItems.cart
  },

  /** 删除购物车商品 */
  async removeItem(itemId: number): Promise<Cart> {
    const cartId = await this.ensureCartId()
    const result = await apolloClient.mutate<RemoveItemData, RemoveItemVars>({
      mutation: REMOVE_ITEM_FROM_CART,
      variables: { cartId, itemId },
      context: { auth: false },
    })
    return result.data!.removeItemFromCart.cart
  },
}
