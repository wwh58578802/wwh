import Taro from '@tarojs/taro'
import { ApolloLink, type FetchResult, type Operation } from '@apollo/client'
import { from } from 'rxjs'
import { print } from 'graphql'
import type { GraphQLResponse } from './types'

/** Taro Link 初始化配置 */
export interface TaroLinkConfig {
  /** GraphQL 服务端点 */
  uri: string
  /** 全局默认请求头 */
  headers?: Record<string, string>
  /** 超时时间（ms），默认 30000 */
  timeout?: number
}

/**
 * 基于 Taro.request 的自定义 ApolloLink
 *
 * Apollo Client v4 默认的 HttpLink 依赖浏览器 fetch API，
 * 小程序环境无 fetch，故通过 Taro.request 实现：
 * 1. 从 operation 取出 DocumentNode，用 graphql print 序列化为字符串；
 * 2. 通过 Taro.request 发起 POST 请求；
 * 3. 用 rxjs from(Promise) 转为 Observable<FetchResult>，符合 Apollo Link 协议。
 *
 * 鉴权头、错误提示等逻辑由 apollo-client.ts 中的 link 链处理，
 * 此 link 仅负责网络传输，保持单一职责。
 */
export function createTaroLink(config: TaroLinkConfig): ApolloLink {
  const { uri, headers = {}, timeout = 30000 } = config

  return new ApolloLink((operation: Operation) => {
    const context = operation.getContext()
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...headers,
      ...context.headers,
    }

    return from(
      new Promise<FetchResult>((resolve, reject) => {
        Taro.request<GraphQLResponse>({
          url: uri,
          method: 'POST',
          data: {
            query: print(operation.query),
            variables: operation.variables,
            operationName: operation.operationName,
          },
          header: requestHeaders,
          timeout: context.timeout ?? timeout,
          dataType: 'json',
          success(res) {
            const { statusCode, data: rawData } = res

            if (statusCode < 200 || statusCode >= 300) {
              reject(new Error(`HTTP ${statusCode}`))
              return
            }

            // H5 模式下 Taro.request 可能返回 string，需手动解析
            const body =
              typeof rawData === 'string' ? JSON.parse(rawData) : (rawData ?? {})

            resolve({
              data: body.data ?? null,
              errors: body.errors as FetchResult['errors'] | undefined,
              extensions: body.extensions,
            })
          },
          fail(err) {
            reject(new Error(err.errMsg || '网络异常，请稍后重试'))
          },
        })
      })
    )
  })
}
