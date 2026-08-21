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
          bg: "#0B0C10",
          card: "#14161C",
          cardHover: "#1A1D25",
          border: "rgba(255,255,255,0.08)",
          borderHover: "rgba(255,255,255,0.16)",
          accent: "#5B8DEF",
          accentStrong: "#7DA2F5",
          accentGlow: "rgba(91,141,239,0.18)",
          critical: "#F85149",
          high: "#D2822F",
          medium: "#D2C022",
          low: "#3FB950",
          text: "#E7E9EE",
          muted: "#8891A3",
          faint: "#5B6272",
          dark: "#05060A"
        }
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
