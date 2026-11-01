import { useState, useCallback, useRef } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { productService } from '@/services'
import type { ProductSort } from '@/services'
import type { Product } from '@/types/magento'
import './index.scss'

const SORT_OPTIONS: { label: string; value: ProductSort }[] = [
  { label: '综合', value: 'position' },
  { label: '名称', value: 'name' },
  { label: '价格', value: 'price' },
]

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [sort, setSort] = useState<ProductSort>('position')
  const [hasMore, setHasMore] = useState(false)
  const pageRef = useRef(1)
  const categoryIdRef = useRef<number | undefined>()
  const searchRef = useRef<string | undefined>()

  Taro.useLoad((options) => {
    const { categoryId, search, title } = options || {}
    if (title) Taro.setNavigationBarTitle({ title: decodeURIComponent(title) })
    categoryIdRef.current = categoryId ? Number(categoryId) : undefined
    searchRef.current = search ? decodeURIComponent(search) : undefined
    pageRef.current = 1
    loadPage(1, sort)
  })

  const loadPage = useCallback(async (page: number, currentSort: ProductSort) => {
    setLoading(true)
    try {
      let result
      if (categoryIdRef.current) {
        result = await productService.getProductsByCategory({
          categoryId: categoryIdRef.current,
          currentPage: page,
          sort: currentSort,
        })
      } else if (searchRef.current) {
        result = await productService.getProducts({
          search: searchRef.current,
          currentPage: page,
          sort: currentSort,
        })
      } else {
        result = await productService.getProducts({
          currentPage: page,
          sort: currentSort,
        })
      }

      if (page === 1) {
        setProducts(result.items)
      } else {
        setProducts((prev) => [...prev, ...result.items])
      }
      setHasMore(result.page_info.current_page < result.page_info.total_pages)
    } catch (err) {
      console.warn('product list failed:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  /** 切换排序 */
  const handleSortChange = (value: ProductSort) => {
    setSort(value)
    pageRef.current = 1
    loadPage(1, value)
  }

  /** 上拉加载更多 */
  const handleScrollToLower = () => {
    if (!loading && hasMore) {
      pageRef.current += 1
      loadPage(pageRef.current, sort)
    }
  }

  /** 跳转产品详情 */
  const goDetail = (product: Product) => {
    Taro.navigateTo({ url: `/package-product/pages/product-detail/index?urlKey=${product.url_key}` })
  }

  /** 格式化价格 */
  const formatPrice = (product: Product): string => {
    const price = product.price_range?.minimum_price?.final_price
    return price ? `${price.currency} ${price.value.toFixed(2)}` : ''
  }

  return (
    <ScrollView className='product-list' scrollY onScrollToLower={handleScrollToLower}>
      {/* 排序栏 */}
      <View className='product-list__sort-bar'>
        {SORT_OPTIONS.map((opt) => (
          <Text
            key={opt.value}
            className={`sort-item ${sort === opt.value ? 'active' : ''}`}
            onClick={() => handleSortChange(opt.value)}
          >
            {opt.label}
          </Text>
        ))}
      </View>

      {/* 商品列表 */}
      {products.length > 0 ? (
        <View className='product-list__grid'>
          {products.map((product) => (
            <View
              key={product.id}
              className='product-list__card'
              onClick={() => goDetail(product)}
            >
              <Image
                src={product.small_image?.url || product.thumbnail?.url || ''}
                mode='aspectFill'
              />
              <View className='product-list__card-info'>
                <Text className='name'>{product.name}</Text>
                <Text className='price'>{formatPrice(product)}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : !loading ? (
        <View className='product-list__empty'><Text>暂无商品</Text></View>
      ) : null}

      {loading && (
        <View className='product-list__loading'><Text>加载中...</Text></View>
      )}
    </ScrollView>
  )
}
