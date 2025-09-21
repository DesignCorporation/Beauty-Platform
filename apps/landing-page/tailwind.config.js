/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(circle at center, var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hero-gradient': 'radial-gradient(circle at center, #06b6d4 0%, #0891b2 50%, #0e7490 100%)',
        'cta-gradient': 'radial-gradient(circle at center, #06b6d4 0%, #0891b2 50%, #0e7490 100%)',
      },
    },
  },
  plugins: [],
  safelist: [
    'bg-gradient-radial',
    'bg-hero-gradient', 
    'bg-cta-gradient',
    'from-cyan-400',
    'to-teal-700',
  ],
}