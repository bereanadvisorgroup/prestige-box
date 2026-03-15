"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

export interface PhoneInputProps
  extends React.ComponentProps<"input"> {
  onPhoneChange?: (value: string) => void;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, onChange, onPhoneChange, value, ...props }, ref) => {
    const formatPhoneNumber = (value: string) => {
      if (!value) return value;
      const phoneNumber = value.replace(/[^\d]/g, "");
      const phoneNumberLength = phoneNumber.length;
      if (phoneNumberLength < 4) return phoneNumber;
      if (phoneNumberLength < 7) {
        return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
      }
      return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formattedValue = formatPhoneNumber(e.target.value);
      e.target.value = formattedValue;
      if (onChange) onChange(e);
      if (onPhoneChange) onPhoneChange(formattedValue);
    };

    return (
      <Input
        type="tel"
        className={className}
        onChange={handleChange}
        value={value}
        ref={ref}
        {...props}
      />
    );
  }
);
PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
