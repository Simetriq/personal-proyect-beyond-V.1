import tailwindcssAnimate from 'tailwindcss-animate'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    "./index.html",
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
      fontFamily: {
        serif: ['Cinzel', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-gold': '0 0 15px rgba(197, 160, 89, 0.3)',
        'glow-blood': '0 0 15px rgba(138, 3, 3, 0.5)',
        'glow-zeon': '0 0 15px rgba(75, 0, 130, 0.5)',
        'glow-ki': '0 0 15px rgba(0, 229, 255, 0.3)',
        'glass': 'inset 0 0 20px rgba(255, 255, 255, 0.05)',
        'glass-gold': 'inset 0 0 20px rgba(197, 160, 89, 0.1), 0 0 10px rgba(197, 160, 89, 0.2)',
        'inner-gold': 'inset 0 2px 10px rgba(197, 160, 89, 0.2), inset 0 -2px 15px rgba(0, 0, 0, 0.8)',
        'inner-blood': 'inset 0 2px 10px rgba(138, 3, 3, 0.4), inset 0 -2px 15px rgba(0, 0, 0, 0.8)',
        'inner-zeon': 'inset 0 2px 10px rgba(75, 0, 130, 0.4), inset 0 -2px 15px rgba(0, 0, 0, 0.8)',
        'inner-ki': 'inset 0 2px 10px rgba(0, 229, 255, 0.4), inset 0 -2px 15px rgba(0, 0, 0, 0.8)',
        'runic': '0 0 5px rgba(197, 160, 89, 0.5), inset 0 0 5px rgba(197, 160, 89, 0.5)',
      },
      colors: {
        anima: {
          dark: '#0B0A0F',
          gold: '#C5A059',
          goldglow: '#F2D27A',
          blood: '#8A0303',
          zeon: '#4B0082',
          ki: '#00E5FF',
          panel: 'rgba(15, 15, 20, 0.85)'
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
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
  plugins: [tailwindcssAnimate],
}
