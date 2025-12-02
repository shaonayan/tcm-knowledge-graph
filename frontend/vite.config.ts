import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// 不再需要 HTML 注入插件，因为浏览器无法解析 node_modules 路径
// 改为依赖 pre-init.ts 和 graphlib-init.ts 来确保初始化

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
      // 确保 graphlib 被正确解析（dagre 需要）
      'graphlib': path.resolve(__dirname, './node_modules/graphlib/index.js'),
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
    },
    // 添加中间件设置缓存控制头部
    middlewareMode: true,
    setupMiddlewares: (middlewares, devServer) => {
      if (devServer) {
        middlewares.use((req, res, next) => {
          // 为HTML文件设置不缓存
          if (req.url.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
          }
          // 为静态资源设置合理的缓存时间
          else if (req.url.match(/\.(js|css|svg|png|jpg|jpeg|gif|ico|woff|woff2|ttf|eot)$/)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
          next();
        });
      }
      return middlewares;
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 1000, // 提高警告阈值到1MB
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
      // 确保 dagre 正确转换
      requireReturnsDefault: 'auto',
      esmExternals: true,
      // 确保 graphlib 被正确解析
      strictRequires: true,
    },
    rollupOptions: {
      output: {
        // 确保 React chunk 最先加载
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        // 确保模块加载顺序：React 必须最先执行
        // 通过设置优先级确保 vendor-react 在其他 chunk 之前
        // 关键：pre-init.ts 必须在 vendor-cytoscape 之前执行
        manualChunks: (id) => {
          // 将 pre-init.ts 和 graphlib-init.ts 以及它们依赖的 graphlib 和 lodash 分离到单独的 chunk
          // 确保这个 chunk 在 vendor-cytoscape 之前加载和执行
          if (id.includes('pre-init') || id.includes('graphlib-init')) {
            return 'vendor-init'  // 创建一个初始化 chunk
          }
          // 将 graphlib 和 lodash 也放入 vendor-init chunk，确保它们在 dagre 之前加载
          if (id.includes('node_modules/graphlib') || id.includes('node_modules/lodash')) {
            return 'vendor-init'
          }
          // 将node_modules中的包分离
          if (id.includes('node_modules')) {
            // 注意：graphlib 和 lodash 已经在上面被分离到 vendor-init chunk
            // React核心库 - 必须最先加载，确保单例
            // 包括 react, react-dom, react-is (rc-util 依赖)
            if (id.includes('react') && !id.includes('react-router') && !id.includes('react-query') && !id.includes('react-refresh')) {
              return 'vendor-react'
            }
            // react-is 必须在 React chunk 中
            if (id.includes('react-is')) {
              return 'vendor-react'
            }
            if (id.includes('react-router')) {
              return 'vendor-react-router'
            }
            // React Query - 依赖 React
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-react-query'
            }
            // rc-util 必须在 React chunk 中，因为它在模块级别访问 React.version
            if (id.includes('rc-util')) {
              return 'vendor-react'
            }
            // @ant-design/cssinjs 和 cssinjs-utils 必须在 React chunk 中，因为它们在模块级别访问 React.createContext
            // 必须放在 antd 检查之前，确保优先级
            if (id.includes('@ant-design/cssinjs')) {
              return 'vendor-react'
            }
            if (id.includes('@ant-design/cssinjs-utils')) {
              return 'vendor-react'
            }
            // 所有 @ant-design 包都应该在 React chunk 中，因为它们可能依赖 cssinjs
            if (id.includes('@ant-design')) {
              return 'vendor-react'
            }
            // Ant Design - 依赖 React、rc-util 和 cssinjs
            // antd 本身也需要在 React chunk 中，因为它导入 cssinjs
            if (id.includes('antd')) {
              return 'vendor-react'
            }
            // Zustand - 可能依赖 React，放在 React 之后
            if (id.includes('zustand')) {
              return 'vendor-zustand'
            }
            // 可视化库 - 进一步拆分
            // 注意：graphlib 和 lodash 不在这里分离，它们需要在主入口文件中（pre-init.ts 需要）
            // 只有 dagre 和 cytoscape 分离到 vendor-cytoscape
            if (id.includes('dagre') && !id.includes('graphlib')) {
              return 'vendor-cytoscape'
            }
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
            // 注意：lodash 不在这里分离，它需要在主入口文件中（pre-init.ts 需要）
            if (id.includes('axios') || id.includes('dayjs') || id.includes('classnames')) {
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
