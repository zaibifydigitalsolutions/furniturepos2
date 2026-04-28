/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1C1917',
          light: '#292524',
        },
        accent: {
          DEFAULT: '#D4A853',
          hover: '#E8BF6A',
        },
        surface: {
          DEFAULT: '#FAFAF9',
          2: '#F5F5F4',
          3: '#E7E5E4',
        },
        border: '#D6D3D1',
        text: {
          primary: '#1C1917',
          secondary: '#78716C',
        },
        success: '#16A34A',
        danger: '#DC2626',
        warning: '#D97706',
        info: '#2563EB',
        sidebar: {
          bg: '#1C1917',
          text: '#E7E5E4',
          active: '#D4A853',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        sans: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        lg: '0.5rem',
        md: 'calc(0.5rem - 2px)',
        sm: 'calc(0.5rem - 4px)',
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
  plugins: [],
}
