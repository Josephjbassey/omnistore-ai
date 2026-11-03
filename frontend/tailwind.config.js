/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: "#06080b",
          900: "#090b0e",
          850: "#0d1117",
          800: "#111620",
          750: "#161c28",
          700: "#1c2434",
          600: "#273349",
        },
        emerald: {
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          900: "#064e3b",
          950: "#022c22",
        },
        purple: {
          400: "#c084fc",
          500: "#a855f7",
          600: "#9333ea",
          700: "#7e22ce",
          900: "#3b0764",
          950: "#2e1065",
        },
        sam: {
          cyan: "#38bdf8",
          dark: "#0369a1",
          glow: "rgba(56, 189, 248, 0.35)",
        },
        spark: {
          gold: "#f59e0b",
          amber: "#d97706",
          glow: "rgba(245, 158, 11, 0.35)",
        },
        jenna: {
          dark: "#090b0e",
          panel: "#0e131d",
          surface: "#141a27",
          border: "#1e2738",
          cyan: "#38bdf8",
          purple: "#a855f7",
          accent: "#10b981",
        },
      },
      fontFamily: {
        sans: [
          "Geist Sans",
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "Geist Mono",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },
      boxShadow: {
        "glow-emerald": "0 0 25px -4px rgba(16, 185, 129, 0.35)",
        "glow-purple": "0 0 25px -4px rgba(168, 85, 247, 0.35)",
        "glow-cyan": "0 0 25px -4px rgba(56, 189, 248, 0.35)",
        "glow-radial-emerald": "radial-gradient(circle at center, rgba(16, 185, 129, 0.25) 0%, transparent 70%)",
        "card-elevation": "0 10px 30px -10px rgba(0, 0, 0, 0.5)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-subtle": "pulseSubtle 2.5s ease-in-out infinite",
        "radar-sweep": "radar 4s linear infinite",
        shimmer: "shimmer 2.5s linear infinite",
      },
      keyframes: {
        pulseSubtle: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.6", transform: "scale(0.97)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
