import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[560px] flex-col justify-center px-6">
      <p className="text-3xl font-semibold tracking-tight">Zomato Lite</p>
      <p className="mt-2 text-muted">One restaurant. Real reviews. No more, no less.</p>
      <Link
        href="/restaurant/1"
        className="mt-8 inline-block w-fit rounded-md bg-accent px-6 py-3 text-sm font-medium text-white hover:opacity-90"
      >
        Ludhiana Burrito &rarr;
      </Link>
    </main>
  );
}
