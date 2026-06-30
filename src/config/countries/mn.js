/**
 * Mongolia (MN) country configuration.
 *
 * Placeholder market for the future multi-country platform. Not wired into
 * any data path yet — listings/cities/currency for MN are not migrated.
 */
export const mn = {
  countryCode: 'MN',
  countryName: 'Монгол',
  appName: 'Zarmongolia',
  defaultPhoneCode: '+976',
  currency: {
    code: 'MNT',
    symbol: '₮',
    locale: 'mn-MN',
  },
  locale: 'mn-MN',
  // Placeholder — to be populated when MN listings/cities are introduced.
  cityList: ['Улаанбаатар', 'Дархан', 'Эрдэнэт', 'Чойбалсан', 'Бусад'],
  addressLabels: {
    city: 'Хот/Аймаг',
    district: 'Сум/Дүүрэг',
    address: 'Хаяг',
  },
  defaultRoutePrefix: '/mn',
};

export default mn;
