
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6366f1',
        'primary-dark': '#4f46e5',
        'primary-light': '#818cf8',
        secondary: '#ec4899',
        'secondary-dark': '#db2777',
        accent: '#10b981',
        surface: '#0f0f14',
        'surface-light': '#1a1a24',
        'surface-lighter': '#252532',
        border: '#2d2d3d',
        text: '#f1f1f3',
        'text-muted': '#9ca3af',
        'text-dim': '#6b7280',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      },
    },
  },
  plugins: [],
};
export default config;
