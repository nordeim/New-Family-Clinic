// tailwind.config.js
import { fontFamily } from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      // Implementing the design system from Project_Requirements_Document
      colors: {
        primary: {
          DEFAULT: "#FF6B6B", // coral
          light: "#FF9999",
          dark: "#E55555",
        },
        secondary: {
          DEFAULT: "#4ECDC4", // teal
          light: "#87BBA2", // sage
          background: "#F7E7CE", // sand
        },
        neutral: {
          900: "#1A202C", // Text
          700: "#4A5568", // Secondary text
          500: "#A0AEC0", // Disabled
          100: "#F7FAFC", // Backgrounds
        },
        semantic: {
          success: "#48BB78",
          warning: "#F6AD55",
          error: "#F56565",
          info: "#4299E1",
        },
      },
      fontFamily: {
        sans: ["Inter", ...fontFamily.sans],
        heading: ["Inter", ...fontFamily.sans],
      },
      fontSize: {
        base: "18px", // Larger base for readability
      },
    },
  },
  plugins: [],
};
