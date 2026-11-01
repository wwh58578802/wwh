/**
 * service 层统一出口
 *
 * 使用方式：
 *   import { productService, cartService, apolloClient, gql } from '@/services'
 */

// GraphQL 基础设施（Apollo Client v4）
export { gql } from '@apollo/client'
export { apolloClient, createApolloClient } from './graphql/apollo-client'
export type { ApolloClientConfig } from './graphql/apollo-client'
export { createTaroLink } from './graphql/taro-link'
export type { TaroLinkConfig } from './graphql/taro-link'
export type { GraphQLError, GraphQLResponse } from './graphql/types'

// 业务服务
export { userService } from './user.service'
export { productService } from './product.service'
export type { ProductSort } from './product.service'
export { cartService } from './cart.service'
