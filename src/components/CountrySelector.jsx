import { useNavigate } from 'react-router-dom';
import { ChevronDown, Check } from 'lucide-react';
import { COUNTRIES, isCountryEnabled, setStoredCountryCode, showAllCountriesInSelector } from '@/config/country';
import { useActiveCountry } from '@/hooks/useActiveCountry';
import { US_STATE_CODES, formatUsStateLabel } from '@/constants/usStates';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const COUNTRY_FLAGS = {
  KR: '🇰🇷',
  US: '🇺🇸',
  JP: '🇯🇵',
};

/**
 * Country selector: KR/JP as buttons; US opens a state dropdown.
 * Selecting a state navigates to `/us` and optionally updates the parent filter.
 */
export default function CountrySelector({
  className,
  selectedStateCode = '',
  onStateChange,
}) {
  const navigate = useNavigate();
  const activeCountry = useActiveCountry();
  const isUsActive = activeCountry.countryCode === 'US';

  const handleCountrySelect = (countryCode) => {
    const country = COUNTRIES[countryCode];
    if (!country) return;
    if (countryCode !== 'US') {
      onStateChange?.('');
    }
    setStoredCountryCode(countryCode);
    navigate(country.defaultRoutePrefix);
  };

  const handleUsStateSelect = (stateCode) => {
    setStoredCountryCode('US');
    if (!isUsActive) {
      navigate(COUNTRIES.US.defaultRoutePrefix);
    }
    onStateChange?.(stateCode);
  };

  const handleUsAllStates = () => {
    setStoredCountryCode('US');
    if (!isUsActive) {
      navigate(COUNTRIES.US.defaultRoutePrefix);
    }
    onStateChange?.('');
  };

  const usButtonLabel = selectedStateCode
    ? formatUsStateLabel(selectedStateCode)
    : 'Америк';

  const buttonBase =
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200 outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]';

  const activeButtonClass =
    'bg-amber-500 text-white shadow-md hover:shadow-lg border border-amber-600';
  const inactiveButtonClass =
    'bg-white text-gray-800 hover:bg-gray-50 shadow-sm hover:shadow border border-gray-200 hover:border-amber-200';

  // US/JP are placeholder markets — hidden from the public selector unless
  // explicitly revealed for QA (VITE_SHOW_ALL_COUNTRIES=true). The routes
  // themselves (/us, /jp) keep working when visited directly either way.
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
        // `visibleCountries` already excludes disabled markets unless
        // showDisabledMarkets is on — so by the time we get here, a
        // disabled country only renders because QA explicitly asked to see
        // it, and it should be fully clickable/testable, not a dead label.

        if (country.countryCode === 'US') {
          return (
            <DropdownMenu key={country.countryCode}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={undefined}
                  aria-label="Америк муж сонгох"
                  title={!enabled ? 'QA: одоогоор нийтэд нээлттэй бус' : undefined}
                  className={`${buttonBase} ${isUsActive ? activeButtonClass : inactiveButtonClass}`}
                >
                  <span aria-hidden>{COUNTRY_FLAGS.US}</span>
                  <span>{usButtonLabel}{!enabled ? ' (QA)' : ''}</span>
                  <ChevronDown className="w-4 h-4 opacity-80" aria-hidden />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="max-h-72 w-56 overflow-y-auto z-50"
              >
                <DropdownMenuItem onClick={handleUsAllStates} className="gap-2">
                  {!selectedStateCode ? <Check className="w-4 h-4 shrink-0" /> : <span className="w-4 shrink-0" />}
                  <span>Бүх муж</span>
                </DropdownMenuItem>
                {US_STATE_CODES.map((code) => (
                  <DropdownMenuItem
                    key={code}
                    onClick={() => handleUsStateSelect(code)}
                    className="gap-2"
                  >
                    {selectedStateCode === code ? (
                      <Check className="w-4 h-4 shrink-0" />
                    ) : (
                      <span className="w-4 shrink-0" />
                    )}
                    <span>{formatUsStateLabel(code)}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }

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
