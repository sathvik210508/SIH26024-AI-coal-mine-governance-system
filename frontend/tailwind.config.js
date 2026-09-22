/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        mining: {
          950: "#070B11",
          900: "#0B0F17",
          850: "#111827",
          800: "#1A2234",
          750: "#222D42",
          700: "#2D3B54",
          600: "#475569",
          500: "#64748B",
          amber: "#F59E0B",
          gold: "#D97706",
          alert: "#EF4444",
          success: "#10B981",
          info: "#38BDF8"
        }
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"]
      }
    },
  },
  plugins: [],
}
