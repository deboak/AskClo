"use client";

import Link from "next/link";
import { useState } from "react";
import { useSafeEffect as useEffect } from "@/lib/use-safe-effect";
import { Brand } from "@/components/brand";
import { Arrow, Check, Menu, Sparkle } from "@/components/icons";
import { api, getSession, setSession } from "@/lib/api";

const looks = [
  {
    label: "Aso-oke",
    note: "Celebration, elevated",
    src: "https://images.pexels.com/photos/34905851/pexels-photo-34905851.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    label: "Agbada",
    note: "Tradition, redefined",
    src: "https://images.pexels.com/photos/29133978/pexels-photo-29133978.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    label: "Streetwear",
    note: "Lagos after dark",
    src: "https://images.pexels.com/photos/30714671/pexels-photo-30714671.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    label: "Evening",
    note: "Quietly unforgettable",
    src: "https://images.pexels.com/photos/33890251/pexels-photo-33890251.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
];

const plans = [
  {
    tier: "free_trial",
    name: "Free trial",
    price: "₦0",
    per: "7 days · 2 generations",
    features: ["Unlimited styling conversations", "2 visual try-ons", "Personal style profile"],
    action: "Start for free",
  },
  {
    tier: "basic",
    name: "Basic",
    price: "₦6,800",
    suffix: "/month",
    per: "25 try-ons every month",
    featured: true,
    features: ["Everything in Free", "25 model try-ons monthly", "Garment scanning, 3× weekly"],
    action: "Choose Basic",
  },
  {
    tier: "pro",
    name: "Pro",
    price: "₦9,500",
    suffix: "/month",
    per: "Your own photo, unlocked",
    features: ["Everything in Basic", "35+ model try-ons", "Try-on with your own photo"],
    action: "Choose Pro",
  },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  useEffect(() => {
    setSignedIn(Boolean(getSession()?.access_token));
  }, []);

  async function logout() {
    const session = getSession();
    try {
      if (session?.refresh_token)
        await api("/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refresh_token: session.refresh_token }),
        });
    } catch {
      // Always allow local sign-out when the API is temporarily unavailable.
    } finally {
      setSession(null);
      setSignedIn(false);
    }
  }

  async function choosePlan(tier: string) {
    if (tier === "free_trial" || !signedIn) return;
    setCheckoutError("");
    try {
      const result = await api<{ authorizationUrl?: string; authorization_url?: string }>(
        "/payments/checkout",
        { method: "POST", body: JSON.stringify({ tier }) },
      );
      const url = result.authorizationUrl ?? result.authorization_url;
      if (url) window.location.assign(url);
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Checkout could not be started");
    }
  }

  return (
    <main>
      <header className="siteHeader">
        <div className="shell navBar">
          <Brand />
          <nav className={menuOpen ? "navLinks open" : "navLinks"}>
            <a href="#how" onClick={() => setMenuOpen(false)}>
              How it works
            </a>
            <a href="#looks" onClick={() => setMenuOpen(false)}>
              The wardrobe
            </a>
            <a href="#plans" onClick={() => setMenuOpen(false)}>
              Plans
            </a>
            <Link
              className="mobileAuthLink"
              href={signedIn ? "/dashboard" : "/login"}
              onClick={() => setMenuOpen(false)}
            >
              {signedIn ? "My wardrobe" : "Sign in"}
            </Link>
            {signedIn ? (
              <button
                className="mobileAuthLink"
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  void logout();
                }}
              >
                Log out
              </button>
            ) : (
              <Link className="mobileAuthLink" href="/register" onClick={() => setMenuOpen(false)}>
                Sign up
              </Link>
            )}
          </nav>
          <div className="navActions">
            <Link href={signedIn ? "/dashboard" : "/login"} className="textLink">
              {signedIn ? "My wardrobe" : "Sign in"}
            </Link>
            {signedIn ? (
              <button className="pillButton homeLogout" type="button" onClick={() => void logout()}>
                Log out
              </button>
            ) : (
              <Link href="/register" className="pillButton">
                Sign up <Arrow />
              </Link>
            )}
            <button
              className="menuButton"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <Menu />
            </button>
          </div>
        </div>
      </header>

      <section className="heroSection">
        <div className="heroOrb orbOne" />
        <div className="heroOrb orbTwo" />
        <div className="shell heroGrid">
          <div className="heroCopy">
            <span className="kicker">
              <Sparkle /> Your personal AI stylist
            </span>
            <h1>
              Know what to wear.
              <br />
              <em>Every time.</em>
            </h1>
            <p>
              Tell Clo where you&apos;re going, what you like, and what feels comfortable. Get a
              complete outfit built around you.
            </p>
            <div className="heroActions">
              <Link className="primaryButton" href={signedIn ? "/chat" : "/register"}>
                Style my first look <Arrow />
              </Link>
              <a className="watchLink" href="#how">
                <span>▶</span> See how it works
              </a>
            </div>
            <div className="proof">
              <div className="proofFaces">
                <span>AO</span>
                <span>TM</span>
                <span>NK</span>
              </div>
              <p>
                <strong>Made for how you actually dress</strong>
                <br />
                Traditional, contemporary, and everything between.
              </p>
            </div>
          </div>
          <div className="heroVisual">
            <div className="imageMat">
              <img
                src="https://images.pexels.com/photos/28959523/pexels-photo-28959523.jpeg?auto=compress&cs=tinysrgb&w=900"
                alt="Elegant fashion styled by AskClo"
              />
            </div>
            <div className="styleCard">
              <span className="tinyLabel">Clo&apos;s pick</span>
              <strong>Royal blue, softly structured</strong>
              <p>Aso-oke texture · Gold accents · Fluid silhouette</p>
              <div>
                <span>#Owambe</span>
                <span>#ModernTrad</span>
              </div>
            </div>
            <div className="floatingSpark">✦</div>
          </div>
        </div>
        <div className="scrollNote">
          Scroll to discover <span>↓</span>
        </div>
      </section>

      <section className="statement">
        <div className="shell">
          <span className="kicker">Why AskClo</span>
          <blockquote>
            Less time deciding.
            <br />
            <em>More confidence getting dressed.</em>
          </blockquote>
          <p>Clo uses your plans and preferences to recommend a complete outfit.</p>
        </div>
      </section>

      <section className="lightSection" id="how">
        <div className="shell">
          <div className="sectionHeading">
            <div>
              <span className="kicker dark">How it works</span>
              <h2>
                One conversation.
                <br />
                <em>One complete outfit.</em>
              </h2>
            </div>
            <p>
              Answer a few useful questions. Clo remembers your preferences and recommends something
              specific.
            </p>
          </div>
          <div className="stepsGrid">
            <article>
              <span className="stepNumber">01</span>
              <div className="stepIcon">◌</div>
              <h3>Tell Clo the moment</h3>
              <p>
                A wedding in Abuja? Friday drinks on the Island? Share the occasion, mood, colours
                and any boundaries.
              </p>
            </article>
            <article>
              <span className="stepNumber">02</span>
              <div className="stepIcon">✦</div>
              <h3>Receive your edit</h3>
              <p>
                Clo puts together a specific outfit—with fabric, silhouette and styling details
                chosen just for you.
              </p>
            </article>
            <article>
              <span className="stepNumber">03</span>
              <div className="stepIcon">◎</div>
              <h3>See it come alive</h3>
              <p>
                Visualise the full outfit on a model or your own photo before you buy, borrow or
                call your tailor.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="looksSection" id="looks">
        <div className="shell">
          <div className="looksHeader">
            <div>
              <span className="kicker">Traditional and contemporary</span>
              <h2>Style that reflects your life.</h2>
            </div>
            <p>From agbada and aso-oke to office wear and streetwear. Clo understands both.</p>
          </div>
          <div className="looksGrid">
            {looks.map((look, index) => (
              <article className={index === 1 ? "lookCard tall" : "lookCard"} key={look.label}>
                <img src={look.src} alt={`${look.label} outfit inspiration`} />
                <div>
                  <span>{look.note}</span>
                  <h3>{look.label}</h3>
                </div>
              </article>
            ))}
          </div>
          <div className="cultureLine">
            <span>Yoruba</span>
            <i /> <span>Igbo</span>
            <i /> <span>Hausa</span>
            <i /> <span>Contemporary</span>
            <i /> <span>Global</span>
          </div>
        </div>
      </section>

      <section className="lightSection plansSection" id="plans">
        <div className="shell">
          <div className="centerHeading">
            <span className="kicker dark">Plans</span>
            <h2>
              Start free.
              <br />
              <em>Upgrade when you need more.</em>
            </h2>
            <p>Chat with Clo on every plan. Paid plans include more visual try-ons.</p>
          </div>
          {checkoutError && <p className="formError centered">{checkoutError}</p>}
          <div className="plansGrid">
            {plans.map((plan) => (
              <article className={`planCard ${plan.featured ? "featured" : ""}`} key={plan.name}>
                {plan.featured && <span className="popular">Most loved</span>}
                <span className="planName">{plan.name}</span>
                <div className="planPrice">
                  {plan.price}
                  <small>{plan.suffix}</small>
                </div>
                <p>{plan.per}</p>
                <ul>
                  {plan.features.map((item) => (
                    <li key={item}>
                      <Check />
                      {item}
                    </li>
                  ))}
                </ul>
                {plan.tier === "free_trial" || !signedIn ? (
                  <Link
                    href={plan.tier === "free_trial" ? "/register" : "/login"}
                    className="planButton"
                  >
                    {plan.action}
                    <Arrow />
                  </Link>
                ) : (
                  <button className="planButton" onClick={() => choosePlan(plan.tier)}>
                    {plan.action}
                    <Arrow />
                  </button>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="finalCta">
        <div className="ctaPattern" />
        <div className="shell">
          <span>✦</span>
          <h2>
            Ready to find
            <br />
            <em>your next outfit?</em>
          </h2>
          <p>Get two visual try-ons free when you create an account.</p>
          <Link className="ivoryButton" href={signedIn ? "/chat" : "/register"}>
            Start styling <Arrow />
          </Link>
        </div>
      </section>
      <footer>
        <div className="shell footerGrid">
          <div>
            <Brand />
            <p>
              Personal style, intelligently considered.
              <br />
              Made with care in Lagos.
            </p>
          </div>
          <div>
            <strong>Explore</strong>
            <a href="#how">How it works</a>
            <a href="#looks">The wardrobe</a>
            <a href="#plans">Plans</a>
          </div>
          <div>
            <strong>Say hello</strong>
            <a href="mailto:hello@askclo.com">hello@askclo.com</a>
            <span>@askclo</span>
          </div>
        </div>
        <div className="shell footerBottom">
          <span>© 2026 AskClo. All style reserved.</span>
          <div>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
