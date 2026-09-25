"use client";

import { useSafeEffect as useEffect } from "@/lib/use-safe-effect";

export const SETTINGS_STORAGE_KEY = "askclo_settings";

export type AppSettings = {
  stylingEmails: boolean;
  tryOnAlerts: boolean;
  productNews: boolean;
  reducedMotion: boolean;
  largerText: boolean;
  highContrast: boolean;
};

export const defaultSettings: AppSettings = {
  stylingEmails: true,
  tryOnAlerts: true,
  productNews: false,
  reducedMotion: false,
  largerText: false,
  highContrast: false,
};

export function readAppSettings(): AppSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    return { ...defaultSettings, ...JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? "{}") };
  } catch {
    return defaultSettings;
  }
}

export function applyAppSettings(settings: AppSettings) {
  const root = document.documentElement;
  root.classList.toggle("reduceMotion", settings.reducedMotion);
  root.classList.toggle("largerText", settings.largerText);
  root.classList.toggle("highContrast", settings.highContrast);
}

export function PreferencesBootstrap() {
  useEffect(() => applyAppSettings(readAppSettings()), []);
  return null;
}
