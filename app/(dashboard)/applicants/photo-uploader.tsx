"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PhotoUploader({ applicantId }: { applicantId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function upload(formData: FormData) {
    const file = formData.get("photo");
    if (!(file instanceof File) || !file.size) return;
    setBusy(true); setMessage("");
    try {
      const presign = await fetch("/api/uploads/presign", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ applicantId, mimeType: file.type, size: file.size }) });
      const signed = await presign.json();
      if (!presign.ok) throw new Error(signed.error);
      const put = await fetch(signed.uploadUrl, { method: "PUT", headers: { "content-type": file.type }, body: file });
      if (!put.ok) throw new Error("Object storage rejected the photo.");
      const finalize = await fetch("/api/uploads/finalize", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ applicantId, objectKey: signed.objectKey, mimeType: file.type, size: file.size }) });
      const result = await finalize.json();
      if (!finalize.ok) throw new Error(result.error);
      setMessage("Photo uploaded."); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Photo upload failed."); }
    finally { setBusy(false); }
  }
  return <form action={upload} className="space-y-3"><div><label className="label" htmlFor="photo">JPEG, PNG, or WebP (maximum 5 MB)</label><input className="input" id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" required /></div><button className="button button-secondary" disabled={busy}>{busy ? "Uploading…" : "Upload / replace photo"}</button>{message ? <p className="text-sm" role="status">{message}</p> : null}</form>;
}
