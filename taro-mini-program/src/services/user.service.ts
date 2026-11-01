import Taro from '@tarojs/taro'
import type { LoginResult, UpdateUserInput, User } from '@/types/user'
import { apolloClient } from './graphql/apollo-client'
import {
  GET_USER_PROFILE,
  LOGIN,
  UPDATE_USER_PROFILE,
} from './graphql/documents/user.documents'

/**
 * 用户服务
 *
 * 基于 Apollo Client 的 query / mutate 调用 GraphQL 接口。
 * 业务侧只面向该 service 编程：
 * - 入参/出参均为业务模型，不感知 GraphQL 文档与响应解包；
 * - 登录态写入、错误提示等横切逻辑由 Apollo Link 链统一处理。
 */
export const userService = {
  /**
   * 小程序登录：
   * 1. Taro.login 获取临时 code
   * 2. code 通过 GraphQL mutation 换取 token
   * 3. token 持久化到本地存储，后续请求自动携带
   *
   * context.auth = false 跳过鉴权头注入（登录前无 token）
   */
  async login(): Promise<User> {
    const { code } = await Taro.login()
    const result = await apolloClient.mutate<{ login: LoginResult }, { code: string }>({
      mutation: LOGIN,
      variables: { code },
      context: { auth: false },
    })
    const { token, user } = result.data!.login
    Taro.setStorageSync(process.env.TARO_APP_TOKEN_KEY || 'app_token', token)
    return user
  },

  /** 获取当前登录用户信息 */
  async getProfile(): Promise<User> {
    const result = await apolloClient.query<{ me: User }>({
      query: GET_USER_PROFILE,
    })
    return result.data!.me
  },

  /** 更新当前用户资料 */
  async updateProfile(input: UpdateUserInput): Promise<User> {
    const result = await apolloClient.mutate<{ updateUser: User }, { input: UpdateUserInput }>({
      mutation: UPDATE_USER_PROFILE,
      variables: { input },
    })
    return result.data!.updateUser
  },
}
