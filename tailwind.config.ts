import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        "surface-hover": "var(--color-surface-hover)",
        "surface-border": "var(--color-surface-border)",
        accent: "#e03d2f",
        "accent-hover": "#c4342a",
        "accent-glow": "rgba(224, 61, 47, 0.15)",
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "text-muted": "var(--color-text-muted)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "slide-up": "slideUp 0.5s ease-out forwards",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "progress-fill": "progressFill 0.5s ease-out forwards",
        "spin-slow": "spin 3s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(224, 61, 47, 0.1)" },
          "50%": { boxShadow: "0 0 40px rgba(224, 61, 47, 0.3)" },
        },
        progressFill: {
          "0%": { width: "0%" },
          "100%": { width: "var(--progress-width)" },
        },
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
      },
      backgroundSize: {
        "grid-pattern": "60px 60px",
      },
    },
  },
  plugins: [],
};
export default config;
