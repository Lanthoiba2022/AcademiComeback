import { useState, useEffect } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import './PhoneNumberInput.css';
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';
import { Phone } from 'lucide-react';

interface PhoneNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const PhoneNumberInput = ({
  value,
  onChange,
  onValidationChange,
  placeholder = "Enter phone number",
  disabled = false,
  className = ""
}: PhoneNumberInputProps) => {
  const [error, setError] = useState('');
  const [isValid, setIsValid] = useState(false);

  const validatePhoneNumber = (phoneValue: string) => {
    if (!phoneValue || phoneValue.length < 10) {
      setError('Phone number is too short');
      setIsValid(false);
      onValidationChange?.(false);
      return false;
    }

    try {
      const phoneNumber = parsePhoneNumber(`+${phoneValue}`);
      if (!phoneNumber.isValid()) {
        setError('Invalid phone number for selected country');
        setIsValid(false);
        onValidationChange?.(false);
        return false;
      }

      setError('');
      setIsValid(true);
      onValidationChange?.(true);
      return true;
    } catch (e) {
      setError('Invalid phone number format');
      setIsValid(false);
      onValidationChange?.(false);
      return false;
    }
  };

  useEffect(() => {
    if (value) {
      validatePhoneNumber(value);
    } else {
      setError('');
      setIsValid(false);
      onValidationChange?.(false);
    }
  }, [value]);

  const handleChange = (phoneValue: string) => {
    onChange(phoneValue);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <PhoneInput
          country={'us'}
          value={value}
          onChange={handleChange}
          enableSearch={true}
          disabled={disabled}
          placeholder={placeholder}
          containerClass="react-tel-input"
        />
      </div>
      {error && (
        <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
          <span>⚠</span>
          {error}
        </p>
      )}
      {isValid && value && (
        <p className="text-green-400 text-xs mt-1 flex items-center gap-1">
          <span>✓</span>
          Valid phone number
        </p>
      )}
    </div>
  );
}; 