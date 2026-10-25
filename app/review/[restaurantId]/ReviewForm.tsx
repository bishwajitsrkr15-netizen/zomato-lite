"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ReviewForm({ restaurantId }: { restaurantId: string }) {
  const router = useRouter();
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // We need the restaurant's name at the top, so you know what you are reviewing.
  // Fetching facts is all the frontend does — the backend returns them already.
  useEffect(() => {
    fetch(`/api/restaurants/${restaurantId}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setRestaurantName(data.name))
      .catch(() => setNotFound(true));
  }, [restaurantId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
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
        router.push(`/restaurant/${restaurantId}`);
        return;
      }
      // The backend said no — display ITS reason, not one we invent.
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Something went wrong");
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (notFound) {
    return (
      <main className="mx-auto max-w-[560px] px-6 py-24">
        <p className="text-lg text-muted">Restaurant not found.</p>
        <Link href="/" className="mt-4 inline-block text-accent underline underline-offset-4">
          Go home
        </Link>
      </main>
    );
  }

  const canSubmit = rating > 0 && comment.trim().length > 0 && !submitting;

  return (
    <main className="mx-auto max-w-[560px] px-6 py-16 sm:py-24">
      <Link
        href={`/restaurant/${restaurantId}`}
        className="text-sm text-muted hover:text-foreground"
      >
        &larr; Back to restaurant
      </Link>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight">
        {restaurantName ?? "Loading"}
      </h1>
      <p className="mt-1 text-sm text-muted">Write a review</p>

      <form onSubmit={handleSubmit} className="mt-10">
        <fieldset>
          <legend className="text-sm font-medium">Your rating</legend>
          <div className="mt-3 flex gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                aria-label={`${value} star${value > 1 ? "s" : ""}`}
                onClick={() => setRating(value)}
                className={`h-10 w-10 rounded-md text-2xl leading-none transition-colors ${
                  value <= rating
                    ? "text-accent"
                    : "text-border hover:text-muted"
                }`}
              >
                &starf;
              </button>
            ))}
          </div>
        </fieldset>

        <label htmlFor="comment" className="mt-8 block text-sm font-medium">
          Your review
        </label>
        <textarea
          id="comment"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What did you think?"
          className="mt-3 w-full resize-none rounded-md border border-border bg-background p-3 text-sm placeholder:text-muted focus:border-accent focus:outline-none"
        />

        {error && <p className="mt-4 text-sm text-accent">{error}</p>}

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-8 w-full rounded-md bg-foreground py-3 text-sm font-medium text-background disabled:cursor-not-allowed disabled:opacity-30 sm:w-auto sm:px-8"
        >
          {submitting ? "Submitting…" : "Submit review"}
        </button>
      </form>
    </main>
  );
}
