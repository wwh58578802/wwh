/**
 * 用户域业务模型
 * 与 GraphQL schema 中的 User 类型保持一致
 */

export interface User {
  id: string
  nickname: string
  avatar: string
  phone?: string
  createdAt?: string
}

/** 登录返回 */
export interface LoginResult {
  token: string
  user: User
}

/** 更新资料入参 */
export interface UpdateUserInput {
  nickname?: string
  avatar?: string
  phone?: string
}
