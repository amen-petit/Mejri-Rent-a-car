import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#F8F7F7",
          100: "#F1EEEF",
          200: "#E3DEDE",
          300: "#D5CDCE",
          500: "#0A0A0C",
          600: "#2a2728",
          700: "#1d1b1a",
        },
        emerald: {
          50: "#fef3f2",
          100: "#fde7e5",
          200: "#fccfcc",
          300: "#f9a8a1",
          500: "#D4AF37",
          600: "#8b2629",
          700: "#72201f",
        },
        slate: {
          50: "#F2F2F2",
          100: "#F1F3F7",
          200: "#E3E7EF",
          300: "#D5DBE7",
          400: "#B8C2D4",
          500: "#8A93A6",
          600: "#6B7280",
        },
      },
      boxShadow: {
        "soft-xs": "0 1px 2px rgba(10, 16, 46, 0.04)",
        soft: "0 4px 12px rgba(10, 16, 46, 0.08)",
        "soft-md": "0 6px 16px rgba(10, 16, 46, 0.12)",
        "soft-lg": "0 10px 24px rgba(10, 16, 46, 0.16)",
        "soft-xl": "0 16px 32px rgba(10, 16, 46, 0.20)",
      },
      backgroundImage: {
        "gradient-premium": "linear-gradient(135deg, #0A0A0C 0%, #D4AF37 100%)",
        "gradient-navy-to-emerald":
          "linear-gradient(180deg, #0A0A0C 0%, #D4AF37 100%)",
        "gradient-emerald-to-navy":
          "linear-gradient(180deg, #D4AF37 0%, #0A0A0C 100%)",
      },
      fontFamily: {
        heading: ["var(--font-heading)"],
        body: ["var(--font-body)"],
      },
      borderRadius: {
        "3xl": "1.5rem",
      },
      transitionDuration: {
        250: "250ms",
      },
    },
  },
  plugins: [],
};

export default config;
