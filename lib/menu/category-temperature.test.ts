import assert from "node:assert/strict";
import test from "node:test";

import { shouldAskTemperatureForCategory } from "./category-temperature";

test("shouldAskTemperatureForCategory follows the category setting", () => {
  assert.equal(
    shouldAskTemperatureForCategory({ asksTemperature: true }),
    true
  );
  assert.equal(
    shouldAskTemperatureForCategory({ asksTemperature: false }),
    false
  );
});
