import {
  UserRound,
  UsersRound,
  Stethoscope,
  Check,
} from "lucide-react";

import type { UserRole } from "../../types/auth";

interface RoleSelectorProps {
  value: UserRole;
  onChange: (role: UserRole) => void;
}

const roles = [
  {
    value: "patient" as UserRole,
    label: "Patient",
    description: "Manage your medical records",
    icon: UserRound,
  },
  {
    value: "caretaker" as UserRole,
    label: "Caretaker",
    description: "Manage records with permission",
    icon: UsersRound,
  },
  {
    value: "doctor" as UserRole,
    label: "Doctor",
    description: "Review patient histories",
    icon: Stethoscope,
  },
];

export default function RoleSelector({
  value,
  onChange,
}: RoleSelectorProps) {
  return (
    <div className="w-full space-y-3">
      <label className="block text-sm font-semibold text-[#344C3A]">
        Register as
      </label>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {roles.map((role) => {
          const Icon = role.icon;
          const selected = value === role.value;

          return (
            <button
              type="button"
              key={role.value}
              onClick={() => onChange(role.value)}
              aria-pressed={selected}
              className={`relative flex items-center gap-3 rounded-xl border p-3 text-left transition sm:flex-col sm:items-start sm:p-3 ${
                selected
                  ? "border-[#719777] bg-[#EDF4E9] ring-1 ring-[#719777]/30"
                  : "border-[#E0E8DE] bg-white hover:border-[#A9C2A8]"
              }`}
            >
              <Icon
                size={21}
                className={selected ? "text-forest" : "text-[#829084]"}
              />

              <span className="flex flex-1 flex-col gap-1">
                <strong className="text-xs text-[#294633]">
                  {role.label}
                </strong>

                <small className="text-[10px] leading-4 text-[#829084]">
                  {role.description}
                </small>
              </span>

              {selected && (
                <span className="absolute right-2 top-2 rounded-full bg-forest p-1 text-white">
                  <Check size={11} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}