import { defineConfig } from 'tsup'

export default defineConfig({
    entry: ['src/main.ts'],
    format: ['cjs'],
    dts: true,           // генерирует .d.ts
    splitting: false,    // всё в один файл
    bundle: true,
    clean: true,
    minify: true,
    outDir: 'dist',
})