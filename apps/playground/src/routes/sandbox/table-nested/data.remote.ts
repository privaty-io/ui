import { form, query } from "$app/server";
import {
  createChildSchema,
  updateChildSchema,
  updateParentSchema,
} from "./schema";

interface Child {
  id: string;
  parentId: string;
  label: string;
}

interface Parent {
  id: string;
  name: string;
  children: Child[];
}

// Children live flat, keyed by parentId — the shape a relational backend
// hands over; the query joins them under their parents.
const children: Child[] = [
  { id: "c1", parentId: "p1", label: "Batch 12" },
  { id: "c2", parentId: "p1", label: "Batch 19" },
  { id: "c3", parentId: "p2", label: "Case 4" },
];

const parentRows = [
  { id: "p1", name: "Comté" },
  { id: "p2", name: "Rioja" },
];

const getParents = query(async (): Promise<Parent[]> =>
  parentRows.map((parent) => ({
    ...parent,
    children: children.filter((child) => child.parentId === parent.id),
  })),
);

const createChild = form(createChildSchema, async (data) => {
  // data.parentId arrives from the inner table's hiddenFields input.
  children.push({
    id: crypto.randomUUID(),
    parentId: data.parentId,
    label: data.label,
  });
  void getParents().refresh();
});

const updateChild = form(updateChildSchema, async (data) => {
  const child = children.find((entry) => entry.id === data.id);
  if (child) child.label = data.label;
  void getParents().refresh();
});

const updateParent = form(updateParentSchema, async (data) => {
  const parent = parentRows.find((entry) => entry.id === data.id);
  if (parent) parent.name = data.name;
  void getParents().refresh();
});

export { createChild, getParents, updateChild, updateParent };
export type { Child, Parent };
