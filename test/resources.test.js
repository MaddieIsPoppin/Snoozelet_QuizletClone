import assert from "node:assert/strict";
import test from "node:test";
import { detectResourceType } from "../lib/resources.js";

test("detects supported resource providers without fetching them", () => {
  assert.equal(detectResourceType("https://docs.google.com/document/d/abc"), "google_docs");
  assert.equal(detectResourceType("https://docs.google.com/presentation/d/abc"), "google_slides");
  assert.equal(detectResourceType("https://docs.google.com/spreadsheets/d/abc"), "google_sheets");
  assert.equal(detectResourceType("https://drive.google.com/file/d/abc"), "google_drive");
  assert.equal(detectResourceType("https://youtu.be/abc"), "youtube");
  assert.equal(detectResourceType("https://www.youtube.com/watch?v=abc"), "youtube");
  assert.equal(detectResourceType("https://notebooklm.google.com/notebook/abc"), "notebooklm");
  assert.equal(detectResourceType("https://example.com/chapter.pdf"), "pdf");
  assert.equal(detectResourceType("https://example.com/page"), "website");
});

test("rejects malformed and unsafe resource URLs", () => {
  assert.equal(detectResourceType("not a url"), "");
  assert.equal(detectResourceType("javascript:alert(1)"), "");
});
