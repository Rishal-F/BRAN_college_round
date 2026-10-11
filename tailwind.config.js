/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#F4F3EE',
          light: '#FAF9F5',
          subtle: '#ECEAE3',
          dark: '#E4E2D8',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          soft: '#FAFAF8',
          card: '#FFFFFF',
          glass: 'rgba(255, 255, 255, 0.78)',
          paleBlue: '#E8EEF4',
        },
        ink: {
          primary: '#142033',
          secondary: '#42516A',
          muted: '#748096',
          faint: '#A0AEC0',
        },
        border: {
          line: '#DDE2E8',
          subtle: '#E8ECEF',
          strong: '#CBD5E1',
        },
        steel: {
          DEFAULT: '#426A91',
          light: '#5B84AC',
          dark: '#305172',
          glow: 'rgba(66, 106, 145, 0.15)',
        },
        deepBlue: {
          DEFAULT: '#263F5B',
          dark: '#1B2C40',
        },
        status: {
          teal: '#267C70',
          tealSoft: '#E6F4F1',
          amber: '#B77B36',
          amberSoft: '#FBF2E6',
          red: '#B94B4B',
          redSoft: '#FCECEC',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Space Mono"', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glass-pill': '0 0 0 1.2px rgba(120, 145, 180, 0.15), 0 2px 10px rgba(20, 32, 51, 0.04), 0 8px 24px rgba(20, 32, 51, 0.06)',
        'glass-card': '0 0 0 1px rgba(255, 255, 255, 0.8), 0 8px 32px rgba(20, 32, 51, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
        'card-subtle': '0 1px 3px rgba(20, 32, 51, 0.04), 0 6px 16px rgba(20, 32, 51, 0.03)',
        'card-hover': '0 8px 24px -4px rgba(20, 32, 51, 0.08), 0 2px 6px -1px rgba(20, 32, 51, 0.04)',
        'cta-glow': '0 10px 24px rgba(20, 32, 51, 0.18)',
      }
    },
  },
  plugins: [],
}
