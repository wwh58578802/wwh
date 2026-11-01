import { useState, useCallback } from 'react'
import { View, Text, Input, Image, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { productService } from '@/services'
import type { Product, Category } from '@/types/magento'
import './index.scss'

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchKey, setSearchKey] = useState('')

  /** 加载首页数据 */
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [featured, cats] = await Promise.all([
        productService.getFeatured(10),
        productService.getCategories(),
      ])
      setProducts(featured.items)
      // 取第一层分类的子分类作为入口
      const rootCats = cats[0]?.children ?? cats
      setCategories(rootCats.slice(0, 10))
    } catch (err) {
      console.warn('home load failed:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // useLoad 替代 onLoad
  Taro.useLoad(() => { loadData() })

  /** 跳转产品列表 */
  const goProductList = (category?: Category) => {
    const params = category
      ? `categoryId=${category.id}&title=${encodeURIComponent(category.name)}`
      : ''
    Taro.navigateTo({ url: `/package-product/pages/product-list/index${params ? '?' + params : ''}` })
  }

  /** 搜索 */
  const goSearch = () => {
    if (!searchKey.trim()) return
    Taro.navigateTo({ url: `/package-product/pages/product-list/index?search=${encodeURIComponent(searchKey)}` })
  }

  /** 跳转产品详情 */
  const goDetail = (product: Product) => {
    Taro.navigateTo({ url: `/package-product/pages/product-detail/index?urlKey=${product.url_key}` })
  }

  /** 格式化价格 */
  const formatPrice = (product: Product): string => {
    const price = product.price_range?.minimum_price?.final_price
    if (!price) return ''
    return `${price.currency} ${price.value.toFixed(2)}`
  }

  const formatOriginalPrice = (product: Product): string => {
    const range = product.price_range?.minimum_price
    if (!range?.regular_price || range.regular_price.value === range.final_price.value) return ''
    return `${range.regular_price.currency} ${range.regular_price.value.toFixed(2)}`
  }

  return (
    <ScrollView className='home' scrollY onScrollToLower={loadData}>
      {/* 搜索栏 */}
      <View className='home__search'>
        <Input
          placeholder='搜索商品'
          value={searchKey}
          onInput={(e) => setSearchKey(e.detail.value)}
          onConfirm={goSearch}
          confirmType='search'
        />
      </View>

      {/* 轮播图 */}
      <Image
        className='home__banner'
        src='https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20e-commerce%20shopping%20banner%20with%20colorful%20products%20and%20sale%20tags%20clean%20design&image_size=landscape_16_9'
        mode='aspectFill'
      />

      {/* 分类入口 */}
      <View className='home__categories'>
        {categories.map((cat) => (
          <View
            key={cat.id}
            className='home__category-item'
            onClick={() => goProductList(cat)}
          >
            <Image
              src={cat.image || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=shopping%20category%20icon%20minimal%20flat%20design&image_size=square_hd'}
              mode='aspectFill'
            />
            <Text>{cat.name}</Text>
          </View>
        ))}
      </View>

      {/* 推荐商品 */}
      <View className='home__section-title'>推荐商品</View>
      <View className='home__product-grid'>
        {products.map((product) => (
          <View
            key={product.id}
            className='home__product-card'
            onClick={() => goDetail(product)}
          >
            <Image
              src={product.small_image?.url || product.thumbnail?.url || ''}
              mode='aspectFill'
            />
            <View className='home__product-info'>
              <Text className='name'>{product.name}</Text>
              <View>
                <Text className='price'>{formatPrice(product)}</Text>
                {formatOriginalPrice(product) && (
                  <Text className='original-price'>{formatOriginalPrice(product)}</Text>
                )}
              </View>
            </View>
          </View>
        ))}
      </View>

      {loading && <View style={{ textAlign: 'center', padding: '40rpx' }}><Text>加载中...</Text></View>}
    </ScrollView>
  )
}
