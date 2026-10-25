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

function Stars({ value }: { value: number }) {
  return (
    <span className="text-accent" aria-label={`${value} out of 5`}>
      {"\u2605".repeat(value)}
      <span className="text-muted">{"\u2605".repeat(5 - value)}</span>
    </span>
  );
}

export default function RestaurantView({ id }: { id: string }) {
  const [data, setData] = useState<RestaurantData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // One call, one shape. The API returns exactly what this screen shows:
  // name -> big average -> latest review -> older list. No sorting, no maths.
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/restaurants/${id}`);
        const json = await res.json();
        if (!res.ok) {
          setError(json.error ?? "Something went wrong");
          setData(null);
          return;
        }
        setData(json);
      } catch {
        setError("Could not reach the server.");
      }
    };
    fetchData();
  }, [id]);

  if (error) {
    return (
      <main className="mx-auto max-w-[560px] px-6 py-24">
        <p className="text-lg text-muted">{error}</p>
        <Link href="/" className="mt-4 inline-block text-accent underline underline-offset-4">
          Go home
        </Link>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-[560px] px-6 py-24">
        <p className="text-lg text-muted">Loading…</p>
      </main>
    );
  }

  const hasReviews = data.totalReviews > 0;

  return (
    <main className="mx-auto max-w-[560px] px-6 py-16 sm:py-24">
      {/* 1. Name, with cuisine and area underneath in muted text */}
      <h1 className="text-3xl font-semibold tracking-tight">{data.name}</h1>
      <p className="mt-1 text-sm text-muted">Indian &middot; {data.area}</p>

      {hasReviews ? (
        <>
          {/* 2. Average rating — the biggest thing on the page. It is printed, not computed. */}
          <div className="mt-10 flex items-baseline gap-3">
            {/* THE LINE: {data.averageRating} — the backend handed us 4.5 and we print 4.5. */}
            <span className="text-6xl font-semibold tracking-tight">{data.averageRating}</span>
            <span className="text-sm text-muted">
              {data.totalReviews} review{data.totalReviews === 1 ? "" : "s"}
            </span>
          </div>

          {/* 3. Latest review — visually set apart, because recency is what people trust */}
          {data.latestReview && (
            <section className="mt-10 rounded-lg border-l-4 border-l-accent bg-card p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Latest review
              </p>
              <p className="mt-3 text-base leading-relaxed">{data.latestReview.comment}</p>
              <p className="mt-3 text-xs text-muted">
                <Stars value={data.latestReview.rating} /> &middot;{" "}
                {formatDate(data.latestReview.createdAt)}
              </p>
            </section>
          )}

          {/* 4. Older reviews, newest first, plain list */}
          {data.reviews.length > 0 && (
            <section className="mt-10">
              <h2 className="text-sm font-medium text-muted">Older reviews</h2>
              <ul className="mt-4 divide-y divide-border">
                {data.reviews.map((review) => (
                  <li key={review.id} className="py-4">
                    <p className="text-sm leading-relaxed">{review.comment}</p>
                    <p className="mt-2 text-xs text-muted">
                      <Stars value={review.rating} /> &middot; {formatDate(review.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      ) : (
        /* 6. Empty state — no facts yet, nothing to show, invite the first review */
        <section className="mt-12 rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-base font-medium">No reviews yet</p>
          <p className="mt-2 text-sm text-muted">Be the first to review this restaurant.</p>
        </section>
      )}

      {/* 5. Link to the review form */}
      <Link
        href={`/review/${id}`}
        className="mt-12 inline-block rounded-md bg-accent px-6 py-3 text-sm font-medium text-white hover:opacity-90"
      >
        Write a review
      </Link>
    </main>
  );
}
