import { defineConfig } from 'vitest/config';
/** 仅运行 game 单测，不引入 @vitejs/plugin-vue，避免与 vite 主版本类型重复。 */
export default defineConfig({
    test: {
        environment: 'node',
        include: ['src/**/*.test.ts'],
    },
});
