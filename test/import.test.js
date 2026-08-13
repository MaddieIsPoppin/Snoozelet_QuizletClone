import assert from "node:assert/strict";
import test from "node:test";

import { parseCards, parseSmartPaste } from "../lib/import.js";

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

test("Smart Paste recognizes Q/A blocks and Snoozelet metadata", () => {
  const parsed = parseSmartPaste(`# Snoozelet
Subject: CMPG321
Folder: Study Unit 3
Set: Distributed Databases

Q: What is a DDBMS?
A: A DBMS managing one logical database across multiple sites.

Question: What is fragmentation?
Answer: Dividing a database into smaller pieces.`);
  assert.deepEqual(parsed.metadata, { subject: "CMPG321", folder: "Study Unit 3", set: "Distributed Databases" });
  assert.equal(parsed.cards.length, 2);
  assert.equal(parsed.cards[1].term, "What is fragmentation?");
});

test("Smart Paste reports incomplete Q/A blocks", () => {
  const parsed = parseSmartPaste("Q: Missing an answer");
  assert.equal(parsed.cards.length, 0);
  assert.equal(parsed.invalid.length, 1);
});

test("Smart Paste recognizes Module, Study Unit, and Deck metadata", () => {
  const parsed = parseSmartPaste("# SNOOZELET\nModule: CMPG324\nStudy Unit: Processes\nDeck: Scheduling\n\nQ: What is a process?\nA: A program in execution.");
  assert.deepEqual(parsed.metadata, { subject: "CMPG324", folder: "Processes", set: "Scheduling" });
  assert.equal(parsed.cards.length, 1);
});
