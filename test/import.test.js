import assert from "node:assert/strict";
import test from "node:test";

import { parseCards } from "../lib/import.js";

test("parses CSV headers, quoted commas, and escaped quotes", () => {
  assert.deepEqual(
    parseCards(
      'term,definition\n"La cuenta, por favor","The check, please"\n"say ""hello""",greeting',
      "csv"
    ),
    [
      { term: "La cuenta, por favor", definition: "The check, please" },
      { term: 'say "hello"', definition: "greeting" },
    ]
  );
});

test("auto-detects tab, colon, CSV, and spaced-dash formats", () => {
  const parsed = parseCards(
    [
      "osmosis\tmovement of water",
      "nucleus: stores DNA",
      "ribosome,builds proteins",
      "actor-observer bias - explains behaviour by context",
    ].join("\n")
  );

  assert.deepEqual(parsed, [
    { term: "osmosis", definition: "movement of water" },
    { term: "nucleus", definition: "stores DNA" },
    { term: "ribosome", definition: "builds proteins" },
    { term: "actor-observer bias", definition: "explains behaviour by context" },
  ]);
});

test("uses the final spaced dash and ignores incomplete rows", () => {
  assert.deepEqual(
    parseCards("actor - observer bias - attribution pattern\nmissing definition\n - blank term"),
    [{ term: "actor - observer bias", definition: "attribution pattern" }]
  );
});

test("text mode does not interpret bare comma-separated lines as CSV", () => {
  assert.deepEqual(parseCards("term,definition", "text"), []);
});
