import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        pass: '#16a34a',
        fail: '#dc2626',
        warn: '#d97706',
        brand: {
          DEFAULT: '#0f4c8a',
          light: '#1a6bbf',
          dark: '#093568',
        },
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-dm-serif)', 'Georgia', 'serif'],
      },
      fontSize: {
        grade: '8rem',
      },
    },
  },
  plugins: [],
};

export default config;
