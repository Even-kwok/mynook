/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    // 包含根目录下的组件文件
    "./*.{js,ts,jsx,tsx,mdx}", 
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      keyframes: {
        "fade-in-down": {
          "0%": { opacity: "0", transform: "translateY(-20px) translateX(-50%)" },
          "100%": { opacity: "1", transform: "translateY(0) translateX(-50%)" },
        },
        "gradient-pan": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in-down": "fade-in-down 0.5s ease-out forwards",
        "gradient-pan": "gradient-pan 5s linear infinite",
        shimmer: "shimmer 2s infinite",
      },
    },
  },
  plugins: [],
  // 禁用默认的 CSS 重置，避免与现有样式冲突
  corePlugins: {
    preflight: false, 
  }
};
