import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: ['esm'],
  target: 'node18',
  platform: 'node',
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: process.env.NODE_ENV === 'production',
  dts: true,
  external: [
    // Mark these as external to avoid bundling
  ],
  env: {
    NODE_ENV: process.env.NODE_ENV || 'development'
  }
})
