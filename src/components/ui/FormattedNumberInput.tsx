"use client";
// src/components/ui/FormattedNumberInput.tsx
import { useState, useEffect, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface FormattedNumberInputProps {
  value: number | string;
  onChange: (value: number) => void;
  placeholder?: string;
  min?: number;
  disabled?: boolean;
  className?: string;
}

// Format number with thousand separator (Indonesian: dot)
function formatNumber(num: number): string {
  if (!num && num !== 0) return "";
  return num.toLocaleString("id-ID");
}

// Parse formatted string back to number
function parseNumber(str: string): number {
  const cleaned = str.replace(/\./g, "");
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
}

export const FormattedNumberInput = forwardRef<HTMLInputElement, FormattedNumberInputProps>(
  ({ value, onChange, placeholder, min = 0, disabled, className }, ref) => {
    const [displayValue, setDisplayValue] = useState("");
    const [isFocused, setIsFocused] = useState(false);

    // Update display when external value changes
    useEffect(() => {
      const numValue = typeof value === "string" ? parseInt(value, 10) || 0 : value;
      if (!isFocused) {
        setDisplayValue(formatNumber(numValue));
      }
    }, [value, isFocused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      
      // Allow empty input
      if (input === "") {
        setDisplayValue("");
        onChange(0);
        return;
      }

      // Only allow digits
      const digitsOnly = input.replace(/\./g, "").replace(/\D/g, "");
      const num = parseInt(digitsOnly, 10) || 0;

      // Apply min constraint
      const finalNum = min !== undefined && num < min ? min : num;
      
      setDisplayValue(formatNumber(finalNum));
      onChange(finalNum);
    };

    const handleFocus = () => {
      setIsFocused(true);
      // Remove formatting when focused for easier editing
      const numValue = typeof value === "string" ? parseInt(value, 10) || 0 : value;
      setDisplayValue(numValue ? numValue.toString() : "");
    };

    const handleBlur = () => {
      setIsFocused(false);
      const numValue = typeof value === "string" ? parseInt(value, 10) || 0 : value;
      setDisplayValue(formatNumber(numValue));
    };

    return (
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        className={cn("input-base w-full !pl-10", className)}
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
      />
    );
  }
);

FormattedNumberInput.displayName = "FormattedNumberInput";
