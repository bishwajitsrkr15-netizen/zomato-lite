import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[560px] flex-col justify-center px-6">
      <p className="text-xs font-medium uppercase tracking-widest text-muted">Zomato Lite</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">
        One restaurant.
        <br />
        Real reviews.
      </h1>
      <p className="mt-4 text-muted">
        No listings, no search, no accounts &mdash; just Ludhiana Burrito, its ratings,
        and the people who ate there.
      </p>
      <Link
        href="/restaurant/1"
        className="mt-10 inline-block w-fit rounded-md bg-accent px-6 py-3.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        Ludhiana Burrito &rarr;
      </Link>
      <p className="mt-10 border-t border-border pt-6 text-xs text-muted">
        Indian &middot; Sector 32 &middot; ratings computed fresh from facts, every visit
      </p>
    </main>
  );
}
