import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#f0f4f9",
          100: "#d9e2ec",
          200: "#bcccdc",
          300: "#9fb3c8",
          400: "#829ab1",
          500: "#627d98",
          600: "#486581",
          700: "#334e68",
          800: "#1e3e62",
          900: "#0b192c",
          950: "#060d17",
        },
        gold: {
          50: "#fdfbf7",
          100: "#fbf6ed",
          200: "#f5e8d0",
          300: "#eed5ad",
          400: "#e4be81",
          500: "#d4af37",
          600: "#b89228",
          700: "#916f1c",
          800: "#75571a",
          900: "#604719",
          950: "#372709",
        },
      },
    },
  },
  plugins: [],
};
export default config;
