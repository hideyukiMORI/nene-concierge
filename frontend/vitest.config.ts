import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        environment: 'jsdom',
        include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
        // 各テストファイルで describe/it/expect を明示 import する
        globals: false,
    },
})
