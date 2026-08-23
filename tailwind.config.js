/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{ts,tsx,html}",
    "./src/popup/**/*.{ts,tsx,html}",
    "./src/tabs/**/*.{ts,tsx,html}",
    "./src/block/**/*.{ts,tsx,html}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#080c14",
          card: "#0f172a",
          border: "#1e293b",
          hover: "#1e293b"
        },
        brand: {
          50: "#ecfeff",
          100: "#cffafe",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
          700: "#0e7490"
        },
        accent: {
          purple: "#a855f7",
          amber: "#f59e0b",
          emerald: "#10b981",
          rose: "#f43f5e"
        }
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"]
      }
    }
  },
  plugins: []
};
