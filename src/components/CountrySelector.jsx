import { useNavigate } from 'react-router-dom';
import { COUNTRIES, isCountryEnabled, setStoredCountryCode, showAllCountriesInSelector } from '@/config/country';
import { useActiveCountry } from '@/hooks/useActiveCountry';

const COUNTRY_FLAGS = {
  KR: '🇰🇷',
  US: '🇺🇸',
  JP: '🇯🇵',
};

/**
 * Country selector: KR / US / JP buttons. US state filter dropdown hidden for MVP.
 */
export default function CountrySelector({
  className,
  onStateChange,
}) {
  const navigate = useNavigate();
  const activeCountry = useActiveCountry();

  const handleCountrySelect = (countryCode) => {
    const country = COUNTRIES[countryCode];
    if (!country) return;
    if (countryCode !== 'US') {
      onStateChange?.('');
    } else {
      // DMV MVP — no per-state browse filter in the public selector yet.
      onStateChange?.('');
    }
    setStoredCountryCode(countryCode);
    navigate(country.defaultRoutePrefix);
  };

  const buttonBase =
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200 outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]';

  const activeButtonClass =
    'bg-amber-500 text-white shadow-md hover:shadow-lg border border-amber-600';
  const inactiveButtonClass =
    'bg-white text-gray-800 hover:bg-gray-50 shadow-sm hover:shadow border border-gray-200 hover:border-amber-200';

  const showDisabledMarkets = showAllCountriesInSelector();
  const visibleCountries = Object.values(COUNTRIES).filter(
    (country) => isCountryEnabled(country.countryCode) || showDisabledMarkets
  );

  return (
    <div
      role="group"
      aria-label="Улс сонгох"
      className={className ?? 'flex flex-wrap items-center gap-2'}
    >
      {visibleCountries.map((country) => {
        const enabled = isCountryEnabled(country.countryCode);
        const isActive = activeCountry.countryCode === country.countryCode;

        return (
          <button
            key={country.countryCode}
            type="button"
            aria-pressed={isActive}
            title={!enabled ? 'QA: одоогоор нийтэд нээлттэй бус' : undefined}
            onClick={() => handleCountrySelect(country.countryCode)}
            className={`${buttonBase} ${isActive ? activeButtonClass : inactiveButtonClass}`}
          >
            <span aria-hidden>{COUNTRY_FLAGS[country.countryCode] || ''}</span>
            <span>{country.countryName}{!enabled ? ' (QA)' : ''}</span>
          </button>
        );
      })}
    </div>
  );
}
