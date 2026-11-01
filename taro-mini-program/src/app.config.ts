export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/cart/index',
  ],
  subPackages: [
    {
      root: 'package-product',
      pages: [
        'pages/product-list/index',
        'pages/product-detail/index',
      ],
    },
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'Magento Shop',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#666666',
    selectedColor: '#e93b3d',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/cart/index',
        text: '购物车'
      }
    ]
  }
})
