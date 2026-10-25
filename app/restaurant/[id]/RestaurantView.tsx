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

/* Presentation-only date-time rendering, same spirit as formatting a number. */
function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short" });
}

/* Initials for the banner: "Ludhiana Burrito" -> "LB". Presentation logic. */
function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

/* Dish photos, shipped as static frontend assets (public/food/).
   Mapping by review id is visual garnish only — not stored data,
   and NOT a statement that the reviewer ate exactly this dish. */
const DISH_IMAGES = [
  "/food/dish-burrito-half.jpg",
  "/food/dish-burrito-plate.jpg",
  "/food/dish-paneer.jpg",
  "/food/dish-kadai-paneer.jpg",
];

function Skeleton() {
  return (
    <main className="mx-auto min-h-screen max-w-[560px] px-5 pt-5" aria-hidden="true">
      <div className="h-44 animate-pulse rounded-2xl bg-border" />
      <div className="mt-8 h-3 w-28 animate-pulse rounded bg-border" />
      <div className="mt-3 h-28 animate-pulse rounded-2xl bg-border" />
      <div className="mt-8 h-3 w-32 animate-pulse rounded bg-border" />
      <div className="mt-3 h-24 animate-pulse rounded-2xl bg-border" />
    </main>
  );
}

/* The traffic-light rule for ratings — defined here, exactly once.
   Product spec: 1-2 red, 3 yellow, 4-5 green. */
function ratingTone(value: number | null) {
  if (value == null) return "bg-badge"; // unused: null badges render nothing
  if (value >= 4) return "bg-badge";    // green
  if (value >= 3) return "bg-warn";     // yellow
  return "bg-accent";                   // red
}

function RatingSquare({ value, size = "md" }: { value: number | null; size?: "md" | "lg" }) {
  if (value == null) return null; // no facts yet -> nothing to average -> no badge
  const box = size === "lg" ? "h-20 w-20 rounded-2xl" : "h-11 w-11 rounded-lg";
  const text = size === "lg" ? "text-2xl" : "text-lg";
  return (
    <span
      className={`flex ${box} shrink-0 flex-col items-center justify-center text-white ${ratingTone(value)}`}
      aria-label={`Rated ${value} out of 5`}
    >
      <span className={`${text} font-bold leading-none`}>{value}</span>
      {size === "lg" && <span className="mt-1 text-[10px] text-white/75">/ 5</span>}
    </span>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-border/60 px-3.5 py-1.5 text-xs font-medium text-muted">
      {children}
    </span>
  );
}

export default function RestaurantView({ id }: { id: string }) {
  const [data, setData] = useState<RestaurantData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // One call, one shape — the API response IS the screen's agenda.
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
      <main className="mx-auto flex min-h-[80vh] max-w-[560px] flex-col justify-center px-5">
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
  const initials = initialsOf(data.name);

  return (
    <main className="mx-auto min-h-screen max-w-[560px] px-5 pb-32 pt-5">
      {/* Hero card: background image banner with initials, facts below on the card */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div
          className="relative h-44 [background-image:url(/food/hero.jpg)] [background-size:cover] [background-position:center]"
          role="img"
          aria-label={`${data.name} banner`}
        >
          {/* Dark scrim so the initials stay readable on any photo */}
          <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
          <span
            className="absolute bottom-5 left-5 text-5xl font-extrabold tracking-tight text-white"
            style={{ textShadow: "0 2px 14px rgba(0,0,0,0.45)" }}
          >
            {initials}
          </span>
        </div>
        <div className="relative p-5">
          <div className="absolute right-5 top-5">
            {/* THE LINE: {data.averageRating} — received from the API, printed as-is. */}
            <RatingSquare value={data.averageRating} size="lg" />
          </div>
          <h1 className="pr-24 text-2xl font-bold tracking-tight">{data.name}</h1>
          <p className="mt-1 text-sm text-muted">{data.area}</p>
          <div className="mt-3.5 flex flex-wrap gap-2">
            <Chip>{data.cuisine}</Chip>
            <Chip>Dine-in</Chip>
          </div>
          <p className="mt-3.5 text-xs text-muted">
            Based on {data.totalReviews} review{data.totalReviews === 1 ? "" : "s"}
          </p>
        </div>
      </section>

      {hasReviews ? (
        <>
          {/* Latest review, flagged like the reference. The marker + pill adopt
              the latest review's traffic-light tone. */}
          {data.latestReview && (
            <>
              <h2 className="mt-9 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Latest review
              </h2>
              <section className="relative mt-4 rounded-2xl border border-border bg-card p-5">
                <span
                  className={`absolute -top-2.5 left-6 rounded-full px-3 py-1 text-[10px] font-bold tracking-widest text-white ${ratingTone(data.latestReview.rating)}`}
                  aria-hidden="true"
                >
                  LATEST
                </span>
                <span className={`absolute left-0 top-6 bottom-6 w-[3px] rounded-full ${ratingTone(data.latestReview.rating)}`} aria-hidden="true" />
                <div className="flex items-start justify-between">
                  <RatingSquare value={data.latestReview.rating} />
                  <span className="text-xs text-muted">{timeAgo(data.latestReview.createdAt)}</span>
                </div>
                <div className="mt-4 flex items-start gap-4">
                  <p className="flex-1 leading-relaxed">{data.latestReview.comment}</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={DISH_IMAGES[data.latestReview.id % DISH_IMAGES.length]}
                    alt=""
                    aria-hidden="true"
                    className="h-24 w-28 shrink-0 rounded-lg border border-border object-cover"
                  />
                </div>
              </section>
            </>
          )}

          {/* Older reviews, newest first */}
          {data.reviews.length > 0 && (
            <>
              <h2 className="mt-9 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Earlier reviews
              </h2>
              <ul className="mt-4 space-y-3">
                {data.reviews.map((review) => (
                  <li
                    key={review.id}
                    className="rounded-2xl border border-border bg-card p-5"
                  >
                    <div className="flex items-start justify-between">
                      <RatingSquare value={review.rating} />
                      <span className="text-xs text-muted">{timeAgo(review.createdAt)}</span>
                    </div>
                    <div className="mt-4 flex items-start gap-4">
                      <p className="flex-1 leading-relaxed">{review.comment}</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={DISH_IMAGES[review.id % DISH_IMAGES.length]}
                        alt=""
                        aria-hidden="true"
                        className="h-20 w-24 shrink-0 rounded-lg border border-border object-cover"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      ) : (
        <section className="mt-10 rounded-2xl border border-dashed border-accent/40 p-10 text-center">
          <p className="text-base font-medium">No reviews yet</p>
          <p className="mx-auto mt-2 max-w-[32ch] text-sm text-muted">
            This place is waiting for its first review. Yours would set the tone.
          </p>
        </section>
      )}

      {/* Fixed bottom CTA, always in reach on mobile */}
      <div className="fixed inset-x-0 bottom-0 z-30 px-5 pb-4">
        <Link
          href={`/review/${id}`}
          className="mx-auto block max-w-[520px] rounded-xl bg-accent py-4 text-center text-sm font-bold text-white shadow-lg shadow-black/30 transition-colors hover:bg-accent-deep"
        >
          {hasReviews ? "Write a Review" : "Be the first to review"}
        </Link>
      </div>
    </main>
  );
}
