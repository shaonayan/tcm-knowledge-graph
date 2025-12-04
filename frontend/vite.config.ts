import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// ������Ҫ HTML ע��������Ϊ������޷����� node_modules ·��
// ��Ϊ���� pre-init.ts �� graphlib-init.ts ��ȷ����ʼ��

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
      // ȷ�� React ����
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
      // ȷ�� graphlib ����ȷ������dagre ��Ҫ��
      'graphlib': path.resolve(__dirname, './node_modules/graphlib/index.js'),
    },
    dedupe: ['react', 'react-dom'], // ȷ��ֻ��һ�� React ʵ��
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5174',
        changeOrigin: true,
        secure: false
      }
    },
    headers: {
      'Cache-Control': 'no-store'
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 1000, // ��߾�����ֵ��1MB
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
      // ȷ�� dagre ��ȷת��
      requireReturnsDefault: 'auto',
      esmExternals: true,
      // ȷ�� graphlib ����ȷ����
      strictRequires: true,
    },
    rollupOptions: {
      output: {
        // ȷ�� React chunk ���ȼ���
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    },
    // ȷ��publicĿ¼�е��ļ�������
    copyPublicDir: true
  },
  // ȷ����̬��Դ��ȷ����
  publicDir: 'public'
})
