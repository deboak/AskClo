"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/brand";
import { Arrow } from "@/components/icons";
import { api, AuthData, setSession } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const payload = Object.fromEntries(data);

    try {
      const session = await api<AuthData>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setSession(session);
      sessionStorage.setItem("askclo_phone", String(payload.phone_number));
      router.push("/verify");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not create your account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="authPage">
      <div className="authBrand"><Brand /></div>

      <section className="authAside registerAside">
        <div>
          <span className="kicker"><span aria-hidden="true">✦</span> Personal styling</span>
          <h1>Recommendations that fit <em>your life.</em></h1>
          <p>Save your preferences, build a wardrobe, and see outfits before you wear them.</p>
        </div>
        <span className="asideNote">2 FREE VISUAL TRY-ONS INCLUDED</span>
      </section>

      <section className="authFormWrap">
        <form className="authForm registerForm" onSubmit={submit}>
          <span className="kicker dark">Get started</span>
          <h2>Create your account</h2>
          <p>Already have one? <Link href="/login">Sign in</Link></p>
          {error && <div className="formError">{error}</div>}

          <div className="fieldRow">
            <label>First name<input name="first_name" required placeholder="Ada" /></label>
            <label>Last name<input name="last_name" required placeholder="Okafor" /></label>
          </div>
          <label>Email<input type="email" name="email" required placeholder="ada@example.com" /></label>
          <label>Phone number<input type="tel" name="phone_number" required placeholder="0801 234 5678" /></label>
          <label>Password<input type="password" name="password" minLength={8} required placeholder="At least 8 characters" /></label>

          <button className="submitButton" disabled={loading}>
            {loading ? "Creating your wardrobe…" : <>Create my account <Arrow /></>}
          </button>
          <small>By continuing, you agree to our Terms and Privacy Policy.</small>
        </form>
      </section>
    </main>
  );
}
