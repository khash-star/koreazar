import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { US_STATE_CODES, formatUsStateLabel } from '@/constants/usStates';

/**
 * US state dropdown. Stores two-letter state_code (CA, NY, …) in form state.
 */
export default function UsStateSelect({
  value,
  onValueChange,
  label = 'Муж',
  placeholder = 'Муж сонгох',
  triggerClassName = 'mt-2 h-12 rounded-xl',
  labelClassName = 'text-base font-semibold',
  required = false,
}) {
  return (
    <div>
      <Label className={labelClassName}>
        {label}
        {required ? ' *' : ''}
      </Label>
      <Select value={value || undefined} onValueChange={onValueChange} required={required}>
        <SelectTrigger className={triggerClassName} aria-label={label}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {US_STATE_CODES.map((code) => (
            <SelectItem key={code} value={code}>
              {formatUsStateLabel(code)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
