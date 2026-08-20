/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#080A10",
          card: "#0D1119",
          cardHover: "#121824",
          border: "rgba(34, 230, 184, 0.15)",
          borderHover: "rgba(34, 230, 184, 0.35)",
          accent: "#22E6B8",
          accentGlow: "rgba(34, 230, 184, 0.25)",
          purple: "#7928CA",
          blue: "#0070F3",
          critical: "#FF0055",
          high: "#FF9900",
          medium: "#EAB308",
          low: "#22E6B8",
          text: "#F0F6FC",
          muted: "#8B949E",
          dark: "#05070B"
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        'cyber-glow': '0 0 20px rgba(34, 230, 184, 0.15)',
        'cyber-critical': '0 0 20px rgba(255, 0, 85, 0.25)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      },
      backgroundImage: {
        'cyber-gradient': 'radial-gradient(circle at 50% 0%, rgba(34, 230, 184, 0.08) 0%, rgba(8, 10, 16, 0) 75%)',
        'grid-pattern': 'linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)'
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scanline': 'scanline 8s linear infinite',
        'spin-slow': 'spin 12s linear infinite'
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' }
        }
      }
    },
  },
  plugins: [],
}
