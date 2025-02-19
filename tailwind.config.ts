import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
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
      },
    },
  },
  plugins: [],
} satisfies Config;
