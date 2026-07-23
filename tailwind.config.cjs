module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        fu: {
          red:       '#8B1A1A',
          'red-dark':'#6B1010',
          'red-light':'#A82020',
          gold:      '#C9A227',
          'gold-light':'#E8C547',
          cream:     '#F5F0EB',
          dark:      '#1A0808',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 12px rgba(139,26,26,0.08), 0 1px 4px rgba(0,0,0,0.06)',
        'card-hover': '0 8px 32px rgba(139,26,26,0.18), 0 2px 8px rgba(0,0,0,0.10)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
