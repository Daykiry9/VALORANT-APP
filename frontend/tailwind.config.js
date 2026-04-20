/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
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

        // Role colors
        'role-duelist': '#FF4655',
        'role-sentinel': '#00D4AA',
        'role-controller': '#B57EFF',
        'role-initiator': '#FFB038',
        'role-flex': '#7A7A8C',

        // Result states
        'win': '#00D4AA',
        'loss': '#FF4655',
        'draw': '#FFB038',

        // Tier tokens
        'tier-t1': '#FFD24D',
        'tier-t2': '#D0D0E0',
        'tier-t3': '#A36A3E',
        'tier-t4': '#6B6B7E',
      },
      fontFamily: {
        display: ['Rajdhani', 'sans-serif'],
        body: ['DM Sans', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
        scan: 'scan 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        pulseCustom: 'pulseCustom 1.5s infinite',
        'fade-in': 'fadeIn 0.24s ease-out both',
        'slide-up': 'slideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1) both',
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
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        slideUp: {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'glow-accent': '0 0 40px rgba(255, 70, 85, 0.25)',
        'glow-success': '0 0 40px rgba(0, 212, 170, 0.25)',
        'card': '0 1px 0 rgba(255,255,255,0.04), 0 12px 24px -12px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
};
