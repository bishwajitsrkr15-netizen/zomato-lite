// GET /api/restaurants/[id] — everything the restaurant page needs, nothing else.
// Contract:
//   out 200 {
//     name, cuisine, area,                      <- facts
//     averageRating, totalReviews,              <- computed NOW (AVG, COUNT(*))
//     latestReview, reviews                     <- computed NOW (newest first)
//   }
//   out 404 { "error": "Restaurant not found" }
//
// No average_rating column exists — we ask the database for the average every
// single time, from the current facts. That is why it can never be stale.

import { sql } from "@/lib/db";

type ReviewRow = { id: number; rating: number; comment: string; created_at: Date };

// Always computed at request time: an average is an answer, not a cached asset.
export const dynamic = "force-dynamic";

export function toReview(row: ReviewRow) {
  return {
    id: Number(row.id),
    rating: Number(row.rating),
    comment: row.comment,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const restaurantId = Number(id);
  if (!Number.isInteger(restaurantId)) {
    return Response.json({ error: "Restaurant not found" }, { status: 404 });
  }

  const restaurants = await sql.query(
    "SELECT id, name, cuisine, area FROM restaurants WHERE id = $1",
    [restaurantId]
  );
  const restaurant = restaurants[0];
  if (!restaurant) {
    return Response.json({ error: "Restaurant not found" }, { status: 404 });
  }

  // Answer 1 and 2, computed fresh right now:
  //   averageRating -> AVG(rating), rounded to one decimal place HERE in the backend
  //   totalReviews  -> COUNT(*)
  const stats = await sql.query(
    "SELECT COUNT(*)::int AS total, AVG(rating) AS avg_rating FROM reviews WHERE restaurant_id = $1",
    [restaurantId]
  );
  const rawAvg = stats[0].avg_rating;
  const totalReviews = Number(stats[0].total);
  const averageRating =
    rawAvg == null ? null : Math.round(Number(rawAvg) * 10) / 10;

  // The reviews themselves: newest first.
  const rows = await sql.query(
    "SELECT id, rating, comment, created_at FROM reviews WHERE restaurant_id = $1 ORDER BY created_at DESC",
    [restaurantId]
  );
  const reviews = rows.map((row) => toReview(row as unknown as ReviewRow));

  // The page shows the latest review separately, so it must not be printed twice:
  // latestReview = the newest one; reviews = everything except it, newest first.
  // Empty case (nothing written yet — the first-visitor question): there are no
  // facts to average, so averageRating is null, totalReviews is 0, and there is
  // no latestReview. We send null and [] rather than inventing placeholder data;
  // the screen decides how to invite the first review.
  const latestReview = reviews.length > 0 ? reviews[0] : null;
  const olderReviews = reviews.slice(1);

  return Response.json({
    name: restaurant.name,
    cuisine: restaurant.cuisine,
    area: restaurant.area,
    averageRating,
    totalReviews,
    latestReview,
    reviews: olderReviews,
  });
}
