/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-base': '#0A0A0C',
        'bg-surface': '#111114',
        'bg-elevated': '#1A1A1F',
        'accent': '#FF4655',
        'accent-orange': '#FF8A00',
        'success': '#00D4AA',
        'text-primary': '#F0F0F5',
        'text-secondary': '#7A7A8C',
        'border-default': 'rgba(255, 255, 255, 0.06)',
        'border-active': 'rgba(255, 70, 85, 0.4)',
      },
      fontFamily: {
        display: ['Rajdhani', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
        scan: 'scan 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        pulseCustom: 'pulseCustom 1.5s infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        scan: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        pulseCustom: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
        }
      }
    },
  },
  plugins: [],
}
