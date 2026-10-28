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
        canvas: "#090A0F",
        surface: "#12141C",
        "surface-elevated": "#181B26",
        "surface-hover": "#1C202E",
        inset: "#0C0E14",
        border: "#1E2230",
        "border-highlight": "#2A3044",
        "border-subtle": "rgba(255, 255, 255, 0.06)",
        
        // Tactical accents
        emerald: {
          DEFAULT: "#10B981",
          glow: "rgba(16, 185, 129, 0.15)",
          border: "rgba(16, 185, 129, 0.35)",
        },
        amber: {
          DEFAULT: "#F59E0B",
          glow: "rgba(245, 158, 11, 0.15)",
          border: "rgba(245, 158, 11, 0.35)",
        },
        crimson: {
          DEFAULT: "#EF4444",
          glow: "rgba(239, 68, 68, 0.15)",
          border: "rgba(239, 68, 68, 0.35)",
        },
        steel: {
          DEFAULT: "#38BDF8",
          glow: "rgba(56, 189, 248, 0.15)",
          border: "rgba(56, 189, 248, 0.35)",
        },

        // Typography scale
        primary: "#F8FAFC",
        secondary: "#94A3B8",
        muted: "#64748B",
        faint: "#475569",
      },
      fontSize: {
        "9": "9px",
        "10": "10px",
        "11": "11px",
        "12": "12px",
        "13": "13px",
        "14": "14px",
        "15": "15px",
        "16": "16px",
        "18": "18px",
        "20": "20px",
        "24": "24px",
        "28": "28px",
      },
      boxShadow: {
        panel: "0 8px 32px rgba(0, 0, 0, 0.65)",
        tactical: "0 0 0 1px rgba(255, 255, 255, 0.06), 0 4px 16px rgba(0, 0, 0, 0.5)",
        "inner-glow": "inset 0 1px 0 rgba(255, 255, 255, 0.08)",
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
        outfit: ["var(--font-jakarta)", "sans-serif"],
      },
      animation: {
        pingSlow: "ping 3s cubic-bezier(0, 0, 0.2, 1) infinite",
        pulseSlow: "pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        ticker: "ticker 0.5s ease-out",
      },
      keyframes: {
        ticker: {
          "0%": { transform: "translateY(-4px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
