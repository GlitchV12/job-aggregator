import { useState, FormEvent, useEffect, useRef, KeyboardEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { sendOtp, verifyOtp } from "../api/client";
import { setToken } from "../api/client";

export default function Signup() {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  // Step 1 state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  // Step 2 state
  const [step, setStep] = useState<1 | 2>(1);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Countdown timer after OTP is sent
  useEffect(() => {
    if (step !== 2) return;
    setResendTimer(60);
    setCanResend(false);
    const id = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) { clearInterval(id); setCanResend(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [step]);

  // Step 1: send OTP
  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await sendOtp(email, password, name || undefined);
      setStep(2);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Could not send OTP. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: verify OTP
  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { setError("Please enter the full 6-digit code."); return; }
    setError("");
    setSubmitting(true);
    try {
      const res = await verifyOtp(email, code, password, name || undefined);
      setToken(res.access_token);
      await refreshUser();
      navigate("/");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Verification failed. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // OTP input handlers
  const handleOtpChange = (index: number, val: string) => {
    const digit = val.replace(/\D/, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKey = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setError("");
    setOtp(["", "", "", "", "", ""]);
    otpRefs.current[0]?.focus();
    try {
      await sendOtp(email, password, name || undefined);
      setStep(2); // re-trigger timer effect
    } catch {
      setError("Could not resend OTP. Please try again.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />
        <div className="auth-grid" />
      </div>

      {/* Left panel */}
      <div className={`auth-left ${mounted ? "auth-left-in" : ""}`}>
        <Link to="/" className="auth-logo">
          <div className="auth-logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <span>JobAggregator</span>
        </Link>

        <div className="auth-tagline">
          <h1>Start your<br /><span className="auth-gradient-text">job search journey.</span></h1>
          <p>Join thousands of job seekers using AI to land their dream roles faster.</p>
        </div>

        {/* Step indicators */}
        <div className="auth-steps">
          <div className={`auth-step ${step === 1 ? "auth-step-active" : "auth-step-done"}`}>
            <div className="auth-step-num">{step === 1 ? "1" : "✓"}</div>
            <span>Your details</span>
          </div>
          <div className="auth-step-line" />
          <div className={`auth-step ${step === 2 ? "auth-step-active" : ""}`}>
            <div className="auth-step-num">2</div>
            <span>Verify email</span>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className={`auth-right ${mounted ? "auth-right-in" : ""}`}>
        <div className="auth-card">
          {step === 1 ? (
            <>
              <div className="auth-card-header">
                <h2>Create account</h2>
                <p>Fill in your details to get started</p>
              </div>

              <form onSubmit={handleSendOtp} className="auth-form">
                <div className="auth-field">
                  <label htmlFor="signup-name">Full name <span className="auth-optional">(optional)</span></label>
                  <div className="auth-input-wrap">
                    <svg className="auth-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <input
                      id="signup-name"
                      type="text"
                      autoComplete="name"
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <label htmlFor="signup-email">Email address</label>
                  <div className="auth-input-wrap">
                    <svg className="auth-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <input
                      id="signup-email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <label htmlFor="signup-password">Password</label>
                  <div className="auth-input-wrap">
                    <svg className="auth-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <input
                      id="signup-password"
                      type={showPass ? "text" : "password"}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="auth-eye-btn"
                      onClick={() => setShowPass((p) => !p)}
                      aria-label={showPass ? "Hide password" : "Show password"}
                    >
                      {showPass ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round"
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {/* Password strength bar */}
                  {password.length > 0 && (
                    <div className="auth-strength">
                      <div
                        className="auth-strength-bar"
                        style={{
                          width: `${Math.min(100, (password.length / 16) * 100)}%`,
                          background: password.length < 8 ? "#ef4444" : password.length < 12 ? "#f59e0b" : "#22c55e",
                        }}
                      />
                      <span style={{ color: password.length < 8 ? "#ef4444" : password.length < 12 ? "#f59e0b" : "#22c55e" }}>
                        {password.length < 8 ? "Too short" : password.length < 12 ? "Good" : "Strong"}
                      </span>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="auth-error" role="alert">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                )}

                <button
                  id="signup-submit"
                  type="submit"
                  disabled={submitting}
                  className="auth-submit-btn"
                >
                  {submitting ? (
                    <span className="auth-spinner" />
                  ) : (
                    <>
                      Continue
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="auth-card-header">
                <div className="auth-otp-icon">✉️</div>
                <h2>Check your email</h2>
                <p>We sent a 6-digit code to<br /><strong>{email}</strong></p>
              </div>

              <form onSubmit={handleVerifyOtp} className="auth-form">
                <div className="auth-otp-boxes">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      className="auth-otp-input"
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKey(i, e)}
                      onFocus={(e) => e.target.select()}
                      autoFocus={i === 0}
                    />
                  ))}
                </div>

                {error && (
                  <div className="auth-error" role="alert">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                )}

                <button
                  id="otp-submit"
                  type="submit"
                  disabled={submitting || otp.join("").length < 6}
                  className="auth-submit-btn"
                >
                  {submitting ? <span className="auth-spinner" /> : "Verify & create account"}
                </button>

                <div className="auth-resend">
                  {canResend ? (
                    <button type="button" onClick={handleResend} className="auth-resend-btn">
                      Resend code
                    </button>
                  ) : (
                    <span>Resend code in <strong>{resendTimer}s</strong></span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => { setStep(1); setError(""); setOtp(["", "", "", "", "", ""]); }}
                  className="auth-back-btn"
                >
                  ← Change email
                </button>
              </form>
            </>
          )}

          <p className="auth-switch">
            Already have an account?{" "}
            <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
