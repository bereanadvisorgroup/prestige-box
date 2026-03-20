"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

export interface SsnInputProps
  extends React.ComponentProps<"input"> {
  onSsnChange?: (value: string) => void;
}

const SsnInput = React.forwardRef<HTMLInputElement, SsnInputProps>(
  ({ className, onChange, onSsnChange, value, ...props }, ref) => {
    const formatSsn = (value: string) => {
      if (!value) return value;
      const ssn = value.replace(/[^\d]/g, "");
      const ssnLength = ssn.length;
      if (ssnLength < 4) return ssn;
      if (ssnLength < 6) {
        return `${ssn.slice(0, 3)}-${ssn.slice(3)}`;
      }
      return `${ssn.slice(0, 3)}-${ssn.slice(3, 5)}-${ssn.slice(5, 9)}`;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formattedValue = formatSsn(e.target.value);
      e.target.value = formattedValue;
      if (onChange) onChange(e);
      if (onSsnChange) onSsnChange(formattedValue);
    };

    return (
      <Input
        type={props.type || "text"}
        className={className}
        onChange={handleChange}
        value={value}
        ref={ref}
        {...props}
      />
    );
  }
);
SsnInput.displayName = "SsnInput";

export { SsnInput };
