import { gql } from '@apollo/client'

/**
 * 用户相关 GraphQL 文档
 *
 * 使用 Apollo Client 的 gql 标签，返回 DocumentNode，
 * 直接传给 apolloClient.query / apolloClient.mutate。
 *
 * 可复用字段片段以 fragment 形式抽离，通过 gql 插值注入。
 */

/** 用户公共字段片段 */
export const USER_FIELDS = gql`
  fragment UserFields on User {
    id
    nickname
    avatar
    phone
    createdAt
  }
`

/** 小程序登录：wx.login 的 code 换取 token + 用户信息 */
export const LOGIN = gql`
  mutation Login($code: String!) {
    login(code: $code) {
      token
      user {
        ...UserFields
      }
    }
  }
  ${USER_FIELDS}
`

/** 获取当前登录用户信息 */
export const GET_USER_PROFILE = gql`
  query GetUserProfile {
    me {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`

/** 更新当前用户资料 */
export const UPDATE_USER_PROFILE = gql`
  mutation UpdateUserProfile($input: UpdateUserInput!) {
    updateUser(input: $input) {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`
