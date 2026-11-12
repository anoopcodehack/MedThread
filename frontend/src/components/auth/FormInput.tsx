import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface FormInputProps {
  label: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export default function FormInput({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  required = true,
}: FormInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";

  return (
    <div className="w-full space-y-2">
      <label className="block text-sm font-semibold text-[#344C3A]">
        {label}
      </label>

      <div className="flex h-12 items-center rounded-xl border border-[#DCE5DA] bg-white px-4 transition focus-within:border-[#719777] focus-within:ring-2 focus-within:ring-[#719777]/20">
        <input
          type={
            isPassword && showPassword ? "text" : type
          }
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="w-full bg-transparent text-sm text-[#263C2C] outline-none placeholder:text-gray-400"
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="ml-2 text-gray-400 transition hover:text-forest"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff size={19} />
            ) : (
              <Eye size={19} />
            )}
          </button>
        )}
      </div>
    </div>
  );
}