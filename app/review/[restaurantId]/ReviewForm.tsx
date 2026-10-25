"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Phase = "loading" | "notfound" | "ready" | "submitting" | "done";

const MAX_COMMENT = 500;

/* Same traffic-light rule the restaurant screen uses. Kept in sync on purpose
   (two tiny screens, one rule — the day it changes, both change). */
function ratingTone(value: number) {
  if (value >= 4) return "bg-badge";
  if (value >= 3) return "bg-warn";
  return "bg-accent";
}

export default function ReviewForm({ restaurantId }: { restaurantId: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [restaurantName, setRestaurantName] = useState("");

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  // The form introduces the restaurant it is reviewing — same API as the page.
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/restaurants/${restaurantId}`)
      .then(async (res) => {
        const json = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok) {
          setPhase("notfound");
          return;
        }
        setRestaurantName(json.name);
        setPhase("ready");
      })
      .catch(() => {
        if (!cancelled) setPhase("notfound");
      });
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPhase("submitting");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: Number(restaurantId),
          rating,
          comment,
        }),
      });
      if (res.ok) {
        setPhase("done");
        setTimeout(() => router.push(`/restaurant/${restaurantId}`), 900);
        return;
      }
      // The backend said no — display ITS reason, not one we invent.
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Something went wrong");
      setPhase("ready");
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setPhase("ready");
    }
  }

  if (phase === "notfound") {
    return (
      <main className="mx-auto flex min-h-[80vh] max-w-[560px] flex-col justify-center px-5">
        <p className="text-lg text-muted">Restaurant not found.</p>
        <Link
          href="/"
          className="mt-4 inline-block w-fit text-accent underline underline-offset-4 hover:opacity-80"
        >
          Go home
        </Link>
      </main>
    );
  }

  if (phase === "done") {
    return (
      <main className="mx-auto flex min-h-screen max-w-[560px] flex-col items-center justify-center px-5 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-badge text-2xl text-white">
          &#10003;
        </span>
        <p className="mt-5 text-2xl font-bold tracking-tight">Thank you.</p>
        <p className="mt-3 max-w-[36ch] text-sm text-muted">
          Your review is saved. The ratings are recalculated from facts, every time
          &mdash; without anyone keeping a score.
        </p>
      </main>
    );
  }

  if (phase === "loading") {
    return (
      <main className="mx-auto min-h-screen max-w-[560px] px-5 pt-5" aria-hidden="true">
        <div className="h-10 animate-pulse rounded-2xl bg-border" />
        <div className="mt-6 h-80 animate-pulse rounded-2xl bg-card" />
      </main>
    );
  }

  const canSubmit = rating > 0 && comment.trim().length > 0 && phase === "ready";
  const shown = hoverRating || rating;

  return (
    <main className="mx-auto min-h-screen max-w-[560px] px-5 pb-16 pt-6">
      <section className="rounded-2xl border border-border bg-card p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          Writing a review for
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{restaurantName}</h1>

        <form onSubmit={handleSubmit} className="mt-8">
          <h2 className="text-sm font-semibold">Rate it</h2>
          <div className="mt-3 flex gap-2" onMouseLeave={() => setHoverRating(0)}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                aria-label={`${value} star${value > 1 ? "s" : ""}`}
                onClick={() => setRating(value)}
                onMouseEnter={() => setHoverRating(value)}
                className={
                  "flex h-16 flex-1 items-center justify-center rounded-xl border transition-all " +
                  (value <= shown
                    ? `border-transparent text-white scale-[1.03] ${ratingTone(value)}`
                    : "border-border text-muted hover:border-muted hover:text-foreground")
                }
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true" fill="currentColor">
                  <path d="M12 2.5c.3 0 .6.2.75.5l2.55 5.15 5.7.83c.7.1.98.96.47 1.46l-4.12 4.02.97 5.68c.12.7-.61 1.23-1.24.9L12 18.43l-5.08 2.61c-.63.33-1.36-.2-1.24-.9l.97-5.68-4.12-4.02c-.51-.5-.23-1.36.47-1.46l5.7-.83L11.25 3c.15-.3.45-.5.75-.5Z" />
                </svg>
              </button>
            ))}
          </div>
          <p className="mt-2 h-5 text-xs text-muted" aria-live="polite">
            {rating > 0 ? `You picked ${rating} of 5` : "Pick a box to rate"}
          </p>

          <label htmlFor="comment" className="mt-6 block text-sm font-semibold">
            Your review
          </label>
          <textarea
            id="comment"
            rows={5}
            maxLength={MAX_COMMENT}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="How was the food, the service, the vibe?"
            className="mt-3 w-full resize-none rounded-xl border border-border bg-background p-4 leading-relaxed placeholder:text-muted/70 focus:border-accent focus:outline-none"
          />
          <p className="mt-1 text-right text-xs text-muted">
            {comment.length}/{MAX_COMMENT}
          </p>

          {error && (
            <p className="mt-3 rounded-xl border border-accent/30 bg-accent/5 p-3 text-sm text-accent">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            title={canSubmit ? undefined : "Pick a rating and write something first"}
            className={
              "mt-5 w-full rounded-xl py-3.5 text-sm font-bold transition-all " +
              (canSubmit
                ? "bg-accent text-white hover:bg-accent-deep"
                : "bg-border text-muted")
            }
          >
            {phase === "submitting" ? "Submitting\u2026" : "Submit Review"}
          </button>
        </form>
      </section>

      <p className="mt-6 text-center text-xs text-muted">
        Your review is public and cannot be edited or deleted.
      </p>
    </main>
  );
}
