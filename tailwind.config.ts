import type { Config } from 'tailwindcss';
const config: Config = { content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'], theme: { extend: { colors: { forest: '#073b35', deepforest: '#052c28', sand: '#f6f3ec', gold: '#c59a50' } } }, plugins: [] };
export default config;
