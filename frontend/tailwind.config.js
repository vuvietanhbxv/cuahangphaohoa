/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Semantic colors driven by CSS variables — dùng được trong class:
        //   bg-page, text-main, border-card, ...
        page:        "rgb(var(--rgb-page-bg) / <alpha-value>)",
        "page-soft": "rgb(var(--rgb-page-soft) / <alpha-value>)",
        card:        "rgb(var(--rgb-card-bg) / <alpha-value>)",
        "card-strong": "rgb(var(--rgb-card-strong) / <alpha-value>)",
        main:        "rgb(var(--rgb-text-main) / <alpha-value>)",
        muted:       "rgb(var(--rgb-text-muted) / <alpha-value>)",
        soft:        "rgb(var(--rgb-text-soft) / <alpha-value>)",
        line:        "rgb(var(--rgb-border) / <alpha-value>)",
      },
    },
  },
  plugins: [],
};
