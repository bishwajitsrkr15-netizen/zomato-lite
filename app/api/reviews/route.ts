// POST /api/reviews — save a review.
// Contract:
//   in:  { "restaurantId": 1, "rating": 4, "comment": "Good, but slow service" }
//   out: 201 { "success": true, "reviewId": 4 }
//   or:  400 { "error": "<plain English reason>" }
//
// The backend never trusts the frontend. The star picker limited the rating
// to 1–5 in the UI, but anyone can POST here directly — so we check again.

import { sql } from "@/lib/db";

// Always computed at request time: an average is an answer, not a cached asset.
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const { restaurantId, rating, comment } = (body ?? {}) as {
    restaurantId?: unknown;
    rating?: unknown;
    comment?: unknown;
  };

  // Check 1: rating is an integer from 1 to 5
  if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return Response.json(
      { error: "Rating must be a whole number between 1 and 5" },
      { status: 400 }
    );
  }

  // Check 2: comment is a non-empty string after trimming whitespace
  if (typeof comment !== "string" || comment.trim().length === 0) {
    return Response.json({ error: "Comment cannot be empty" }, { status: 400 });
  }

  // Check 3: restaurantId must be a number, and must actually exist (database lookup)
  if (typeof restaurantId !== "number" || !Number.isInteger(restaurantId)) {
    return Response.json({ error: "restaurantId must be a number" }, { status: 400 });
  }
  const found = await sql.query("SELECT id FROM restaurants WHERE id = $1", [restaurantId]);
  if (found.length === 0) {
    return Response.json({ error: "Restaurant not found" }, { status: 400 });
  }

  // All checks passed. Write exactly one row — nothing else in the database changes.
  const inserted = await sql.query(
    "INSERT INTO reviews (restaurant_id, rating, comment) VALUES ($1, $2, $3) RETURNING id",
    [restaurantId, rating, comment]
  );
  const reviewId = Number(inserted[0].id);

  return Response.json({ success: true, reviewId }, { status: 201 });
}
