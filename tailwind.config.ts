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
          50: "#F7F8FC",
          100: "#EEF2FA",
          200: "#DCE5F7",
          300: "#C4D2EE",
          500: "#1F2430",
          600: "#353B4D",
          700: "#242A37",
        },
        emerald: {
          50: "#F1F5FE",
          100: "#E6EDFC",
          200: "#CCD9F8",
          300: "#AFC3F3",
          500: "#89a9f1",
          600: "#6E88D7",
          700: "#556EBB",
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
        "gradient-premium": "linear-gradient(135deg, #89a9f1 0%, #a66694 100%)",
        "gradient-navy-to-emerald":
          "linear-gradient(180deg, #1F2430 0%, #89a9f1 100%)",
        "gradient-emerald-to-navy":
          "linear-gradient(180deg, #a66694 0%, #1F2430 100%)",
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
