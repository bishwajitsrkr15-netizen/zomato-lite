import ReviewForm from "./ReviewForm";

// The restaurantId lives in the URL: /review/1 -> restaurantId is "1".
// This page only forwards it; the form (a client component) does the work.
export default async function ReviewPage({
  params,
}: {
  params: Promise<{ restaurantId: string }>;
}) {
  const { restaurantId } = await params;
  return <ReviewForm restaurantId={restaurantId} />;
}
