"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Phase = "loading" | "notfound" | "ready" | "submitting" | "done";

/* A single five-pointed star, drawn as crisp SVG (not a font glyph).
   Color comes from the button's className via currentColor. */
function Star({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M12 2.5c.3 0 .6.2.75.5l2.55 5.15 5.7.83c.7.1.98.96.47 1.46l-4.12 4.02.97 5.68c.12.7-.61 1.23-1.24.9L12 18.43l-5.08 2.61c-.63.33-1.36-.2-1.24-.9l.97-5.68-4.12-4.02c-.51-.5-.23-1.36.47-1.46l5.7-.83L11.25 3c.15-.3.45-.5.75-.5Z" />
    </svg>
  );
}

export default function ReviewForm({ restaurantId }: { restaurantId: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [restaurantName, setRestaurantName] = useState("");
  const [subTitle, setSubTitle] = useState("");

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
        setSubTitle(`${json.cuisine} \u00B7 ${json.area}`);
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
        // Say thanks, then hand the user to the page that recomputes the
        // average from the fact we just wrote.
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
      <main className="mx-auto flex min-h-[80vh] max-w-[560px] flex-col justify-center px-6">
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
      <main className="mx-auto flex min-h-screen max-w-[560px] flex-col items-center justify-center px-6 text-center">
        <Star className="h-8 w-8 text-accent" />
        <p className="mt-4 text-2xl font-semibold tracking-tight">Thank you.</p>
        <p className="mt-3 max-w-[36ch] text-sm text-muted">
          Your review is saved. The ratings are recalculated from facts, every time
          &mdash; without anyone keeping a score.
        </p>
      </main>
    );
  }

  if (phase === "loading") {
    return (
      <main className="mx-auto min-h-screen max-w-[560px] px-6 py-16 sm:py-24" aria-hidden="true">
        <div className="h-9 w-1/2 animate-pulse rounded-md bg-border" />
        <div className="mt-3 h-4 w-1/3 animate-pulse rounded-md bg-border" />
        <div className="mt-12 h-10 w-40 animate-pulse rounded-md bg-border" />
        <div className="mt-8 h-24 animate-pulse rounded-md bg-border" />
      </main>
    );
  }

  const canSubmit = rating > 0 && comment.trim().length > 0 && phase === "ready";
  const shown = hoverRating || rating;

  return (
    <main className="mx-auto min-h-screen max-w-[560px] px-6 pb-24 pt-12 sm:pt-20">
      <Link
        href={`/restaurant/${restaurantId}`}
        className="text-sm text-muted transition-colors hover:text-accent"
      >
        &larr; Back to restaurant
      </Link>

      <h1 className="mt-8 text-3xl font-semibold tracking-tight">{restaurantName}</h1>
      <p className="mt-2 text-sm text-muted">{subTitle}</p>

      <form onSubmit={handleSubmit} className="mt-10">
        <fieldset>
          <legend className="text-xs font-medium uppercase tracking-widest text-accent">
            Your rating
          </legend>
          <div className="mt-3 flex gap-1" onMouseLeave={() => setHoverRating(0)}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                aria-label={`${value} star${value > 1 ? "s" : ""}`}
                onClick={() => setRating(value)}
                onMouseEnter={() => setHoverRating(value)}
                className={`p-1.5 transition-all ${
                  value <= shown
                    ? "text-accent scale-110"
                    : "text-accent/25 hover:text-muted"
                }`}
              >
                <Star className="h-8 w-8" />
              </button>
            ))}
          </div>
          <p className="mt-1.5 h-5 text-sm text-muted" aria-live="polite">
            {rating > 0 ? `You picked ${rating} of 5` : "Pick a star to begin"}
          </p>
        </fieldset>

        <label
          htmlFor="comment"
          className="mt-6 block text-xs font-medium uppercase tracking-widest text-accent"
        >
          Your review
        </label>
        <textarea
          id="comment"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What was it like? Keep it honest, keep it short."
          className="mt-3 w-full resize-none rounded-lg border border-border bg-card p-4 leading-relaxed placeholder:text-muted/60 focus:border-accent focus:outline-none"
        />

        {error && (
          <p className="mt-4 rounded-lg border border-accent/30 bg-accent/5 p-3 text-sm text-accent">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          title={canSubmit ? undefined : "Pick a rating and write something first"}
          className="mt-8 w-full rounded-md bg-accent py-3.5 text-sm font-medium text-white transition-all hover:bg-accent-deep disabled:cursor-not-allowed disabled:opacity-25 sm:w-auto sm:px-10"
        >
          {phase === "submitting" ? "Submitting\u2026" : "Submit review"}
        </button>
      </form>
    </main>
  );
}
