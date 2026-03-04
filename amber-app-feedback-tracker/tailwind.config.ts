import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        amber: {
          500: "#F59E0B",
        },
        brand: {
          primary: "#F59E0B",
          dark: "#1F2937",
        },
      },
    },
  },
  plugins: [],
};

export default config;

