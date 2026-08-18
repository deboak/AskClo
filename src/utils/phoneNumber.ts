import { AppError } from "../utils/appError";

export interface NormalizedNigerianPhoneNumber {
  e164: string;
  country: "NG";
  national: string;
  nsn: string;
}

function invalidPhoneError(): AppError {
  return new AppError(
    400,
    "Invalid Nigerian phone number. Use 080..., 234..., or +234... format."
  );
}

export function normalizeNigerianPhoneNumber(input: string): NormalizedNigerianPhoneNumber {
  const trimmed = input.trim();
  if (!trimmed) throw invalidPhoneError();

  if (/[^0-9+\s()-]/.test(trimmed)) {
    throw invalidPhoneError();
  }

  const plusCount = (trimmed.match(/\+/g) ?? []).length;
  if (plusCount > 1 || (plusCount === 1 && !trimmed.startsWith("+"))) {
    throw invalidPhoneError();
  }

  const compact = trimmed.replace(/[\s()-]/g, "");
  const digits = compact.startsWith("+") ? compact.slice(1) : compact;

  if (!/^\d+$/.test(digits)) {
    throw invalidPhoneError();
  }

  let nsn: string | null = null;

  if (digits.startsWith("234")) {
    const candidate = digits.slice(3);
    if (/^[789]\d{9}$/.test(candidate)) {
      nsn = candidate;
    }
  } else if (/^0[789]\d{9}$/.test(digits)) {
    nsn = digits.slice(1);
  } else if (/^[789]\d{9}$/.test(digits)) {
    nsn = digits;
  }

  if (!nsn) throw invalidPhoneError();

  return {
    e164: `+234${nsn}`,
    country: "NG",
    national: `0${nsn}`,
    nsn,
  };
}
