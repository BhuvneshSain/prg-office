/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'serif-display': ["'DM Serif Display'", "'Iowan Old Style'", 'Georgia', 'serif'],
        'serif-body': ["'DM Serif Text'", "'Iowan Old Style'", 'Georgia', 'serif'],
        'mono': ["'IBM Plex Mono'", 'ui-monospace', 'monospace'],
      },
      colors: {
        paper: '#f4ede0',
        panel: '#f9f3e7',
        ink: '#1f1c14',
        muted: '#7a7264',
        rule: '#d6cdb6',
        accent: '#c14a2b',
        good: '#406b3a',
        bad: '#b6422f',
      },
    },
  },
  plugins: [],
}
