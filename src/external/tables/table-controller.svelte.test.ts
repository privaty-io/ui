import { describe, expect, test } from "vitest";

import { TableController } from "./table-controller.svelte";
import type { TableEditor } from "./types";

describe("editor state", () => {
  test("starts idle", () => {
    const controller = new TableController();

    expect(controller.editor).toEqual({ type: "idle" });
  });

  test("flips between editors and back to idle", () => {
    const controller = new TableController();

    controller.startCreate();
    expect(controller.editor).toEqual({ type: "create" });

    controller.startEdit("r1");
    expect(controller.editor).toEqual({ type: "edit", rowId: "r1" });

    controller.close();
    expect(controller.editor).toEqual({ type: "idle" });
  });

  test("triggers work without an attached table", () => {
    const controller = new TableController();

    controller.startEdit("r1");

    expect(controller.editor).toEqual({ type: "edit", rowId: "r1" });
  });
});

describe("prepare hook", () => {
  test("receives the target editor before the state flips", () => {
    const controller = new TableController();
    const seen: TableEditor[] = [];

    controller.attach((editor) => {
      seen.push(editor);
      expect(controller.editor).toEqual({ type: "idle" });
      return true;
    });

    controller.startEdit("r2");

    expect(seen).toEqual([{ type: "edit", rowId: "r2" }]);
    expect(controller.editor).toEqual({ type: "edit", rowId: "r2" });
  });

  test("vetoes the trigger when it returns false", () => {
    const controller = new TableController();
    controller.attach(() => false);

    controller.startCreate();
    controller.startEdit("r1");

    expect(controller.editor).toEqual({ type: "idle" });
  });

  test("re-triggering the open editor is a no-op that keeps the draft", () => {
    const controller = new TableController();
    let calls = 0;
    controller.attach(() => {
      calls += 1;
      return true;
    });

    controller.startEdit("r1");
    controller.startEdit("r1");
    controller.startCreate();
    controller.startCreate();

    expect(calls).toBe(2);
  });
});

describe("attachment", () => {
  test("a controller can only drive one table at a time", () => {
    const controller = new TableController();
    const detach = controller.attach(() => true);

    expect(() => controller.attach(() => true)).toThrowError(
      "TableController: a controller can only drive one <Table>",
    );

    detach();
    expect(() => controller.attach(() => true)).not.toThrow();
  });

  test("detaching stops prepare from being consulted", () => {
    const controller = new TableController();
    const detach = controller.attach(() => false);

    detach();
    controller.startCreate();

    expect(controller.editor).toEqual({ type: "create" });
  });
});
