import Taro from '@tarojs/taro'
import { ApolloClient, InMemoryCache, from, CombinedGraphQLErrors } from '@apollo/client'
import { HttpLink } from '@apollo/client/link/http'
import { SetContextLink } from '@apollo/client/link/context'
import { ErrorLink } from '@apollo/client/link/error'
import { createTaroLink } from './taro-link'
import type { GraphQLError } from './types'

/** Apollo Client 初始化配置 */
export interface ApolloClientConfig {
  /** GraphQL 服务端点 */
  uri: string
  /** token 在本地存储中的 key */
  tokenStorageKey?: string
  /** 全局默认请求头 */
  defaultHeaders?: Record<string, string>
  /** 超时时间（ms），默认 30000 */
  timeout?: number
  /** 鉴权失效回调（401 / UNAUTHENTICATED） */
  onUnauthorized?: () => void
  /** 全局错误回调 */
  onErrorCallback?: (message: string, errors?: GraphQLError[]) => void
}

/**
 * 创建 Apollo Client（含鉴权 + 错误处理 + Taro 网络传输）
 *
 * Link 链顺序：
 *   authLink → errorLink → taroLink
 *
 * - authLink：从本地存储读取 token，注入 Authorization 头；
 *   通过 context.auth === false 跳过鉴权（如登录接口）
 * - errorLink：统一错误出口，Toast 提示 + 401 鉴权失效处理
 * - taroLink：最终网络传输，基于 Taro.request
 */
export function createApolloClient(config: ApolloClientConfig): ApolloClient {
  const {
    uri,
    tokenStorageKey = 'app_token',
    defaultHeaders = {},
    timeout = 30000,
    onUnauthorized,
    onErrorCallback,
  } = config

  /** 鉴权 Link：注入 Authorization 头 */
  const authLink = new SetContextLink((prevContext, _operation) => {
    const { auth = true } = prevContext as { auth?: boolean }
    if (!auth) return prevContext

    let token = ''
    try {
      token = Taro.getStorageSync(tokenStorageKey) || ''
    } catch {
      // ignore
    }

    return {
      headers: {
        ...prevContext.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  })

  /** 错误处理 Link：Toast + 401 跳转 */
  const errorLink = new ErrorLink(({ error }) => {
    // GraphQL 层错误
    if (CombinedGraphQLErrors.is(error)) {
      const firstError = error.errors[0]
      const message = firstError?.message || 'GraphQL 请求错误'

      if (firstError?.extensions?.code === 'UNAUTHENTICATED') {
        onUnauthorized?.()
      }

      Taro.showToast({ title: message, icon: 'none', duration: 2500 })
      onErrorCallback?.(message, error.errors as GraphQLError[])
      return
    }

    // 网络层错误
    const message = error?.message || '网络异常，请稍后重试'
    Taro.showToast({ title: message, icon: 'none', duration: 2500 })
    onErrorCallback?.(message)
  })

  /** 网络传输 Link：H5 用 HttpLink（原生 fetch），小程序用 TaroLink（Taro.request） */
  const httpLink = process.env.TARO_ENV === 'h5'
    ? new HttpLink({ uri, headers: defaultHeaders })
    : createTaroLink({ uri, headers: defaultHeaders, timeout })

  return new ApolloClient({
    link: from([authLink, errorLink, httpLink]),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: { fetchPolicy: 'cache-and-network' },
      query: { fetchPolicy: 'no-cache' },
      mutate: { fetchPolicy: 'no-cache' },
    },
  })
}

/**
 * 全局单例 Apollo Client
 *
 * 端点与 token key 均来自环境变量：
 * - TARO_APP_GRAPHQL_ENDPOINT
 * - TARO_APP_TOKEN_KEY
 */
export const apolloClient = createApolloClient({
  uri: process.env.TARO_APP_GRAPHQL_ENDPOINT || '',
  tokenStorageKey: process.env.TARO_APP_TOKEN_KEY || 'app_token',
  defaultHeaders: {
    Store: 'default',
  },
  onUnauthorized: () => {
    try {
      Taro.removeStorageSync(process.env.TARO_APP_TOKEN_KEY || 'app_token')
    } catch {
      // ignore
    }
    // TODO: 按实际登录页路径调整，如 Taro.reLaunch({ url: '/pages/login/index' })
  },
})
