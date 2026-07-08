/**
 * Japan (JP) country configuration.
 *
 * Placeholder market for the future multi-country platform. Not wired into
 * any data path yet — listings/cities/currency for JP are not migrated.
 */
export const jp = {
  countryCode: 'JP',
  countryName: 'Япон',
  appName: 'Zarjapan',
  defaultPhoneCode: '+81',
  currency: {
    code: 'JPY',
    symbol: '¥',
    locale: 'ja-JP',
  },
  // App/UI language locale stays Mongolian-language by default; can be
  // switched to 'ja-JP' once JP localization work is scoped.
  locale: 'mn-MN',
  // Placeholder — to be populated when JP listings/cities are introduced.
  cityList: ['Tokyo', 'Osaka', 'Nagoya', 'Yokohama', 'Бусад'],
  addressLabels: {
    city: 'Хот',
    district: 'Дүүрэг',
    address: 'Хаяг',
  },
  defaultRoutePrefix: '/jp',
  marketNavbarTitle: '🇲🇳 ЯПОН ДАХЬ 🇯🇵 МОНГОЛЧУУДЫН ЗАРЫН САЙТ',
  marketFooterTitle: 'Япон дахь Монголчуудын зарын сайт',
  marketSeoBlurb: 'Zarjapan — Япон дахь Монголчуудын зарын сайт.',
};

export default jp;
