"use client";
import Link from "next/link";
import { useState } from "react";
import { useSafeEffect as useEffect } from "@/lib/use-safe-effect";
import { api, getSession } from "@/lib/api";
import type { Garment, Generation, Profile, SubscriptionOverview } from "@/lib/types";

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionOverview | null>(null);
  const [garments, setGarments] = useState<Garment[]>([]);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [welcome, setWelcome] = useState({ greeting: "Welcome back", name: "" });
  useEffect(() => {
    const session = getSession();
    const hour = new Date().getHours();
    setWelcome({
      greeting: hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening",
      name: session?.user.first_name ?? "",
    });
    void Promise.all([
      api<Profile>("/profile"),
      api<SubscriptionOverview>("/subscriptions/current"),
      api<Garment[]>("/garments"),
      api<Generation[]>("/generations"),
    ])
      .then(([p, s, w, g]) => {
        setProfile(p);
        setSubscription(s);
        setGarments(w);
        setGenerations(g);
      })
      .catch(() => {});
  }, []);
  const completedProfile =
    profile &&
    profile.gender &&
    profile.style_preference &&
    profile.body_type &&
    profile.cultural_preference;
  return (
    <main className="dashPage">
      <header className="dashPageHeader">
        <div>
          <span className="dashEyebrow">Your wardrobe</span>
          <h1>
            {welcome.greeting}
            {welcome.name ? `, ${welcome.name}` : ""}.
          </h1>
          <p>What are we getting dressed for today?</p>
        </div>
        <Link href="/dashboard/chat" className="goldAction">
          Style a new look <span>→</span>
        </Link>
      </header>
      {!completedProfile && profile && (
        <section className="completeProfile">
          <div>
            <span>01</span>
            <p>
              <strong>Complete your style profile</strong>Give Clo better context for every
              recommendation.
            </p>
          </div>
          <Link href="/onboarding">Finish setup →</Link>
        </section>
      )}
      <section className="dashStats">
        <article>
          <span>Wardrobe</span>
          <strong>{garments.length}</strong>
          <p>saved garment{garments.length === 1 ? "" : "s"}</p>
          <Link href="/dashboard/wardrobe">Open wardrobe →</Link>
        </article>
        <article>
          <span>Try-ons</span>
          <strong>{generations.filter((g) => g.status === "completed").length}</strong>
          <p>completed looks</p>
          <Link href="/dashboard/try-ons">View gallery →</Link>
        </article>
        <article className="darkStat">
          <span>Current plan</span>
          <strong>{subscription?.subscription.tier.replace("_", " ") ?? "—"}</strong>
          <p>{subscription ? `${subscription.daysRemaining} days remaining` : "Loading plan…"}</p>
          <Link href="/dashboard/subscription">Manage plan →</Link>
        </article>
      </section>
      <section className="dashSplit">
        <div>
          <div className="blockHeading">
            <div>
              <span className="dashEyebrow">Recent looks</span>
              <h2>Your latest try-ons</h2>
            </div>
            <Link href="/dashboard/try-ons">See all</Link>
          </div>
          {generations.length ? (
            <div className="miniGallery">
              {generations.slice(0, 3).map((g) => (
                <article key={g.id}>
                  <div>
                    {g.output_image_url ? (
                      <img src={g.output_image_url} alt="Generated outfit" />
                    ) : (
                      <img src={g.garment_image_url ?? ""} alt="Garment awaiting try-on" />
                    )}
                    <span className={`status ${g.status}`}>{g.status}</span>
                  </div>
                  <p>{g.prompt || "Personal style edit"}</p>
                  <small>{new Date(g.created_at).toLocaleDateString("en-NG")}</small>
                </article>
              ))}
            </div>
          ) : (
            <div className="emptyDash">
              <span>◎</span>
              <h3>Your first look belongs here</h3>
              <p>Upload a garment, then let Clo help you see it in a new way.</p>
              <Link href="/dashboard/wardrobe">Add a garment</Link>
            </div>
          )}
        </div>
        <aside className="cloPrompt">
          <span>✦ A note from Clo</span>
          <blockquote>
            “The best outfit starts with the way you want to <em>feel</em>.”
          </blockquote>
          <p>Tell me about your next moment and we&apos;ll take it from there.</p>
          <Link href="/dashboard/chat">Start a conversation →</Link>
        </aside>
      </section>
    </main>
  );
}
