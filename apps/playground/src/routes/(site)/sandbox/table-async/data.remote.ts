import { query } from "$app/server";

interface SlowItem {
  id: string;
  name: string;
  price: number;
}

// Deliberately slow: the bench measures whether SSR blocks on the query
// and whether the veil shows during client loads and refreshes.
const getSlowRows = query(async (): Promise<SlowItem[]> => {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return [
    { id: "r1", name: "Comté", price: 89 },
    { id: "r2", name: "Rioja", price: 129 },
    { id: "r3", name: "Baguette", price: 24 },
  ];
});

export { getSlowRows };
export type { SlowItem };
