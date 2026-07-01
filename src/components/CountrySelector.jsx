import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { COUNTRIES, setStoredCountryCode } from '@/config/country';
import { useActiveCountry } from '@/hooks/useActiveCountry';

const COUNTRY_FLAGS = {
  KR: '🇰🇷',
  MN: '🇲🇳',
  JP: '🇯🇵',
};

/**
 * Visible country selector. Navigates to the selected country's
 * `defaultRoutePrefix` (/kr, /mn, /jp) and remembers the choice in
 * localStorage (UI-only — does not affect the KR default at `/`).
 */
export default function CountrySelector({ className }) {
  const navigate = useNavigate();
  const activeCountry = useActiveCountry();

  const handleSelect = (countryCode) => {
    const country = COUNTRIES[countryCode];
    if (!country) return;
    setStoredCountryCode(countryCode);
    navigate(country.defaultRoutePrefix);
  };

  return (
    <Select value={activeCountry.countryCode} onValueChange={handleSelect}>
      <SelectTrigger
        aria-label="Улс сонгох"
        className={
          className ??
          'w-[150px] h-9 bg-gray-800/70 border-gray-700 text-gray-200 focus:ring-amber-500'
        }
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.values(COUNTRIES).map((country) => (
          <SelectItem key={country.countryCode} value={country.countryCode}>
            {COUNTRY_FLAGS[country.countryCode] || ''} {country.countryName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
