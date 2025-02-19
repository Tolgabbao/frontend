import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        error: 'var(--error)',
        warning: 'var(--warning)',
        info: 'var(--info)',
        success: 'var(--success)',
        'light-gray': 'var(--light-gray)',
        'medium-gray': 'var(--medium-gray)',
        'dark-gray': 'var(--dark-gray)',
        'message-out': 'var(--message-out)',
        'message-in': 'var(--message-in)',
        accent: 'var(--accent)',
        highlight: 'var(--highlight)',
        attention: 'var(--attention)',
        border: "var(--medium-gray)",
        input: "var(--light-gray)",
        ring: "var(--primary)",
        muted: {
          DEFAULT: "var(--light-gray)",
          foreground: "var(--dark-gray)",
        },
        destructive: {
          DEFAULT: "var(--error)",
          foreground: "var(--background)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
