import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("home, Study, and Progress redirect to the Library", () => {
  for (const file of ["app/page.js", "app/study/page.js", "app/progress/page.js"]) {
    assert.match(fs.readFileSync(file, "utf8"), /redirect\("\/library"\)/);
  }
});

test("Progress is absent from primary navigation", () => {
  assert.doesNotMatch(fs.readFileSync("components/AppShell.js", "utf8"), /\["Progress",/);
});
