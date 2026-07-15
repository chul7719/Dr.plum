import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#185FA5",
          light: "#E6F1FB"
        }
      }
    }
  },
  plugins: []
};

export default config;
