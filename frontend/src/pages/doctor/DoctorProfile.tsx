import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  Edit3,
  FileBadge,
  Loader2,
  Mail,
  ShieldCheck,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { getDoctorProfile, updateDoctorProfile } from "../../services/doctorService";
import type { DoctorProfile as DoctorProfileType } from "../../types/doctor";

export default function DoctorProfile() {
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState<DoctorProfileType | null>(null);
  const [formData, setFormData] = useState<DoctorProfileType>({
    name: "",
    email: "",
    registrationNumber: "",
    specialisation: "",
    organisation: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    void getDoctorProfile().then((data) => {
      setProfile(data);
      setFormData(data);
      if (searchParams.get("edit") === "true") {
        setIsEditing(true);
      }
    });
  }, [searchParams]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  if (!profile) return <LoadingSpinner />;

  const handleStartEditing = () => {
    setFormData(profile);
    setErrorMessage("");
    setSuccessMessage("");
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData(profile);
    setErrorMessage("");
    setIsEditing(false);
  };

  const handleChange = (field: keyof DoctorProfileType, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // Validation
    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedReg = formData.registrationNumber.trim();
    const trimmedSpec = formData.specialisation.trim();
    const trimmedOrg = formData.organisation.trim();

    if (!trimmedName) {
      setErrorMessage("Doctor name cannot be empty.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (!trimmedReg) {
      setErrorMessage("Medical registration number is required.");
      return;
    }
    if (!trimmedSpec) {
      setErrorMessage("Specialisation is required.");
      return;
    }
    if (!trimmedOrg) {
      setErrorMessage("Hospital or clinic name is required.");
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateDoctorProfile({
        name: trimmedName,
        email: trimmedEmail,
        registrationNumber: trimmedReg,
        specialisation: trimmedSpec,
        organisation: trimmedOrg,
      });

      setProfile(updated);
      setFormData(updated);
      setIsEditing(false);
      setSuccessMessage("Profile updated successfully!");
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to update profile. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    const cleaned = name.replace(/^Dr\.?\s*/i, "").trim();
    const parts = cleaned.split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[parts.length - 1]) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return (cleaned.slice(0, 2) || "DR").toUpperCase();
  };

  const fieldConfigs: {
    key: keyof DoctorProfileType;
    label: string;
    icon: typeof UserRound;
    type?: string;
    placeholder: string;
    description: string;
  }[] = [
    {
      key: "name",
      label: "Doctor Full Name",
      icon: UserRound,
      placeholder: "e.g. Dr. Ananya Rao",
      description: "Appears on clinical authorizations and sign-offs",
    },
    {
      key: "email",
      label: "Email Address",
      icon: Mail,
      type: "email",
      placeholder: "e.g. ananya.rao@example.com",
      description: "Used for system access and communications",
    },
    {
      key: "registrationNumber",
      label: "Medical Registration Number",
      icon: FileBadge,
      placeholder: "e.g. MCI-20145",
      description: "State or national medical council license identifier",
    },
    {
      key: "specialisation",
      label: "Specialisation",
      icon: Stethoscope,
      placeholder: "e.g. Internal Medicine, Cardiology",
      description: "Primary clinical expertise",
    },
    {
      key: "organisation",
      label: "Hospital or Clinic",
      icon: Building2,
      placeholder: "e.g. MedThread Care Clinic",
      description: "Affiliated medical institution",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            Doctor Workspace
          </p>
          <h1 className="mt-1 font-heading text-3xl font-extrabold text-forest">
            Doctor Profile
          </h1>
          <p className="mt-1 text-sm text-muted">
            Profile details used for authorised patient record access requests and audit logs.
          </p>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={handleStartEditing}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-forest px-5 py-2.5 text-sm font-bold text-white shadow transition hover:bg-forest-dark"
          >
            <Edit3 size={17} />
            Edit Profile
          </button>
        )}
      </div>

      {/* Alert Messages */}
      {successMessage && (
        <div
          role="status"
          className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
            <p className="font-medium">{successMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            className="rounded-lg p-1 text-emerald-600 hover:bg-emerald-100"
            aria-label="Dismiss message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-red-600 shrink-0" />
            <p className="font-medium">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage("")}
            className="rounded-lg p-1 text-red-600 hover:bg-red-100"
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Summary Card */}
      <section className="flex flex-col gap-6 rounded-3xl border border-sage bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:p-8">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-forest text-2xl font-extrabold text-white shadow-md">
          {getInitials(profile.name)}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-2xl font-bold text-forest">
              {profile.name}
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-sage/60 px-2.5 py-0.5 text-xs font-semibold text-forest">
              <ShieldCheck size={14} className="text-forest" />
              Verified Clinician
            </span>
          </div>

          <p className="text-sm font-medium text-muted">
            {profile.specialisation || "Specialisation not set"} •{" "}
            {profile.organisation || "Hospital not set"}
          </p>

          <p className="text-xs text-muted/80">
            Registration:{" "}
            <span className="font-semibold text-forest">
              {profile.registrationNumber || "N/A"}
            </span>{" "}
            | Email: <span className="text-forest">{profile.email}</span>
          </p>
        </div>

        {isEditing && (
          <span className="inline-flex items-center gap-1.5 self-start rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
            <Edit3 size={14} /> Editing Mode
          </span>
        )}
      </section>

      {/* Profile Form / Card */}
      <div className="rounded-3xl border border-sage bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 border-b border-sage/60 pb-4">
          <h3 className="font-heading text-lg font-bold text-forest">
            {isEditing ? "Edit Profile Details" : "Professional Credentials"}
          </h3>
          <p className="mt-1 text-xs text-muted">
            {isEditing
              ? "Modify your credentials below and click 'Save Changes' to update your account."
              : "All credentials are used across the doctor cockpit when accessing patient records."}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 sm:grid-cols-2">
            {fieldConfigs.map((field) => {
              const Icon = field.icon;
              const value = isEditing ? formData[field.key] : profile[field.key];

              return (
                <div key={field.key} className="space-y-1.5">
                  <label
                    htmlFor={field.key}
                    className="flex items-center gap-2 text-sm font-semibold text-forest"
                  >
                    <Icon size={16} className="text-muted" />
                    <span>{field.label}</span>
                    {isEditing && <span className="text-red-500">*</span>}
                  </label>

                  {isEditing ? (
                    <div>
                      <input
                        id={field.key}
                        name={field.key}
                        type={field.type || "text"}
                        value={formData[field.key]}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        disabled={isSaving}
                        className="w-full rounded-xl border border-sage bg-white px-4 py-3 text-sm font-medium text-forest outline-none transition focus:border-forest focus:ring-2 focus:ring-sage/60 disabled:cursor-not-allowed disabled:bg-cream"
                      />
                      <p className="mt-1 text-[11px] text-muted">{field.description}</p>
                    </div>
                  ) : (
                    <div>
                      <div className="w-full rounded-xl border border-sage/80 bg-cream/70 px-4 py-3 text-sm font-medium text-forest">
                        {value || <span className="italic text-muted">Not specified</span>}
                      </div>
                      <p className="mt-1 text-[11px] text-muted">{field.description}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Form Actions */}
          <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-sage/60 pt-6">
            {isEditing ? (
              <>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-forest px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-forest-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={17} />
                      Save Changes
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-sage bg-cream px-5 py-3 text-sm font-bold text-forest transition hover:bg-sage/50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <X size={17} />
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleStartEditing}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-forest px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-forest-dark"
              >
                <Edit3 size={17} />
                Edit Profile
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
