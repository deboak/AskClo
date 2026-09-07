"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useSafeEffect as useEffect } from "@/lib/use-safe-effect";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/brand";
import { Arrow } from "@/components/icons";
import { api, AuthData, setSession } from "@/lib/api";

export default function VerifyPage() {
 const router = useRouter(); const [phone, setPhone] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false); const [sent, setSent] = useState(false);
 useEffect(() => { setPhone(sessionStorage.getItem("askclo_phone") ?? ""); }, []);
 async function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); setLoading(true); setError(""); const data = new FormData(e.currentTarget); try { const session = await api<AuthData>("/auth/verify", { method: "POST", body: JSON.stringify({ method: "phone", phone_number: phone, code: data.get("code") }) }); setSession(session); router.push("/onboarding"); } catch (err) { setError(err instanceof Error ? err.message : "Verification failed"); } finally { setLoading(false); } }
 async function resend() { try { await api("/auth/resend-otp", { method: "POST" }); setSent(true); } catch (err) { setError(err instanceof Error ? err.message : "Could not resend code"); } }
 return <main className="simpleAuth"><Brand/><form className="authForm verifyForm" onSubmit={submit}><div className="verifyIcon">✦</div><span className="kicker dark">One last detail</span><h2>Verify your number</h2><p>We sent a six-digit code to <strong>{phone || "your phone"}</strong>. Enter it below to open your wardrobe.</p>{error && <div className="formError">{error}</div>}<label>Verification code<input className="codeInput" name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required placeholder="000000" autoFocus /></label><button className="submitButton" disabled={loading}>{loading ? "Checking…" : <>Verify and continue <Arrow/></>}</button><button type="button" className="resendButton" onClick={resend}>{sent ? "A fresh code is on its way" : "Didn't receive it? Send again"}</button><Link href="/register" className="forgotLink">Use a different number</Link></form></main>;
}
