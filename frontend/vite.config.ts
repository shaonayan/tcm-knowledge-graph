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
    }
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
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // 将node_modules中的包分离
          if (id.includes('node_modules')) {
            // React核心库
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react'
            }
            // Ant Design
            if (id.includes('antd') || id.includes('@ant-design')) {
              return 'vendor-antd'
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
