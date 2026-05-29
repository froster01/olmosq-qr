import assert from "node:assert/strict";
import test from "node:test";

import { shouldShowCategoryInCustomerMenu } from "./category-visibility";

test("shouldShowCategoryInCustomerMenu follows the category setting", () => {
  assert.equal(
    shouldShowCategoryInCustomerMenu({ isVisibleInMenu: true }),
    true
  );
  assert.equal(
    shouldShowCategoryInCustomerMenu({ isVisibleInMenu: false }),
    false
  );
});
