/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        determination: ['DeterminationSans', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        determinationMono: ['DeterminationMono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        simpleOlive: ['SimpleOlive', 'DeterminationSans', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        btn: '8px',
        card: '12px',
        modal: '16px',
      },
      boxShadow: {
        admin: '0 10px 15px -3px rgba(0,0,0,0.4), 0 4px 6px -2px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
}
