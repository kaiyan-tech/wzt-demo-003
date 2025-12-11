import react from '@vitejs/plugin-react';
import path from 'path';
import type { UserConfig as ViteUserConfig } from 'vite';
import type { UserConfig as VitestUserConfig } from 'vitest/config';

const rawBasePath = process.env.VITE_BASE_PATH || '/';
const normalizeBase = (base: string) => {
  if (!base.startsWith('/')) return `/${base}`;
  return base.endsWith('/') ? base : `${base}/`;
};
const base = normalizeBase(rawBasePath);

type ExtendedConfig = ViteUserConfig & { test?: VitestUserConfig['test'] };

const config: ExtendedConfig = {
  plugins: [react()],
  base,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // 开发环境 API 代理到本地后端
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    globals: true,
  },
  build: {
    // 启用文件名 Hash，参考《开沿核心技术宪章》4.1 节
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
      },
    },
  },
};

export default config;
