"use client";

import { useId, useState } from "react";
import CardImage from "@/components/CardImage";
import { cardImageLimits } from "@/lib/card-media";

export default function ImageUploadField({
  initialUrl = "",
  initialPublicId = "",
  initialAlt = "",
}) {
  const inputId = useId();
  const [image, setImage] = useState({
    url: initialUrl || "",
    publicId: initialPublicId || "",
  });
  const [alt, setAlt] = useState(initialAlt || "");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function uploadImage(file) {
    setError("");
    if (!cardImageLimits.acceptedTypes.includes(file.type)) {
      setError("Choose a JPEG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > cardImageLimits.maxFileBytes) {
      setError("Images must be 5 MB or smaller.");
      return;
    }

    setStatus("uploading");
    try {
      const signatureResponse = await fetch("/api/uploads/image-signature", {
        method: "POST",
      });
      const signature = await signatureResponse.json();
      if (!signatureResponse.ok) throw new Error(signature.error || "Could not start upload");

      const formData = new FormData();
      formData.set("file", file);
      formData.set("api_key", signature.apiKey);
      formData.set("timestamp", String(signature.timestamp));
      formData.set("signature", signature.signature);
      formData.set("folder", signature.folder);

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
        { method: "POST", body: formData }
      );
      const uploaded = await uploadResponse.json();
      if (!uploadResponse.ok || !uploaded.secure_url || !uploaded.public_id) {
        throw new Error(uploaded.error?.message || "Image upload failed");
      }

      setImage({ url: uploaded.secure_url, publicId: uploaded.public_id });
      setStatus("success");
    } catch (uploadError) {
      setStatus("error");
      setError(uploadError.message || "Image upload failed");
    }
  }

  function removeImage() {
    setImage({ url: "", publicId: "" });
    setAlt("");
    setError("");
    setStatus("idle");
  }

  return (
    <fieldset className="card-image-field">
      <legend>Image (optional)</legend>
      <input type="hidden" name="imageUrl" value={image.url} />
      <input type="hidden" name="imagePublicId" value={image.publicId} />
      <input type="hidden" name="imageUploadPending" value={status === "uploading" ? "1" : "0"} />

      {image.url ? (
        <div className="card-image-preview">
          <CardImage src={image.url} alt={alt} />
          <button className="button" type="button" onClick={removeImage}>
            Remove image
          </button>
        </div>
      ) : null}

      <label htmlFor={inputId}>{image.url ? "Replace image" : "Choose image"}</label>
      <input
        id={inputId}
        type="file"
        accept={cardImageLimits.acceptedTypes.join(",")}
        disabled={status === "uploading"}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) uploadImage(file);
          event.target.value = "";
        }}
      />

      {image.url ? (
        <label>
          Image description
          <input
            name="imageAlt"
            value={alt}
            maxLength="300"
            placeholder="Describe the image for accessibility"
            onChange={(event) => setAlt(event.target.value)}
          />
        </label>
      ) : (
        <input type="hidden" name="imageAlt" value="" />
      )}

      {status === "uploading" ? <p className="helper" role="status">Uploading image…</p> : null}
      {status === "success" ? <p className="helper" role="status">Image ready to save.</p> : null}
      {error ? <p className="auth-error" role="alert">{error}</p> : null}
    </fieldset>
  );
}
