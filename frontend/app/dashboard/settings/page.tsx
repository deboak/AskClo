"use client";

import Link from "next/link";
import { useState } from "react";
import { useSafeEffect as useEffect } from "@/lib/use-safe-effect";
import { api, getSession } from "@/lib/api";
import {
  applyAppSettings,
  defaultSettings,
  readAppSettings,
  SETTINGS_STORAGE_KEY,
  type AppSettings,
} from "@/components/preferences-bootstrap";

type NotificationPreferences = {
  styling_emails: boolean;
  try_on_alerts: boolean;
  product_news: boolean;
};

const notificationKeys = {
  stylingEmails: "styling_emails",
  tryOnAlerts: "try_on_alerts",
  productNews: "product_news",
} as const;

function Toggle({ checked, onChange, label, disabled = false }: { checked: boolean; onChange: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      className={`settingsToggle ${checked ? "on" : ""}`}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      disabled={disabled}
    >
      <span />
    </button>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [saved, setSaved] = useState(false);
  const [savingKey, setSavingKey] = useState<keyof AppSettings | null>(null);
  const [error, setError] = useState("");
  const user = typeof window === "undefined" ? null : getSession()?.user;

  useEffect(() => {
    setSettings(readAppSettings());
    api<NotificationPreferences>("/notifications/preferences")
      .then((preferences) => setSettings((current) => ({
        ...current,
        stylingEmails: preferences.styling_emails,
        tryOnAlerts: preferences.try_on_alerts,
        productNews: preferences.product_news,
      })))
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Could not load email preferences"));
  }, []);

  async function update(key: keyof AppSettings) {
    if (savingKey) return;
    setError("");
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    setSavingKey(key);
    try {
      if (key in notificationKeys) {
        const apiKey = notificationKeys[key as keyof typeof notificationKeys];
        await api<NotificationPreferences>("/notifications/preferences", {
          method: "PATCH",
          body: JSON.stringify({ [apiKey]: next[key] }),
        });
      } else {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
        applyAppSettings(next);
      }
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1600);
    } catch (requestError) {
      setSettings(settings);
      setError(requestError instanceof Error ? requestError.message : "Could not save your preference");
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <main className="dashPage settingsPage">
      <header className="dashPageHeader settingsHeader">
        <div>
          <span className="dashEyebrow">Preferences</span>
          <h1>Settings</h1>
          <p>Manage your account experience, privacy and communications.</p>
        </div>
        {saved && <span className="settingsSaved" role="status">Changes saved</span>}
      </header>
      {error && <div className="formError settingsError" role="alert">{error}</div>}

      <div className="settingsLayout">
        <section className="settingsSection">
          <div className="settingsSectionHeading">
            <span>01</span><div><h2>Account</h2><p>Your sign-in details and personal information.</p></div>
          </div>
          <div className="settingsRows">
            <div className="settingsIdentity">
              <span>{user ? `${user.first_name[0]}${user.last_name[0]}` : "AC"}</span>
              <div><strong>{user ? `${user.first_name} ${user.last_name}` : "AskClo member"}</strong><small>{user?.email ?? user?.phone_number ?? ""}</small></div>
            </div>
            <Link className="settingsRowLink" href="/dashboard/profile"><span><strong>Style profile</strong><small>Photo, sizing and styling preferences</small></span><b>→</b></Link>
            <Link className="settingsRowLink" href="/forgot-password"><span><strong>Change password</strong><small>Reset your password securely</small></span><b>→</b></Link>
            <Link className="settingsRowLink" href="/dashboard/subscription"><span><strong>Plan and billing</strong><small>Subscription, usage and payment history</small></span><b>→</b></Link>
          </div>
        </section>

        <section className="settingsSection">
          <div className="settingsSectionHeading"><span>02</span><div><h2>Notifications</h2><p>Choose what you would like to hear from AskClo about.</p></div></div>
          <div className="settingsRows">
            <div className="settingsRow"><span><strong>Styling inspiration</strong><small>Occasional recommendations selected for your profile</small></span><Toggle checked={settings.stylingEmails} disabled={savingKey !== null} onChange={() => void update("stylingEmails")} label="Styling inspiration" /></div>
            <div className="settingsRow"><span><strong>Try-on updates</strong><small>Know when your generated look is ready</small></span><Toggle checked={settings.tryOnAlerts} disabled={savingKey !== null} onChange={() => void update("tryOnAlerts")} label="Try-on updates" /></div>
            <div className="settingsRow"><span><strong>Product news</strong><small>New features, improvements and AskClo announcements</small></span><Toggle checked={settings.productNews} disabled={savingKey !== null} onChange={() => void update("productNews")} label="Product news" /></div>
          </div>
        </section>

        <section className="settingsSection">
          <div className="settingsSectionHeading"><span>03</span><div><h2>Appearance and accessibility</h2><p>Adjust the interface to make AskClo more comfortable to use.</p></div></div>
          <div className="settingsRows">
            <div className="settingsRow"><span><strong>Reduce motion</strong><small>Minimise interface animation and movement</small></span><Toggle checked={settings.reducedMotion} onChange={() => update("reducedMotion")} label="Reduce motion" /></div>
            <div className="settingsRow"><span><strong>Larger text</strong><small>Increase the size of supporting interface text</small></span><Toggle checked={settings.largerText} onChange={() => update("largerText")} label="Larger text" /></div>
            <div className="settingsRow"><span><strong>Higher contrast</strong><small>Strengthen borders and supporting text</small></span><Toggle checked={settings.highContrast} onChange={() => update("highContrast")} label="Higher contrast" /></div>
          </div>
        </section>

        <section className="settingsSection">
          <div className="settingsSectionHeading"><span>04</span><div><h2>Privacy and support</h2><p>Understand your data choices or get help from the AskClo team.</p></div></div>
          <div className="settingsRows">
            <Link className="settingsRowLink" href="/privacy"><span><strong>Privacy policy</strong><small>How your information and uploaded images are handled</small></span><b>→</b></Link>
            <Link className="settingsRowLink" href="/terms"><span><strong>Terms of service</strong><small>The terms governing your use of AskClo</small></span><b>→</b></Link>
            <a className="settingsRowLink" href="mailto:info@askclo.com"><span><strong>Contact support</strong><small>Questions, data requests or account assistance</small></span><b>→</b></a>
          </div>
          <p className="settingsFootnote">To request an account-data export or permanent account deletion, contact support from the email address registered to your account.</p>
        </section>
      </div>
    </main>
  );
}
