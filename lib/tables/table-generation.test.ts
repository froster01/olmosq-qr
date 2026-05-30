import assert from "node:assert/strict";
import { test } from "node:test";

import { getMissingTableCreateInputs } from "./table-generation";

test("getMissingTableCreateInputs creates T-numbered tables up to the requested total", () => {
  assert.deepEqual(getMissingTableCreateInputs([], 3), [
    { code: "T1", number: 1, name: "Table 1", isActive: true },
    { code: "T2", number: 2, name: "Table 2", isActive: true },
    { code: "T3", number: 3, name: "Table 3", isActive: true },
  ]);
});

test("getMissingTableCreateInputs only fills missing table numbers", () => {
  assert.deepEqual(
    getMissingTableCreateInputs(
      [
        { code: "T1", number: 1 },
        { code: "T3", number: 3 },
      ],
      4
    ),
    [
      { code: "T2", number: 2, name: "Table 2", isActive: true },
      { code: "T4", number: 4, name: "Table 4", isActive: true },
    ]
  );
});

test("getMissingTableCreateInputs rejects invalid counts", () => {
  assert.throws(() => getMissingTableCreateInputs([], 0), /at least 1/);
  assert.throws(() => getMissingTableCreateInputs([], 1.5), /at least 1/);
});
