import { useState, useCallback, useMemo } from 'react'
import { View, Text, Image, ScrollView, RichText } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { productService, cartService } from '@/services'
import type { Product } from '@/types/magento'
import './index.scss'

export default function ProductDetail() {
  const [product, setProduct] = useState<Product | null>(null)
  const [currentImage, setCurrentImage] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  Taro.useLoad((options) => {
    const { urlKey } = options || {}
    if (urlKey) loadProduct(urlKey)
  })

  const loadProduct = useCallback(async (urlKey: string) => {
    setLoading(true)
    try {
      const detail = await productService.getDetail(urlKey)
      setProduct(detail)
      const firstImage = detail?.media_gallery?.find((m) => !m.disabled)
      setCurrentImage(firstImage?.url || detail?.image?.url || '')
    } catch (err) {
      console.warn('product detail failed:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  /** 图片列表 */
  const galleryImages = useMemo(() => {
    if (!product?.media_gallery?.length) {
      return product?.image?.url ? [{ url: product.image.url, label: product.image.label }] : []
    }
    return product.media_gallery.filter((m) => !m.disabled)
  }, [product])

  /** 格式化价格 */
  const finalPrice = product?.price_range?.minimum_price?.final_price
  const regularPrice = product?.price_range?.minimum_price?.regular_price

  /** 加入购物车 */
  const handleAddToCart = async () => {
    if (!product?.sku) return
    setAdding(true)
    try {
      await cartService.add(product.sku, 1)
      Taro.showToast({ title: '已加入购物车', icon: 'success' })
    } catch (err) {
      console.warn('add to cart failed:', err)
    } finally {
      setAdding(false)
    }
  }

  /** 跳转购物车 */
  const goCart = () => {
    Taro.switchTab({ url: '/pages/cart/index' })
  }

  if (loading && !product) {
    return (
      <View style={{ textAlign: 'center', padding: '120rpx' }}>
        <Text>加载中...</Text>
      </View>
    )
  }

  if (!product) {
    return (
      <View style={{ textAlign: 'center', padding: '120rpx' }}>
        <Text>商品不存在</Text>
      </View>
    )
  }

  return (
    <ScrollView className='product-detail' scrollY>
      {/* 主图 */}
      <Image
        className='product-detail__gallery'
        src={currentImage}
        mode='aspectFill'
      />

      {/* 缩略图列表 */}
      {galleryImages.length > 1 && (
        <ScrollView className='product-detail__thumbnails' scrollX>
          {galleryImages.map((img, idx) => (
            <Image
              key={idx}
              className={`thumb ${currentImage === img.url ? 'active' : ''}`}
              src={img.url}
              mode='aspectFill'
              onClick={() => setCurrentImage(img.url)}
            />
          ))}
        </ScrollView>
      )}

      {/* 商品信息 */}
      <View className='product-detail__info'>
        <Text className='name'>{product.name}</Text>
        <View className='price-row'>
          {finalPrice && (
            <Text className='price'>{finalPrice.currency} {finalPrice.value.toFixed(2)}</Text>
          )}
          {regularPrice && finalPrice && regularPrice.value !== finalPrice.value && (
            <Text className='original-price'>{regularPrice.currency} {regularPrice.value.toFixed(2)}</Text>
          )}
        </View>
        {product.stock_status === 'IN_STOCK' && (
          <Text className='stock'>有货</Text>
        )}
        <Text className='sku'>SKU: {product.sku}</Text>
      </View>

      {/* 商品描述 */}
      {product.description?.html && (
        <View className='product-detail__section'>
          <Text className='section-title'>商品详情</Text>
          <View className='description'>
            <RichText nodes={product.description.html} />
          </View>
        </View>
      )}

      {/* 底部操作栏 */}
      <View className='product-detail__bottom-bar'>
        <View className='cart-icon' onClick={goCart}>
          <Text>购物车</Text>
        </View>
        <View className='add-btn' onClick={handleAddToCart}>
          <Text>{adding ? '添加中...' : '加入购物车'}</Text>
        </View>
      </View>
    </ScrollView>
  )
}
