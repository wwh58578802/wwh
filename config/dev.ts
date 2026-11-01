import type { UserConfigExport } from "@tarojs/cli"

export default {
   logger: {
    quiet: false,
    stats: true
  },
  mini: {},
  h5: {
    devServer: {
      proxy: {
        '/graphql': {
          target: 'https://venia.magento.com',
          changeOrigin: true,
          secure: true,
        }
      }
    }
  }
} satisfies UserConfigExport;
