"use client";
import { FormEvent, useRef, useState } from "react";
import { useSafeEffect as useEffect } from "@/lib/use-safe-effect";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Garment } from "@/lib/types";

export default function WardrobePage() {
  const [items, setItems] = useState<Garment[]>([]);
  const [selected, setSelected] = useState<Garment | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    void api<Garment[]>("/garments")
      .then(setItems)
      .catch((e) => setError(e.message));
  }, []);
  async function upload(file?: File) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const item = await api<Garment>("/garments/upload", {
        method: "POST",
        body: file,
        headers: { "Content-Type": file.type },
      });
      setItems((old) => [item, ...old]);
      setSelected(item);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    const d = new FormData(e.currentTarget);
    try {
      const updated = await api<Garment>(`/garments/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: d.get("name") || null,
          category: d.get("category") || null,
          colour: d.get("colour") || null,
        }),
      });
      setItems((old) => old.map((i) => (i.id === updated.id ? updated : i)));
      setSelected(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update garment");
    }
  }
  return (
    <main className="dashPage">
      <header className="dashPageHeader">
        <div>
          <span className="dashEyebrow">Your pieces</span>
          <h1>My wardrobe</h1>
          <p>Keep the pieces you own or are considering ready for a visual try-on.</p>
        </div>
        <button
          className="goldAction"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Uploading…" : "＋ Add garment"}
        </button>
        <input
          hidden
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => upload(e.target.files?.[0])}
        />
      </header>
      {error && <div className="formError">{error}</div>}
      {items.length ? (
        <div className="wardrobeGrid">
          {items.map((item) => (
            <article key={item.id}>
              <button className="garmentImage" onClick={() => setSelected(item)}>
                <img src={item.image_url} alt={item.name || "Wardrobe garment"} />
                <span>Edit details</span>
              </button>
              <div>
                <h3>{item.name || "Untitled piece"}</h3>
                <p>
                  {[item.category, item.colour].filter(Boolean).join(" · ") || "Details not added"}
                </p>
                <Link href={`/dashboard/try-ons?garment=${item.id}`}>Try it on →</Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <button className="uploadEmpty" onClick={() => inputRef.current?.click()}>
          <span>＋</span>
          <h2>Add your first garment</h2>
          <p>Upload a clear photo on a plain background. JPG, PNG or WebP, up to 10MB.</p>
          <strong>Choose an image</strong>
        </button>
      )}
      {selected && (
        <div className="modalBackdrop" onMouseDown={() => setSelected(null)}>
          <form className="editModal" onSubmit={save} onMouseDown={(e) => e.stopPropagation()}>
            <button type="button" className="modalClose" onClick={() => setSelected(null)}>
              ×
            </button>
            <img src={selected.image_url} alt="Garment" />
            <div>
              <span className="dashEyebrow">Garment details</span>
              <h2>Tell Clo about this piece</h2>
              <label>
                Name
                <input
                  name="name"
                  defaultValue={selected.name ?? ""}
                  placeholder="e.g. Indigo aso-oke set"
                />
              </label>
              <label>
                Category
                <select name="category" defaultValue={selected.category ?? ""}>
                  <option value="">Choose category</option>
                  <option value="tops">Tops</option>
                  <option value="bottoms">Bottoms</option>
                  <option value="one-pieces">One-pieces</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label>
                Colour
                <input
                  name="colour"
                  defaultValue={selected.colour ?? ""}
                  placeholder="e.g. Royal blue"
                />
              </label>
              <button className="goldAction">Save details</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
