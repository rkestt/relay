"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { logger } from "@/lib/logger";
import { Badge } from "@/components/ui/badge";
import { MapViewer } from "@/components/maps/MapViewer";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Map, Site } from "@/types";
import imageCompression from "browser-image-compression";

interface HotspotItem {
  id: string;
  x_percent: number;
  y_percent: number;
}

function uid(): string {
  return Math.random().toString(36).substring(2, 9);
}

async function compressImage(file: File): Promise<File> {
  return imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: "image/webp",
  });
}

async function uploadImage(
  file: File,
  userId: string,
): Promise<string> {
  const supabase = createBrowserClient();

  const ext = file.name.split(".").pop() ?? "webp";
  const path = `${userId}/${uid()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("strategies")
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message ?? "Failed to upload image");
  }

  const { data: publicUrlData } = supabase.storage
    .from("strategies")
    .getPublicUrl(path);

  return publicUrlData.publicUrl;
}

export default function SubmitStrategyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [code, setCode] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [selectedMapId, setSelectedMapId] = useState<string>("");
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  const [rawFiles, setRawFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [hotspots, setHotspots] = useState<HotspotItem[]>([]);

  const [maps, setMaps] = useState<Map[]>([]);
  const [sites, setSites] = useState<Site[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // ── Resolve params ─────────────────────────────────
  useEffect(() => {
    logger.info("SubmitPage", "SubmitPage mount");
    params.then(({ code: c }) => setCode(c));
  }, [params]);

  // ── Get current user ───────────────────────────────
  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        logger.debug("SubmitPage", "User authenticated", { userId: data.user.id });
        setUserId(data.user.id);
      }
    });
  }, []);

  // ── Load maps ─────────────────────────────────────
  useEffect(() => {
    const supabase = createBrowserClient();
    supabase
      .from("maps")
      .select("*")
      .then(({ data }) => {
        logger.debug("SubmitPage", "Maps loaded", { count: data?.length ?? 0 });
        setMaps((data ?? []) as Map[]);
        setLoading(false);
      });
  }, []);

  // ── Load sites when map changes ───────────────────
  useEffect(() => {
    if (!selectedMapId) {
      setSites([]);
      setSelectedSiteId("");
      return;
    }
    logger.debug("SubmitPage", "Loading sites for map", { selectedMapId });
    const supabase = createBrowserClient();
    supabase
      .from("sites")
      .select("*")
      .eq("map_id", selectedMapId)
      .then(({ data }) => {
        logger.debug("SubmitPage", "Sites loaded", { count: data?.length ?? 0 });
        setSites((data ?? []) as Site[]);
        setSelectedSiteId("");
      });
  }, [selectedMapId]);

  const selectedMap = maps.find((m) => m.id === selectedMapId);

  // ── Handle file selection ─────────────────────────
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length === 0) return;

      const validTypes = ["image/png", "image/jpeg", "image/webp", "image/avif"];
      for (const file of files) {
        if (!validTypes.includes(file.type)) {
          logger.warn("SubmitPage", "Invalid file type", { type: file.type });
          setError("Please select PNG, JPEG, WebP, or AVIF images.");
          return;
        }
        if (file.size > 20 * 1024 * 1024) {
          logger.warn("SubmitPage", "File too large", { size: file.size });
          setError("Each image must be under 20 MB.");
          return;
        }
      }

      if (rawFiles.length + files.length > 10) {
        setError("Maximum 10 images per strategy.");
        return;
      }

      logger.debug("SubmitPage", "Files selected", { count: files.length });
      setError(null);
      setRawFiles((prev) => [...prev, ...files]);

      const newPreviews: string[] = [];
      for (const file of files) {
        const reader = new FileReader();
        reader.onload = () => {
          newPreviews.push(reader.result as string);
          if (newPreviews.length === files.length) {
            setImagePreviews((prev) => [...prev, ...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
      }

      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [rawFiles.length],
  );

  const handleRemoveImage = useCallback((index: number) => {
    setRawFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handlePlaceHotspot = useCallback((x: number, y: number) => {
    setHotspots((prev) => [
      ...prev,
      { id: uid(), x_percent: Math.round(x * 100) / 100, y_percent: Math.round(y * 100) / 100 },
    ]);
  }, []);

  const handleRemoveHotspot = useCallback((id: string) => {
    setHotspots((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const handleClearHotspots = useCallback(() => {
    setHotspots([]);
  }, []);

  // ── Submit form ───────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!selectedMapId) {
      setError("Please select a map.");
      return;
    }
    if (!selectedSiteId) {
      setError("Please select a site.");
      return;
    }
    if (rawFiles.length === 0) {
      setError("Please upload at least one screenshot image.");
      return;
    }
    if (!userId) {
      setError("You must be signed in to submit a strategy.");
      return;
    }

    logger.info("SubmitPage", "Submit strategy click", { title: title.trim(), selectedMapId, selectedSiteId, hotspotCount: hotspots.length });
    setError(null);
    setSubmitting(true);

    try {
      const imageUrls: string[] = [];
      for (const file of rawFiles) {
        const compressed = await compressImage(file);
        const url = await uploadImage(compressed, userId);
        imageUrls.push(url);
      }

      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch("/api/strategies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          map_id: selectedMapId,
          site_id: selectedSiteId,
          description: description.trim() || undefined,
          tags,
          images: imageUrls,
          hotspots: hotspots.map((h) => ({
            x_percent: h.x_percent,
            y_percent: h.y_percent,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to submit strategy");
      }

      logger.info("SubmitPage", "Strategy submitted successfully");
      setSuccess(true);
    } catch (err) {
      logger.error("SubmitPage", "Strategy submit failed", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }, [title, selectedMapId, selectedSiteId, rawFiles, userId, tagsInput, description, hotspots]);

  // ── Redirect after success ────────────────────────
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => {
      router.push(`/lobby/${code}`);
    }, 2000);
    return () => clearTimeout(timer);
  }, [success, router, code]);

  // ── Loading state ────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col flex-1 min-h-screen bg-neutral-950 text-neutral-50">
        <header className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <div className="h-5 w-28 rounded bg-neutral-800 animate-pulse" />
          <div className="h-9 w-16 rounded-lg bg-neutral-800 animate-pulse" />
        </header>
        <div className="flex flex-col gap-6 p-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="h-3 w-20 rounded bg-neutral-800 animate-pulse" />
              <div className="h-11 rounded-xl bg-neutral-800 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Success state ────────────────────────────────
  if (success) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-5 bg-neutral-950 text-neutral-50 min-h-screen p-6 animate-in fade-in duration-400">
        <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center shadow-[0_0_24px_-4px_rgba(34,197,94,0.25)]">
          <svg
            className="w-8 h-8 text-green-400 animate-in zoom-in duration-300"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-neutral-50 mb-1 animate-in fade-in slide-in-from-bottom-1 duration-400 delay-100">
            Strategy Submitted
          </h2>
          <p className="text-sm text-neutral-400 animate-in fade-in slide-in-from-bottom-1 duration-400 delay-150">
            Your strategy has been queued for community validation.
          </p>
        </div>
        <div className="w-6 h-6 border-2 border-neutral-700 border-t-neutral-50 rounded-full animate-spin" />
        <p className="text-xs text-neutral-600 animate-pulse">Redirecting to lobby…</p>
      </div>
    );
  }

  // ── Main form ────────────────────────────────────
  return (
    <div className="flex flex-col flex-1 min-h-screen bg-neutral-950 text-neutral-50">
      {/* ── Header ───────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
        <div>
          <h1 className="text-base font-bold text-neutral-50">Submit Strategy</h1>
          <p className="text-xs text-neutral-500">Room {code}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-11 min-w-[80px] rounded-xl text-sm font-medium text-neutral-400 hover:bg-neutral-800 hover:text-neutral-50 transition-all duration-200 active:scale-95"
          onClick={() => router.push(`/lobby/${code}`)}
        >
          <svg
            className="size-4 mr-1.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-6 p-5 pb-8">

          {/* ── Error Banner ───────────────────────────── */}
          {error && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-400/10 border border-red-400/20 animate-in fade-in slide-in-from-top-1 duration-200">
              <svg
                className="size-5 text-red-400 flex-shrink-0 mt-0.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* ── Title ───────────────────────────────── */}
          <section className="flex flex-col gap-2">
            <label
              htmlFor="title"
              className="flex items-center gap-1.5 text-xs font-semibold tracking-widest text-neutral-500 uppercase"
            >
              Title
              <span className="text-red-400">*</span>
            </label>
            <Input
              id="title"
              placeholder="e.g. Bank Default Plant"
              value={title}
              onChange={(e) => {
                logger.debug("SubmitPage", "Title changed", { length: e.target.value.length });
                setTitle(e.target.value);
              }}
              maxLength={120}
              className={cn(
                "h-12 rounded-xl",
                "bg-neutral-900 border-neutral-800 text-neutral-50",
                "placeholder:text-neutral-600",
                "focus:border-amber-500/50 focus:ring-amber-500/20",
                "transition-all duration-200"
              )}
            />
          </section>

          {/* ── Map Selection ──────────────────────────── */}
          <section className="flex flex-col gap-2">
            <label
              htmlFor="map"
              className="flex items-center gap-1.5 text-xs font-semibold tracking-widest text-neutral-500 uppercase"
            >
              Map
              <span className="text-red-400">*</span>
            </label>
            <select
              id="map"
              value={selectedMapId}
              onChange={(e) => {
                logger.debug("SubmitPage", "Map selection changed", { mapId: e.target.value });
                setSelectedMapId(e.target.value);
              }}
              className={cn(
                "flex h-12 w-full rounded-xl border-2 px-3 py-2 text-sm transition-all duration-200",
                "bg-neutral-900 border-neutral-800 text-neutral-200",
                "focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20",
                !selectedMapId && "text-neutral-500",
              )}
            >
              <option value="" disabled>
                Select a map…
              </option>
              {maps.map((map) => (
                <option key={map.id} value={map.id}>
                  {map.name}
                </option>
              ))}
            </select>
          </section>

          {/* ── Site Selection ─────────────────────────── */}
          <section className="flex flex-col gap-2">
            <label
              htmlFor="site"
              className="flex items-center gap-1.5 text-xs font-semibold tracking-widest text-neutral-500 uppercase"
            >
              Site
              <span className="text-red-400">*</span>
            </label>
            <select
              id="site"
              value={selectedSiteId}
              onChange={(e) => {
                logger.debug("SubmitPage", "Site selection changed", { siteId: e.target.value });
                setSelectedSiteId(e.target.value);
              }}
              disabled={!selectedMapId || sites.length === 0}
              className={cn(
                "flex h-12 w-full rounded-xl border-2 px-3 py-2 text-sm transition-all duration-200",
                "bg-neutral-900 border-neutral-800 text-neutral-200",
                "focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20",
                (!selectedMapId || sites.length === 0) && "opacity-50 cursor-not-allowed",
                !selectedSiteId && sites.length > 0 && "text-neutral-500",
              )}
            >
              <option value="" disabled>
                {!selectedMapId
                  ? "Select a map first…"
                  : sites.length === 0
                    ? "No sites for this map"
                    : "Select a site…"}
              </option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                  {site.floor ? ` (${site.floor})` : ""}
                </option>
              ))}
            </select>
          </section>

          {/* ── Description ────────────────────────────── */}
          <section className="flex flex-col gap-2">
            <label
              htmlFor="description"
              className="flex items-center gap-1.5 text-xs font-semibold tracking-widest text-neutral-500 uppercase"
            >
              Description
            </label>
            <textarea
              id="description"
              placeholder="Describe the strategy, key positions, and execution steps…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={2000}
              className={cn(
                "flex w-full rounded-xl border-2 px-3 py-2.5 text-sm transition-all duration-200 resize-none",
                "bg-neutral-900 border-neutral-800 text-neutral-200",
                "placeholder:text-neutral-600",
                "focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
              )}
            />
            <p className="text-xs text-neutral-600 mt-1 text-right">
              {description.length}/2000
            </p>
          </section>

          {/* ── Tags ──────────────────────────────────── */}
          <section className="flex flex-col gap-2">
            <label
              htmlFor="tags"
              className="flex items-center gap-1.5 text-xs font-semibold tracking-widest text-neutral-500 uppercase"
            >
              Tags
            </label>
            <Input
              id="tags"
              placeholder="e.g. plant, bank, default"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className={cn(
                "h-12 rounded-xl",
                "bg-neutral-900 border-neutral-800 text-neutral-200",
                "placeholder:text-neutral-600",
                "focus:border-amber-500/50 focus:ring-amber-500/20",
                "transition-all duration-200"
              )}
            />
            <p className="text-xs text-neutral-600">
              Comma-separated keywords
            </p>
            {tagsInput.trim() && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {tagsInput
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean)
                  .map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
              </div>
            )}
          </section>

          {/* ── Image Upload ──────────────────────────── */}
          <section className="flex flex-col gap-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold tracking-widest text-neutral-500 uppercase">
              Screenshots
              <span className="text-red-400">*</span>
              {imagePreviews.length > 0 && (
                <span className="ml-1 text-amber-400 font-normal tracking-normal">
                  ({imagePreviews.length}/5)
                </span>
              )}
            </label>

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {imagePreviews.map((preview, i) => (
                  <div key={i} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview}
                      alt={`Preview ${i + 1}`}
                      className="w-full h-32 object-cover rounded-xl"
                    />
                    {i === 0 && (
                      <span className="absolute top-2 left-2 px-2 py-1 bg-amber-500 text-neutral-950 text-xs font-bold rounded">
                        Cover
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage(i);
                      }}
                      className="absolute top-2 right-2 p-1 bg-neutral-900/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  fileInputRef.current?.click();
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Upload screenshots"
              className={cn(
                "relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 transition-all duration-200 cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30",
                "active:scale-[0.99]",
                imagePreviews.length > 0
                  ? "border-neutral-700 bg-neutral-900"
                  : "border-neutral-800 bg-neutral-950 hover:border-neutral-600"
              )}
            >
              <div className="w-12 h-12 rounded-2xl border border-neutral-800 bg-neutral-900 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-neutral-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </div>
              <p className="text-sm text-neutral-500 font-semibold">
                {imagePreviews.length > 0 ? "Add more images" : "Upload screenshots"}
              </p>
              <p className="text-xs text-neutral-600">
                PNG, JPEG, WebP or AVIF (max 20 MB each, up to 10 images)
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,image/avif"
              className="hidden"
              onChange={handleFileSelect}
            />
          </section>

          {/* ── Map Hotspot Editor ─────────────────────── */}
          {selectedMap && (
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-semibold tracking-widest text-neutral-500 uppercase">
                  <svg
                    className="size-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  Hotspots
                  {hotspots.length > 0 && (
                    <span className="ml-1 text-amber-400 font-normal tracking-normal">
                      ({hotspots.length})
                    </span>
                  )}
                </label>
                {hotspots.length > 0 && (
                  <button
                    onClick={handleClearHotspots}
                    className="text-xs text-neutral-500 hover:text-red-400 transition-colors duration-200"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* MapViewer in editable mode */}
              {selectedMap.image_url ? (
                <>
                  <MapViewer
                    imageUrl={selectedMap.image_url}
                    editable={true}
                    onPlaceHotspot={handlePlaceHotspot}
                    hotspots={hotspots.map((h, i) => ({
                      x_percent: h.x_percent,
                      y_percent: h.y_percent,
                      label: String(i + 1),
                    }))}
                  />

                  {/* Hotspot list */}
                  {hotspots.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-neutral-600 font-medium">
                        {hotspots.length} hotspot{hotspots.length !== 1 ? "s" : ""} placed — tap the map to add more
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {hotspots.map((h, i) => (
                          <div
                            key={h.id}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs"
                          >
                            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                              {i + 1}
                            </span>
                            <span className="text-neutral-400 font-mono">
                              {h.x_percent}%, {h.y_percent}%
                            </span>
                            <button
                              onClick={() => handleRemoveHotspot(h.id)}
                              className="ml-1 p-1 rounded text-neutral-600 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
                              aria-label={`Remove hotspot ${i + 1}`}
                            >
                              <svg
                                className="size-3.5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M18 6L6 18M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <EmptyState
                  title="No map image available"
                  description="Add a map screenshot to enable hotspot placement."
                  className="py-10"
                />
              )}
            </section>
          )}

          {/* ── Submit ──────────────────────────────── */}
          <div className="mt-2 pt-2">
            <Button
              size="lg"
              className={cn(
                "w-full h-14 rounded-2xl text-base font-bold tracking-wide",
                "bg-amber-500 text-neutral-950",
                "hover:bg-amber-400 active:scale-[0.99]",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all duration-200",
                "shadow-[0_0_24px_-4px_rgba(245,158,11,0.25)]"
              )}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="size-4 border-2 border-neutral-700 border-t-neutral-950 rounded-full animate-spin" />
                  Submitting…
                </span>
              ) : (
                <>
                  <svg
                    className="size-5 mr-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Submit for Validation
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}