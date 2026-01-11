import localFont from 'next/font/local';

// ============================================================================
// Primary Fonts (used by default)
// ============================================================================

export const inter = localFont({
  src: [
    {
      path: '../public/fonts/Inter/inter-v20-cyrillic_cyrillic-ext_latin_latin-ext-regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/Inter/inter-v20-cyrillic_cyrillic-ext_latin_latin-ext-500.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/Inter/inter-v20-cyrillic_cyrillic-ext_latin_latin-ext-600.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../public/fonts/Inter/inter-v20-cyrillic_cyrillic-ext_latin_latin-ext-700.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-inter',
  display: 'swap',
});

export const plusJakartaSans = localFont({
  src: [
    {
      path: '../public/fonts/PlusJakartaSans/plus-jakarta-sans-v12-cyrillic-ext_latin_latin-ext-regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/PlusJakartaSans/plus-jakarta-sans-v12-cyrillic-ext_latin_latin-ext-500.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/PlusJakartaSans/plus-jakarta-sans-v12-cyrillic-ext_latin_latin-ext-600.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../public/fonts/PlusJakartaSans/plus-jakarta-sans-v12-cyrillic-ext_latin_latin-ext-700.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

// ============================================================================
// Theme Fonts (used based on survey theme settings)
// ============================================================================

export const roboto = localFont({
  src: [
    {
      path: '../public/fonts/Roboto/roboto-v50-latin-regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/Roboto/roboto-v50-latin-500.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/Roboto/roboto-v50-latin-600.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../public/fonts/Roboto/roboto-v50-latin-700.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-roboto',
  display: 'swap',
});

export const openSans = localFont({
  src: [
    {
      path: '../public/fonts/OpenSans/open-sans-v44-cyrillic_cyrillic-ext_latin_latin-ext-regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/OpenSans/open-sans-v44-cyrillic_cyrillic-ext_latin_latin-ext-500.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/OpenSans/open-sans-v44-cyrillic_cyrillic-ext_latin_latin-ext-600.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../public/fonts/OpenSans/open-sans-v44-cyrillic_cyrillic-ext_latin_latin-ext-700.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-open-sans',
  display: 'swap',
});

export const lato = localFont({
  src: [
    {
      path: '../public/fonts/Lato/lato-v25-latin_latin-ext-regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/Lato/lato-v25-latin_latin-ext-700.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-lato',
  display: 'swap',
});

export const montserrat = localFont({
  src: [
    {
      path: '../public/fonts/Montserrat/montserrat-v31-cyrillic_cyrillic-ext_latin_latin-ext-regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/Montserrat/montserrat-v31-cyrillic_cyrillic-ext_latin_latin-ext-500.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/Montserrat/montserrat-v31-cyrillic_cyrillic-ext_latin_latin-ext-600.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../public/fonts/Montserrat/montserrat-v31-cyrillic_cyrillic-ext_latin_latin-ext-700.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-montserrat',
  display: 'swap',
});

export const outfit = localFont({
  src: [
    {
      path: '../public/fonts/Outfit/outfit-v15-latin_latin-ext-regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/Outfit/outfit-v15-latin_latin-ext-500.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/Outfit/outfit-v15-latin_latin-ext-600.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../public/fonts/Outfit/outfit-v15-latin_latin-ext-700.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-outfit',
  display: 'swap',
});

export const dmSans = localFont({
  src: [
    {
      path: '../public/fonts/DMSans/dm-sans-v17-latin_latin-ext-regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/DMSans/dm-sans-v17-latin_latin-ext-500.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/DMSans/dm-sans-v17-latin_latin-ext-600.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../public/fonts/DMSans/dm-sans-v17-latin_latin-ext-700.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-dm-sans',
  display: 'swap',
});

// ============================================================================
// Serif / Display Fonts
// ============================================================================

export const merriweather = localFont({
  src: [
    {
      path: '../public/fonts/Merrieweather/merriweather-v33-cyrillic_cyrillic-ext_latin_latin-ext-regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/Merrieweather/merriweather-v33-cyrillic_cyrillic-ext_latin_latin-ext-700.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-merriweather',
  display: 'swap',
});

export const playfairDisplay = localFont({
  src: [
    {
      path: '../public/fonts/PlayfairDisplay/playfair-display-v40-cyrillic_latin_latin-ext-regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/PlayfairDisplay/playfair-display-v40-cyrillic_latin_latin-ext-500.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/PlayfairDisplay/playfair-display-v40-cyrillic_latin_latin-ext-600.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../public/fonts/PlayfairDisplay/playfair-display-v40-cyrillic_latin_latin-ext-700.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-playfair',
  display: 'swap',
});

// ============================================================================
// Brand Font (Airbnb Cereal - Variable Font)
// ============================================================================

export const cereal = localFont({
  src: [
    {
      path: '../public/fonts/Cereal/CerealVF_W_Wght.woff2',
      style: 'normal',
    },
    {
      path: '../public/fonts/Cereal/CerealVF_Italics_W_Wght.woff2',
      style: 'italic',
    },
  ],
  variable: '--font-cereal',
  display: 'swap',
});

// Combined font class names for body element
export const fontVariables = [
  inter.variable,
  plusJakartaSans.variable,
  roboto.variable,
  openSans.variable,
  lato.variable,
  montserrat.variable,
  outfit.variable,
  dmSans.variable,
  merriweather.variable,
  playfairDisplay.variable,
  cereal.variable,
].join(' ');
