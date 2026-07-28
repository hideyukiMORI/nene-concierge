import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        environment: 'jsdom',
        // tests/ はツールチェーン健全性ガード（製品ソースではない・#208）。
        include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'tests/**/*.test.ts'],
        // 各テストファイルで describe/it/expect を明示 import する
        globals: false,
    },
})
