"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/brand";
import { Arrow } from "@/components/icons";
import { api, AuthData, setSession } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter(); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setLoading(true); setError(""); const data = new FormData(event.currentTarget); try { const session = await api<AuthData>("/auth/login", { method: "POST", body: JSON.stringify({ identifier: data.get("identifier"), password: data.get("password") }) }); setSession(session); router.push("/dashboard"); } catch (e) { setError(e instanceof Error ? e.message : "Could not sign in"); } finally { setLoading(false); } }
  return <main className="authPage"><div className="authBrand"><Brand/></div><section className="authAside"><div><span className="kicker"><span>✦</span> Styled around you</span><h1>Good style starts with being <em>understood.</em></h1><p>Come back to your saved preferences, conversations and outfit edits.</p></div><span className="asideNote">ASKCLO · LAGOS</span></section><section className="authFormWrap"><form className="authForm" onSubmit={submit}><span className="kicker dark">Welcome back</span><h2>Sign in to your wardrobe</h2><p>New to AskClo? <Link href="/register">Create an account</Link></p>{error && <div className="formError">{error}</div>}<label>Email or phone number<input name="identifier" autoComplete="username" required placeholder="you@example.com or +234…" /></label><label>Password<input type="password" name="password" autoComplete="current-password" minLength={8} required placeholder="At least 8 characters" /></label><button className="submitButton" disabled={loading}>{loading ? "Signing in…" : <>Sign in <Arrow /></>}</button><Link className="forgotLink" href="/forgot-password">Forgot your password?</Link></form></section></main>;
}
