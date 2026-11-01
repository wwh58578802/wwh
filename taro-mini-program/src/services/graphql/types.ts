/**
 * GraphQL 协议层类型定义
 * 迁移到 Apollo Client 后仅保留标准协议类型
 */

/** GraphQL 响应中的错误定位信息 */
export interface GraphQLLocation {
  line: number
  column: number
}

/** GraphQL 标准错误结构（与 GraphQL Spec 对齐） */
export interface GraphQLError {
  message: string
  locations?: GraphQLLocation[]
  path?: Array<string | number>
  extensions?: {
    code?: string
    [key: string]: unknown
  }
}

/** GraphQL HTTP 响应体 */
export interface GraphQLResponse<TData = unknown> {
  data?: TData
  errors?: GraphQLError[]
  extensions?: Record<string, unknown>
}
