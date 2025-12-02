import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@types': path.resolve(__dirname, './src/types'),
      // 确保 React 单例
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    },
    dedupe: ['react', 'react-dom'], // 确保只有一个 React 实例
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 1000, // 提高警告阈值到1MB
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // 将node_modules中的包分离
          if (id.includes('node_modules')) {
            // React核心库 - 必须最先加载，确保单例
            if (id.includes('react') && !id.includes('react-dom') && !id.includes('react-router')) {
              return 'vendor-react'
            }
            if (id.includes('react-dom')) {
              return 'vendor-react-dom'
            }
            if (id.includes('react-router')) {
              return 'vendor-react-router'
            }
            // React Query - 依赖 React
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-react-query'
            }
            // Ant Design - 依赖 React
            if (id.includes('antd') || id.includes('@ant-design')) {
              return 'vendor-antd'
            }
            // Zustand - 可能依赖 React，放在 React 之后
            if (id.includes('zustand')) {
              return 'vendor-zustand'
            }
            // 可视化库 - 进一步拆分
            if (id.includes('cytoscape')) {
              return 'vendor-cytoscape'
            }
            if (id.includes('d3')) {
              return 'vendor-d3'
            }
            if (id.includes('echarts') || id.includes('echarts-for-react')) {
              return 'vendor-echarts'
            }
            if (id.includes('three') || id.includes('@react-three')) {
              return 'vendor-three'
            }
            // 其他工具库（不依赖React）
            if (id.includes('axios') || id.includes('lodash') || id.includes('dayjs') || id.includes('classnames')) {
              return 'vendor-utils'
            }
            // 其他第三方库
            return 'vendor-other'
          }
        }
      }
    },
    // 确保public目录中的文件被复制
    copyPublicDir: true
  },
  // 确保静态资源正确加载
  publicDir: 'public'
})
