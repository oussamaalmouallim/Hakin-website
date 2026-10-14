/** @type {import('tailwindcss').Config} */
// Charte H MODE : prolonge le site actuel (crème, noir, or, Cormorant) et la maquette Template/hero.png (sable, bronze).
export default {
  // Survols (hover:, group-hover:) seulement sur pointeur fin : pas d'état « collé » après un toucher en mobile.
  future: { hoverOnlyWhenSupported: true },
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    screens: { xs: '375px', sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px' },
    extend: {
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Jost', 'system-ui', 'sans-serif'],
      },
      colors: {
        nacre: '#FBF9F5',
        neige: '#FFFFFF',
        sable: { 50: '#F4EDE3', 100: '#EDE3D5', 200: '#E4D0B7', 300: '#D6C2A8', 400: '#CAB59B' },
        bronze: { DEFAULT: '#836240', fonce: '#5F4831', clair: '#9C8366' },
        or: { DEFAULT: '#C8A96E', clair: '#E8D9B8' },
        encre: { DEFAULT: '#0E0E0D', douce: '#1A1A18' },
        gris: { DEFAULT: '#6F6C66', clair: '#A9A59D' },
        ligne: '#E8E2D8',
        succes: '#5B6B3A',
        erreur: '#9A3B2E',
        alerte: '#A9742A',
        whatsapp: '#25D366',
      },
      letterSpacing: { label: '0.22em', large: '0.32em' },
      borderRadius: { fin: '2px', doux: '4px' },
      boxShadow: {
        carte: '0 30px 60px -40px rgba(14,14,13,0.25)',
        flottant: '0 24px 70px -30px rgba(14,14,13,0.35)',
        fin: '0 1px 0 rgba(14,14,13,0.06)',
        cadre: '0 1px 2px rgba(14,14,13,0.04), 0 22px 44px -30px rgba(14,14,13,0.24)',
      },
      transitionTimingFunction: { maison: 'cubic-bezier(0.16, 1, 0.3, 1)' },
      maxWidth: { site: '1440px' },
      keyframes: {
        defiler: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        descendre: { '0%,100%': { transform: 'translateY(0)', opacity: '0.4' }, '50%': { transform: 'translateY(8px)', opacity: '1' } },
      },
      animation: { defiler: 'defiler 40s linear infinite', descendre: 'descendre 2.4s ease-in-out infinite' },
    },
  },
  plugins: [],
}
