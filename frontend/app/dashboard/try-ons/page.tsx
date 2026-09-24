"use client";
import { FormEvent, useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import type { Garment, Generation, Profile, SubscriptionOverview } from "@/lib/types";
import { useSafeEffect as useEffect } from "@/lib/use-safe-effect";
export default function TryOnsPage() {
  const params = useSearchParams(),
    [items, setItems] = useState<Generation[]>([]),
    [garments, setGarments] = useState<Garment[]>([]),
    [profile, setProfile] = useState<Profile | null>(null),
    [plan, setPlan] = useState<SubscriptionOverview | null>(null),
    [creating, setCreating] = useState(false),
    [showForm, setShowForm] = useState(false),
    [garmentSource, setGarmentSource] = useState<"ai" | "wardrobe">("wardrobe"),
    [selectedImage, setSelectedImage] = useState<string | null>(null),
    [error, setError] = useState("");
  const load = useCallback(
    () =>
      api<Generation[]>("/generations")
        .then(setItems)
        .catch(() => {}),
    [],
  );
  useEffect(() => {
    setShowForm(Boolean(params.get("garment") || params.get("prompt")));
    setGarmentSource(params.get("source") === "ai" ? "ai" : "wardrobe");
    void Promise.all([
      api<Generation[]>("/generations"),
      api<Garment[]>("/garments"),
      api<Profile>("/profile"),
      api<SubscriptionOverview>("/subscriptions/current"),
    ])
      .then(([g, w, p, s]) => {
        setItems(g);
        setGarments(w);
        setProfile(p);
        setPlan(s);
      })
      .catch((e) => setError(e.message));
  }, [params]);
  useEffect(() => {
    if (!items.some((i) => i.status === "pending" || i.status === "processing")) return;
    const timer = setInterval(load, 4000);
    return () => clearInterval(timer);
  }, [items, load]);
  useEffect(() => {
    if (!selectedImage) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedImage(null);
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [selectedImage]);
  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    setError("");
    const d = new FormData(e.currentTarget),
      type = String(d.get("type"));
    try {
      const g = await api<Generation>("/generations", {
        method: "POST",
        body: JSON.stringify({
          type,
          garmentId: garmentSource === "wardrobe" ? d.get("garmentId") : undefined,
          generateGarment: garmentSource === "ai",
          genericModelGender: type === "generic_model" ? d.get("genericModelGender") : undefined,
          prompt: d.get("prompt") || undefined,
        }),
      });
      setItems((old) => [g, ...old]);
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Try-on could not be started");
    } finally {
      setCreating(false);
    }
  }
  const title = (item: Generation) =>
    garments.find((g) => g.image_url === item.garment_image_url)?.name?.trim() || "Virtual try-on";
  return (
    <main className="dashPage">
      <header className="dashPageHeader">
        <div>
          <span className="dashEyebrow">Visual studio</span>
          <h1>My try-ons</h1>
          <p>See the possibilities before you buy, borrow or call your tailor.</p>
        </div>
        <button className="goldAction" onClick={() => setShowForm(true)}>
          ＋ Create try-on
        </button>
      </header>
      {error && <div className="formError">{error}</div>}
      {items.length ? (
        <div className="generationGrid">
          {items.map((item) => (
            <article key={item.id}>
              <div className="generationImage">
                {item.output_image_url ? (
                  <button
                    type="button"
                    className="generationPreviewButton"
                    onClick={() => setSelectedImage(item.output_image_url!)}
                    aria-label="Enlarge generated try-on"
                  >
                    <img src={item.output_image_url} alt="Completed virtual try-on" />
                    <span>View larger</span>
                  </button>
                ) : item.garment_image_url ? (
                  <img src={item.garment_image_url} alt="Try-on garment" />
                ) : (
                  <span>◎</span>
                )}
                <div className={`generationOverlay ${item.status}`}>
                  {item.status === "pending" || item.status === "processing" ? (
                    <>
                      <i />
                      <strong>
                        {item.status === "pending" ? "In the queue" : "Clo is creating…"}
                      </strong>
                    </>
                  ) : item.status === "failed" ? (
                    <strong>Generation failed</strong>
                  ) : null}
                </div>
              </div>
              <h3>{title(item)}</h3>
              <p>
                {item.type === "own_photo" ? "Your photo" : "AskClo model"} ·{" "}
                {new Date(item.created_at).toLocaleDateString()}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <div className="emptyDash large">
          <span>◎</span>
          <h3>No try-ons yet</h3>
          <p>Generate Clo&apos;s recommended outfit or visualise a wardrobe piece on a model.</p>
          <button onClick={() => setShowForm(true)}>Create your first try-on</button>
        </div>
      )}
      {showForm && (
        <div className="modalBackdrop" onMouseDown={() => setShowForm(false)}>
          <form className="tryOnModal" onSubmit={create} onMouseDown={(e) => e.stopPropagation()}>
            <button type="button" className="modalClose" onClick={() => setShowForm(false)}>
              ×
            </button>
            <span className="dashEyebrow">New visualisation</span>
            <h2>Create a try-on</h2>
            <p>Use Clo&apos;s recommended look or choose a piece from your wardrobe.</p>
            <>
                <label>
                  Garment source
                  <select
                    value={garmentSource}
                    onChange={(event) => setGarmentSource(event.target.value as "ai" | "wardrobe")}
                  >
                    <option value="ai">Generate Clo&apos;s outfit with AI</option>
                    <option value="wardrobe">Choose from my wardrobe</option>
                  </select>
                </label>
                {garmentSource === "ai" ? (
                  <div className="tryOnSourceNote">
                    Clo will first create the garment from the styling direction, then place it on your selected model.
                  </div>
                ) : garments.length ? (
                <label>
                  Garment
                  <select required name="garmentId" defaultValue={params.get("garment") ?? ""}>
                    <option value="" disabled>
                      Select a piece
                    </option>
                    {garments.map((g) => (
                      <option value={g.id} key={g.id}>
                        {g.name || `${g.colour || "Untitled"} ${g.category || "piece"}`}
                      </option>
                    ))}
                  </select>
                </label>
                ) : (
                  <div className="formError">Add a garment to your wardrobe or use Clo&apos;s AI outfit.</div>
                )}
                <label>
                  Try-on type
                  <select name="type" defaultValue="generic_model">
                    <option value="generic_model">AskClo model</option>
                    {plan?.entitlements.ownPhotoTryOn && profile?.photo_url && (
                      <option value="own_photo">My profile photo</option>
                    )}
                  </select>
                </label>
                <label>
                  Model presentation
                  <select
                    name="genericModelGender"
                    defaultValue={profile?.gender === "male" ? "male" : "female"}
                  >
                    <option value="female">Female model</option>
                    <option value="male">Male model</option>
                  </select>
                </label>
                <label>
                  Styling direction {garmentSource === "wardrobe" && <span>(optional)</span>}
                  <textarea
                    name="prompt"
                    required={garmentSource === "ai"}
                    maxLength={2000}
                    defaultValue={params.get("prompt")?.slice(0, 2000) ?? ""}
                    placeholder="e.g. Style it for an evening wedding with understated gold accessories"
                  />
                </label>
                <button
                  className="goldAction"
                  disabled={creating || (garmentSource === "wardrobe" && !garments.length)}
                >
                  {creating ? "Starting generation…" : "Generate try-on"}
                </button>
              </>
          </form>
        </div>
      )}
      {selectedImage && (
        <div
          className="tryOnLightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Generated try-on preview"
          onMouseDown={() => setSelectedImage(null)}
        >
          <button
            type="button"
            className="lightboxClose"
            onClick={() => setSelectedImage(null)}
            aria-label="Close enlarged image"
          >
            ×
          </button>
          <img
            src={selectedImage}
            alt="Enlarged generated try-on"
            onMouseDown={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </main>
  );
}
