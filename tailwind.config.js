/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'yugen': {
          deep: '#0a192f',
          midnight: '#1a365d',
          mystic: '#4c1d95',
          sakura: '#f472b6',
          gold: '#d4af37',
          moonlight: '#e6fffa',
        }
      },
      fontFamily: {
        'japanese': ['Noto Sans JP', 'sans-serif'],
        'serif-jp': ['Shippori Mincho', 'serif'],
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'ripple': 'ripple 0.6s linear',
        'float': 'float 3s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
