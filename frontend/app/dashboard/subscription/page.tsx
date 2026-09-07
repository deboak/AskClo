"use client";
import { useState } from "react";
import { useSafeEffect as useEffect } from "@/lib/use-safe-effect";
import { api } from "@/lib/api";
import type { SubscriptionOverview } from "@/lib/types";
const tiers = [
  {
    id: "basic",
    name: "Basic",
    price: "₦6,800",
    note: "25 model try-ons monthly",
    features: ["Generic model try-ons", "Garment scanning", "Unlimited styling chat"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "₦9,500",
    note: "35+ try-ons monthly",
    features: ["Everything in Basic", "Use your own photo", "Priority generations"],
  },
  {
    id: "gold",
    name: "Gold",
    price: "₦14,500",
    note: "Your complete wardrobe",
    features: ["Everything in Pro", "Outfit calendar", "Highest try-on allowance"],
  },
];
export default function SubscriptionPage() {
  const [overview, setOverview] = useState<SubscriptionOverview | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    api<SubscriptionOverview>("/subscriptions/current")
      .then(setOverview)
      .catch((e) => setError(e.message));
  }, []);
  async function checkout(tier: string) {
    setBusy(tier);
    setError("");
    try {
      const result = await api<{ authorizationUrl: string }>("/payments/checkout", {
        method: "POST",
        body: JSON.stringify({ tier }),
      });
      window.location.assign(result.authorizationUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout could not be started");
      setBusy("");
    }
  }
  async function cancel() {
    if (!window.confirm("Schedule cancellation at the end of your current billing period?")) return;
    setBusy("cancel");
    try {
      await api("/subscriptions/cancel", { method: "POST" });
      const latest = await api<SubscriptionOverview>("/subscriptions/current");
      setOverview(latest);
      setNotice("Cancellation scheduled. Your benefits remain active until the period ends.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cancellation failed");
    } finally {
      setBusy("");
    }
  }
  return (
    <main className="dashPage">
      <header className="dashPageHeader">
        <div>
          <span className="dashEyebrow">Membership</span>
          <h1>Plan & billing</h1>
          <p>Choose how often you want to bring a look to life.</p>
        </div>
      </header>
      {error && <div className="formError">{error}</div>}
      {notice && <div className="formSuccess">{notice}</div>}
      {overview && (
        <section className="currentPlan">
          <div>
            <span>Current plan</span>
            <h2>{overview.subscription.tier.replace("_", " ")}</h2>
            <p className={overview.isActive ? "activePlan" : ""}>
              {overview.isActive ? "● Active" : "Inactive"}
            </p>
          </div>
          <div>
            <span>Current period</span>
            <strong>
              {new Date(overview.subscription.current_period_end).toLocaleDateString("en-NG", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </strong>
            <p>{overview.daysRemaining} days remaining</p>
          </div>
          <div>
            <span>Try-on access</span>
            <strong>
              {overview.entitlements.ownPhotoTryOn ? "Own photo + models" : "AskClo models"}
            </strong>
            <p>
              {overview.entitlements.freeGenerationLimit
                ? `${overview.entitlements.freeGenerationLimit} trial generations`
                : "Monthly allowance"}
            </p>
          </div>
          {overview.subscription.tier !== "free_trial" &&
            !overview.subscription.cancel_at_period_end && (
              <button onClick={cancel} disabled={busy === "cancel"}>
                Cancel plan
              </button>
            )}
          {overview.subscription.cancel_at_period_end && (
            <div className="cancelBadge">Ends at period close</div>
          )}
        </section>
      )}
      <div className="billingHeading">
        <span className="dashEyebrow">Available plans</span>
        <h2>More room to experiment</h2>
      </div>
      <section className="billingPlans">
        {tiers.map((t) => (
          <article className={overview?.subscription.tier === t.id ? "current" : ""} key={t.id}>
            {overview?.subscription.tier === t.id && <span className="currentTag">Your plan</span>}
            <h3>{t.name}</h3>
            <strong>
              {t.price}
              <small>/month</small>
            </strong>
            <p>{t.note}</p>
            <ul>
              {t.features.map((f) => (
                <li key={f}>✓ {f}</li>
              ))}
            </ul>
            <button
              disabled={busy === t.id || overview?.subscription.tier === t.id}
              onClick={() => checkout(t.id)}
            >
              {overview?.subscription.tier === t.id
                ? "Current plan"
                : busy === t.id
                  ? "Opening checkout…"
                  : `Choose ${t.name}`}
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}
