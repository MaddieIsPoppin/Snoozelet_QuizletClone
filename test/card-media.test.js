import assert from "node:assert/strict";
import test from "node:test";
import { normalizeCardImage } from "../lib/card-media.js";

test("normalizes an omitted card image to nullable fields", () => {
  assert.deepEqual(normalizeCardImage({}), {
    imageUrl: null,
    imagePublicId: null,
    imageAlt: null,
  });
});

test("accepts secure Cloudinary card images", () => {
  assert.deepEqual(
    normalizeCardImage({
      imageUrl: "https://res.cloudinary.com/demo/image/upload/v1/snoozelet/cards/cell.png",
      imagePublicId: "snoozelet/cards/cell",
      imageAlt: "A labelled cell",
    }),
    {
      imageUrl: "https://res.cloudinary.com/demo/image/upload/v1/snoozelet/cards/cell.png",
      imagePublicId: "snoozelet/cards/cell",
      imageAlt: "A labelled cell",
    }
  );
});

test("rejects partial, untrusted, and malformed card image metadata", () => {
  assert.throws(
    () => normalizeCardImage({ imageUrl: "https://res.cloudinary.com/demo/image/upload/a.png" }),
    /provided together/
  );
  assert.throws(
    () => normalizeCardImage({ imageUrl: "https://example.com/a.png", imagePublicId: "a" }),
    /secure Cloudinary/
  );
  assert.throws(
    () => normalizeCardImage({ imageUrl: "https://res.cloudinary.com/demo/image/upload/a.png", imagePublicId: "../a" }),
    /Invalid image asset ID/
  );
});
