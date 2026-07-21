import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        atlas: {
          50: "#eef7ff",
          100: "#d9edff",
          500: "#2b7fff",
          600: "#1a63e6",
          700: "#1550b8",
          900: "#0f2f66",
        },
        court: {
          500: "#16a34a",
          600: "#15803d",
        },
      },
    },
  },
  plugins: [],
};

export default config;
