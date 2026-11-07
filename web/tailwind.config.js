/** @type {import('tailwindcss').Config} */
// Charte : direction Original Fit + touche beige H MODE. Toutes les valeurs viennent de src/styles/tokens.css (miroir de palette.md).
// Les anciens noms (nacre, sable, bronze, or…) pointent vers les nouveaux rôles le temps de ré-habiller chaque page.
const v = nom => `color-mix(in srgb, var(--${nom}) calc(<alpha-value> * 100%), transparent)`

export default {
  // Survols (hover:, group-hover:) seulement sur pointeur fin : pas d'état « collé » après un toucher en mobile.
  future: { hoverOnlyWhenSupported: true },
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    screens: { xs: '375px', sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px' },
    extend: {
      fontFamily: {
        display: 'var(--police-titre)',
        sans: 'var(--police-texte)',
        mono: 'var(--police-mono)',
        marque: 'var(--police-marque)',
      },
      colors: {
        fond: { DEFAULT: v('fond'), 2: v('fond-2'), 3: v('fond-3') },
        accent: { DEFAULT: v('accent'), doux: v('accent-doux') },
        beige: { DEFAULT: v('beige'), clair: v('beige-clair'), pale: v('beige-pale'), fonce: v('beige-fonce') },
        filigrane: v('filigrane'),
        blanc: v('blanc'),
        danger: v('danger'),
        // Rôles hérités
        nacre: v('fond'),
        neige: v('blanc'),
        sable: { 50: v('fond-2'), 100: v('fond-3'), 200: v('beige'), 300: v('beige-clair'), 400: v('beige-moyen') },
        bronze: { DEFAULT: v('beige-fonce'), fonce: v('beige-tres-fonce'), clair: v('beige-moyen') },
        or: { DEFAULT: v('accent'), clair: v('accent-doux') },
        encre: { DEFAULT: v('encre'), douce: v('encre-douce') },
        gris: { DEFAULT: v('gris'), clair: v('gris-clair') },
        ligne: { DEFAULT: v('ligne'), forte: v('ligne-forte') },
        succes: v('succes'),
        erreur: v('danger'),
        alerte: v('alerte'),
        whatsapp: v('whatsapp'),
      },
      letterSpacing: { label: '0.18em', large: '0.2em', titre: '0.02em' },
      borderRadius: { fin: '2px', doux: '4px', carte: 'var(--rayon-carte)', bloc: 'var(--rayon-bloc)' },
      boxShadow: {
        carte: 'var(--ombre-carte-survol)',
        flottant: 'var(--ombre-flottant)',
        fin: '0 1px 0 var(--ligne)',
        cadre: 'var(--ombre-carte-survol)',
      },
      transitionTimingFunction: { maison: 'var(--courbe-maison)', standard: 'var(--courbe-standard)' },
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
