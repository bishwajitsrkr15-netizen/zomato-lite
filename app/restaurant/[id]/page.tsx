import RestaurantView from "./RestaurantView";

// /restaurant/1 -> id is "1". Forward it; the view does the rest.
export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RestaurantView id={id} />;
}
