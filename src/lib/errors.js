/**
 * Central mapping from technical failures to user-facing messages.
 *
 * Backend-authored validation messages pass through unchanged; transport,
 * authentication, and internal operation errors are translated into
 * approachable copy. No stack traces or internals ever reach the UI.
 */
const DEFAULT_MESSAGE = "Something went wrong. Please try again.";

export function friendlyError(err, fallback = DEFAULT_MESSAGE) {
  const raw = (typeof err === "string" ? err : err?.message || "").toString();
  if (!raw) return fallback;

  if (/failed to fetch|networkerror|network request failed|load failed|fetch failed/i.test(raw)) {
    return "Couldn't reach the server. Check your connection and try again.";
  }
  if (/invalid login credentials/i.test(raw)) {
    return "Incorrect email or password. Please try again.";
  }
  if (/email not confirmed/i.test(raw)) {
    return "Please confirm your email address, then sign in.";
  }
  if (/user already registered/i.test(raw)) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (/password should be|weak password|password is too/i.test(raw)) {
    return "Your password doesn't meet the requirements. Use at least 6 characters.";
  }
  if (/rate limit|too many requests|over_email_send_rate_limit/i.test(raw)) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (/invalid.*token|expired.*token|missing authentication|session.*expired|\bjwt\b/i.test(raw)) {
    return "Your session has expired. Please sign in again.";
  }
  if (/^failed to /i.test(raw)) {
    // Internal operation label, not user-facing copy.
    return fallback;
  }
  return raw;
}
