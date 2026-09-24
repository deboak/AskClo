"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { Arrow } from "@/components/icons";
import { api } from "@/lib/api";
import { Turnstile } from "@/components/turnstile";
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [stage, setStage] = useState<"request" | "reset" | "done">("request");
  const [error, setError] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  async function request(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api("/auth/password-reset/request", {
        method: "POST",
        body: JSON.stringify({ email, captchaToken }),
      });
      setStage("reset");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    }
  }
  async function reset(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    try {
      await api("/auth/password-reset/confirm", {
        method: "POST",
        body: JSON.stringify({ email, code: d.get("code"), password: d.get("password") }),
      });
      setStage("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reset failed");
    }
  }
  return (
    <main className="simpleAuth">
      <Brand />
      <form className="authForm verifyForm" onSubmit={stage === "request" ? request : reset}>
        {stage === "done" ? (
          <>
            <div className="verifyIcon">✓</div>
            <h2>Password updated</h2>
            <p>You can now sign in with your new password.</p>
            <Link className="submitButton" href="/login">
              Return to sign in <Arrow />
            </Link>
          </>
        ) : (
          <>
            <span className="kicker dark">Account recovery</span>
            <h2>{stage === "request" ? "Reset your password" : "Check your email"}</h2>
            <p>
              {stage === "request"
                ? "Enter your account email and we'll send a six-digit reset code."
                : `Enter the code sent to ${email} and choose a new password.`}
            </p>
            {error && <div className="formError">{error}</div>}
            {stage === "request" ? (
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                />
              </label>
            ) : (
              <>
                <label>
                  Reset code
                  <input
                    name="code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    placeholder="000000"
                  />
                </label>
                <label>
                  New password
                  <input
                    type="password"
                    name="password"
                    minLength={8}
                    required
                    placeholder="At least 8 characters"
                  />
                </label>
              </>
            )}
            {stage === "request" && <Turnstile onToken={setCaptchaToken} />}
            <button
              className="submitButton"
              disabled={stage === "request" && Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) && !captchaToken}
            >
              Continue <Arrow />
            </button>
            <Link href="/login" className="forgotLink">
              Back to sign in
            </Link>
          </>
        )}
      </form>
    </main>
  );
}
