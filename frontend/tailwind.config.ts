import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'football-primary': '#1a365d',
        'football-secondary': '#2d5a87',
        'football-accent': '#48bb78',
        'football-danger': '#e53e3e',
      },
    },
  },
  plugins: [],
}
export default config
