/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#2B4EFF",
        secondary: "#B8DDE3",
        backbg: "rgba(43, 78, 255, 0.7)",
      },
      screens: {
        md: "800px",
        sm: "639px",
      },
      boxShadow: {
        // Tailwind's small shadows (5% black, 2px) are invisible under white
        // cards on the near-white dashboard canvas, which is why panels read
        // as flat. Two-layer, slate-tinted, still restrained.
        sm: "0 1px 2px 0 rgb(15 23 42 / 0.07), 0 1px 3px 0 rgb(15 23 42 / 0.05)",
        DEFAULT:
          "0 1px 3px 0 rgb(15 23 42 / 0.09), 0 4px 10px -2px rgb(15 23 42 / 0.07)",
        md: "0 2px 4px -1px rgb(15 23 42 / 0.07), 0 8px 18px -4px rgb(15 23 42 / 0.1)",
        shadow1: "0px 30px 40px 0px rgba(1, 11, 60, 0.1)",
        shadow2: "0px 30px 60px 0px rgba(0, 4, 48, 0.3)",
      },
    },
  },
  plugins: [],
};
