"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Review = {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
};

type RestaurantData = {
  name: string;
  cuisine: string;
  area: string;
  averageRating: number | null;
  totalReviews: number;
  latestReview: Review | null;
  reviews: Review[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* Rendering only: filled/empty star glyphs for a 1-5 value. Not a calculation. */
function Stars({ value, className = "" }: { value: number; className?: string }) {
  return (
    <span className={className} aria-label={`${value} out of 5`}>
      <span className="text-accent">{"\u2605".repeat(value)}</span>
      <span className="text-accent/25">{"\u2605".repeat(5 - value)}</span>
    </span>
  );
}

function Skeleton() {
  return (
    <main className="mx-auto min-h-screen max-w-[560px] px-6 py-16 sm:py-24" aria-hidden="true">
      <div className="h-9 w-2/3 animate-pulse rounded-md bg-border" />
      <div className="mt-3 h-4 w-1/3 animate-pulse rounded-md bg-border" />
      <div className="mt-12 h-16 w-24 animate-pulse rounded-md bg-border" />
      <div className="mt-10 h-32 animate-pulse rounded-lg bg-border" />
      <div className="mt-4 h-16 animate-pulse rounded-lg bg-border" />
    </main>
  );
}

export default function RestaurantView({ id }: { id: string }) {
  const [data, setData] = useState<RestaurantData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // One call, one shape — the API response IS the screen's agenda:
  // name -> big average -> latest review -> older list.
  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/restaurants/${id}`);
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(json.error ?? "Something went wrong");
          setData(null);
          return;
        }
        setData(json);
      } catch {
        if (!cancelled) setError("Could not reach the server.");
      }
    };
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <main className="mx-auto flex min-h-[80vh] max-w-[560px] flex-col justify-center px-6">
        <p className="text-lg text-muted">{error}</p>
        <Link
          href="/"
          className="mt-4 inline-block w-fit text-accent underline underline-offset-4 hover:opacity-80"
        >
          Go home
        </Link>
      </main>
    );
  }

  if (!data) return <Skeleton />;

  const hasReviews = data.totalReviews > 0;

  return (
    <main className="mx-auto min-h-screen max-w-[560px] px-6 pb-24 pt-12 sm:pt-20">
      <Link href="/" className="text-sm text-muted transition-colors hover:text-foreground">
        &larr; All restaurants
      </Link>

      {/* 1. Name, with cuisine and area underneath in muted text */}
      <h1 className="mt-8 text-3xl font-semibold tracking-tight sm:text-4xl">{data.name}</h1>
      <p className="mt-2 text-sm text-muted">{data.cuisine} &middot; {data.area}</p>

      {hasReviews ? (
        <>
          {/* 2. Average rating — the biggest thing on the page. Printed, not computed. */}
          <div className="mt-10 flex items-baseline gap-1">
            {/* THE LINE: {data.averageRating} — the backend handed us 4.5 and we print 4.5. */}
            <span className="text-6xl font-semibold tracking-tight sm:text-7xl">
              {data.averageRating}
            </span>
            <span className="text-xl text-muted">/ 5</span>
          </div>
          <div className="mt-3 text-sm text-muted">
            {data.totalReviews} review{data.totalReviews === 1 ? "" : "s"}
          </div>

          {/* 3. Latest review — visually set apart, because recency is what people trust */}
          {data.latestReview && (
            <section className="mt-10 rounded-xl bg-card p-6">
              <p className="text-xs font-medium uppercase tracking-widest text-muted">
                Latest review
              </p>
              <p className="mt-4 text-lg leading-relaxed">{data.latestReview.comment}</p>
              <div className="mt-4 flex items-center gap-2">
                <Stars value={data.latestReview.rating} className="text-sm" />
                <span className="text-xs text-muted">
                  &middot; {formatDate(data.latestReview.createdAt)}
                </span>
              </div>
            </section>
          )}

          {/* 4. Older reviews, newest first, plain list */}
          {data.reviews.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted">
                Older reviews
              </h2>
              <ul className="mt-2 divide-y divide-border">
                {data.reviews.map((review) => (
                  <li key={review.id} className="py-5">
                    <p className="leading-relaxed">{review.comment}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted">
                        {review.rating} / 5
                      </span>
                      <span className="text-xs text-muted">{formatDate(review.createdAt)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      ) : (
        /* 5. Empty state — no facts yet, nothing to render, invite the first review */
        <section className="mt-12 rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-base font-medium">No reviews yet</p>
          <p className="mx-auto mt-2 max-w-[32ch] text-sm text-muted">
            This place is waiting for its first review. Yours would set the tone.
          </p>
          <Link
            href={`/review/${id}`}
            className="mt-6 inline-block rounded-md bg-accent px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Write the first review
          </Link>
        </section>
      )}

      {/* 6. Closing call-to-action (hidden in the empty state, which has its own) */}
      {hasReviews && (
        <Link
          href={`/review/${id}`}
          className="mt-12 inline-block rounded-md bg-accent px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Write a review
        </Link>
      )}
    </main>
  );
}
