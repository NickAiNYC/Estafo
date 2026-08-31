import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#0c0c10",
        surface: "#16161b",
        "surface-hover": "#1d1d24",
        inset: "#0f0f14",
        primary: "#f2f2f0",
        secondary: "#b6b8bf",
        muted: "#7d7f88",
        amber: "#d4a959",
        "steel-blue": "#5ea5d8",
        sage: "#5fbf97",
        gold: "#f2c744",
        red: "#e06c6c",
        border: "rgba(255,255,255,0.07)",
        "border-hover": "rgba(255,255,255,0.16)",
      },
      fontSize: {
        "11": "11px",
        "12.5": "12.5px",
        "14": "14px",
        "15": "15px",
        "18": "18px",
        "22": "22px",
        "26": "26px",
      },
      spacing: {
        "4": "4px",
        "8": "8px",
        "12": "12px",
        "16": "16px",
        "24": "24px",
        "32": "32px",
        "48": "48px",
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "14px",
      },
      boxShadow: {
        panel: "0 4px 12px rgba(0,0,0,0.35)",
      },
      fontFamily: {
        outfit: ["var(--font-outfit)"],
        jakarta: ["var(--font-jakarta)"],
        mono: ["var(--font-mono)"],
      },
      transitionDuration: {
        DEFAULT: "150ms",
        "map-fly": "1800ms",
      },
      animation: {
        pulseSlow: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: ".5" },
        },
      }
    },
  },
  plugins: [],
};
export default config;
