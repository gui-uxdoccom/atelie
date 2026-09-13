/** Tokens mirror the Figma variable collection exactly. */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        page:     '#F5EDE3',
        surface:  '#FFFFFF',
        backdrop: '#D9B88F',
        ink:   { 900: '#1F1B16', 600: '#6B6157', 300: '#C9BFB2' },
        coral:    '#E4572E',
        teal:     '#17706E',
        instock:  '#2E7D4F',
      },
      borderRadius: { sm: '8px', md: '14px', lg: '22px' },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        // Inter has no Arabic coverage at all - without this, Arabic falls back
        // to whatever the device happens to have and the page looks broken.
        arabic: ['"IBM Plex Sans Arabic"', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
