import { useState, useCallback } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { cartService } from '@/services'
import type { Cart, CartItem } from '@/types/magento'
import './index.scss'

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  Taro.useLoad(() => { loadCart() })

  Taro.useDidShow(() => { loadCart() })

  const loadCart = useCallback(async () => {
    setLoading(true)
    try {
      const data = await cartService.get()
      setCart(data)
      // 默认全选
      setSelectedIds(new Set(data.items.map((item) => item.id)))
    } catch (err) {
      console.warn('cart load failed:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  /** 切换选中 */
  const toggleSelect = (itemId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }

  /** 全选/取消全选 */
  const toggleSelectAll = () => {
    if (!cart) return
    if (selectedIds.size === cart.items.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(cart.items.map((item) => item.id)))
    }
  }

  /** 修改数量 */
  const handleQtyChange = async (item: CartItem, delta: number) => {
    const newQty = item.quantity + delta
    if (newQty < 1) return
    try {
      const updated = await cartService.updateQuantity(item.uid, newQty)
      setCart(updated)
    } catch (err) {
      console.warn('update qty failed:', err)
    }
  }

  /** 删除商品 */
  const handleRemove = async (item: CartItem) => {
    const { confirm } = await Taro.showModal({ title: '提示', content: `确定删除「${item.product.name}」？` })
    if (!confirm) return
    try {
      const updated = await cartService.removeItem(Number(item.id))
      setCart(updated)
    } catch (err) {
      console.warn('remove item failed:', err)
    }
  }

  /** 格式化价格 */
  const formatMoney = (m: { value: number; currency: string } | undefined): string => {
    return m ? `${m.currency} ${m.value.toFixed(2)}` : ''
  }

  /** 计算选中商品总价 */
  const selectedTotal = cart?.items
    .filter((item) => selectedIds.has(item.id))
    .reduce((sum, item) => sum + item.prices.row_total.value, 0) ?? 0
  const selectedCurrency = cart?.prices?.grand_total?.currency || ''
  const selectedCount = cart?.items.filter((item) => selectedIds.has(item.id)).length ?? 0

  /** 去首页逛逛 */
  const goHome = () => {
    Taro.switchTab({ url: '/pages/home/index' })
  }

  if (loading && !cart) {
    return (
      <View style={{ textAlign: 'center', padding: '120rpx' }}>
        <Text>加载中...</Text>
      </View>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <View className='cart-page__empty'>
        <Text>🛒</Text>
        <View className='empty-text'><Text>购物车是空的</Text></View>
        <View className='go-shopping' onClick={goHome}><Text>去逛逛</Text></View>
      </View>
    )
  }

  return (
    <ScrollView className='cart-page' scrollY>
      {cart.items.map((item) => (
        <View key={item.id} className='cart-page__item'>
          {/* 选中框 */}
          <View
            className={`checkbox ${selectedIds.has(item.id) ? 'checked' : ''}`}
            onClick={() => toggleSelect(item.id)}
          />
          {/* 商品图片 */}
          <Image
            className='cart-page__product-img'
            src={item.product.thumbnail?.url || ''}
            mode='aspectFill'
          />
          {/* 商品信息 */}
          <View className='cart-page__item-info'>
            <View>
              <Text className='name'>{item.product.name}</Text>
              <Text className='sku'>SKU: {item.product.sku}</Text>
            </View>
            <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text className='price'>{formatMoney(item.prices.price)}</Text>
              {/* 数量控制 */}
              <View className='cart-page__qty-control'>
                <Text className='qty-btn' onClick={() => handleQtyChange(item, -1)}>−</Text>
                <Text className='qty-text'>{item.quantity}</Text>
                <Text className='qty-btn' onClick={() => handleQtyChange(item, 1)}>+</Text>
              </View>
            </View>
            <Text style={{ fontSize: '24rpx', color: '#999' }} onClick={() => handleRemove(item)}>
              删除
            </Text>
          </View>
        </View>
      ))}

      {/* 底部栏 */}
      <View className='cart-page__bottom-bar'>
        <View className='select-all' onClick={toggleSelectAll}>
          <View className={`checkbox ${selectedIds.size === cart.items.length ? 'checked' : ''}`} style={{ marginTop: 0 }} />
          <Text>全选</Text>
        </View>
        <View className='total-section'>
          <Text className='total-label'>合计({selectedCount}件)</Text>
          <Text className='total-price'>{selectedCurrency} {selectedTotal.toFixed(2)}</Text>
        </View>
        <View className='checkout-btn'>
          <Text>去结算</Text>
        </View>
      </View>
    </ScrollView>
  )
}
