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
import type { Map, Site, Operator } from "@/types";
import imageCompression from "browser-image-compression";
import { AlertIcon, BackArrowIcon, CheckIcon, XIcon } from "@/components/icons";

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
  const autoSelectSiteRef = useRef(false);

  const [code, setCode] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [selectedMapId, setSelectedMapId] = useState<string>("");
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  const [rawFiles, setRawFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [compressing, setCompressing] = useState(false);

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [hotspots, setHotspots] = useState<HotspotItem[]>([]);

  const [maps, setMaps] = useState<Map[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>("");

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

  // ── Load operators ──────────────────────────────
  useEffect(() => {
    const supabase = createBrowserClient();
    supabase
      .from("operators")
      .select("*")
      .then(({ data }) => {
        setOperators((data ?? []) as Operator[]);
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
        const loaded = (data ?? []) as Site[];
        logger.debug("SubmitPage", "Sites loaded", { count: loaded.length });
        setSites(loaded);
        if (autoSelectSiteRef.current && loaded.length > 0) {
          setSelectedSiteId(loaded[0].id);
          autoSelectSiteRef.current = false;
        } else {
          setSelectedSiteId("");
        }
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
      setCompressing(true);
      setRawFiles((prev) => [...prev, ...files]);

      const newPreviews: string[] = [];
      let errorCount = 0;
      for (const file of files) {
        const reader = new FileReader();
        reader.onload = () => {
          newPreviews.push(reader.result as string);
          if (newPreviews.length === files.length) {
            setImagePreviews((prev) => [...prev, ...newPreviews]);
            setCompressing(false);
          }
        };
        reader.onerror = () => {
          errorCount++;
          if (errorCount + newPreviews.length === files.length) {
            setCompressing(false);
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

  // ── Validate form ──────────────────────────────────
  const validate = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = "Title is required.";
    if (!selectedMapId) errors.map = "Please select a map.";
    if (!selectedSiteId) errors.site = "Please select a site.";
    if (!selectedOperatorId) errors.operator = "Please select an operator.";
    if (rawFiles.length === 0) errors.images = "Please upload at least one screenshot image.";
    if (!userId) errors.user = "You must be signed in to submit a strategy.";
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [title, selectedMapId, selectedSiteId, selectedOperatorId, rawFiles.length, userId]);

  // ── Submit form ──────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    logger.info("SubmitPage", "Submit strategy click", { title: title.trim(), selectedMapId, selectedSiteId, hotspotCount: hotspots.length });
    setError(null);
    setSubmitting(true);

    try {
      const imageUrls: string[] = [];
      for (const file of rawFiles) {
        const compressed = await compressImage(file);
        const url = await uploadImage(compressed, userId!);
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
          operator_id: selectedOperatorId,
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
  }, [title, selectedMapId, selectedSiteId, selectedOperatorId, rawFiles, userId, tagsInput, description, hotspots, validate]);

  // ── No redirect on success — show message with link ──
  // (User stays on success page and can navigate manually)

  // ── Loading state ────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col flex-1 min-h-dvh bg-background text-foreground">
        <header className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="h-5 w-28 rounded bg-muted animate-pulse" />
          <div className="h-9 w-16 rounded-lg bg-muted animate-pulse" />
        </header>
        <div className="flex flex-col gap-6 p-5 max-w-[600px]">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="h-3 w-20 rounded bg-muted animate-pulse" />
              <div className="h-11 rounded-xl bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Success state ────────────────────────────────
  if (success) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-5 bg-background text-foreground min-h-dvh p-6 animate-in fade-in duration-400">
        <div className="w-16 h-16 rounded-full bg-success/20 border border-success/30 flex items-center justify-center shadow-[0_0_24px_-4px_oklch(0.70_0.18_145/0.25)]">
          <CheckIcon className="w-8 h-8 text-success animate-in zoom-in duration-300" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-foreground mb-1 animate-in fade-in slide-in-from-bottom-1 duration-400 delay-100">
            Strategy submitted for validation!
          </h2>
          <p className="text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-1 duration-400 delay-150">
            Your strategy has been queued for community review.
          </p>
        </div>
        <Button
          variant="outline"
          size="lg"
          className="h-12 rounded-xl mt-2"
          onClick={() => router.push(`/lobby/${code}`)}
        >
          <BackArrowIcon className="size-4 mr-2" />
          Back to Lobby
        </Button>
      </div>
    );
  }

  // ── Main form ─────────────────────────────────────
  return (
    <div className="flex flex-col flex-1 min-h-dvh bg-background text-foreground">
      {/* ── Header ───────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h1 className="text-base font-bold text-foreground">Submit Strategy</h1>
          <p className="text-xs text-muted-foreground">Room {code}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-11 min-w-[80px] rounded-xl text-sm font-medium text-muted-foreground hover:bg-card hover:text-foreground transition-all duration-200 active:scale-95"
            onClick={() => router.push(`/lobby/${code}`)}
          >
            <BackArrowIcon className="size-4 mr-1.5" />
            Back
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-6 p-5 pb-8 max-w-[600px] mx-auto w-full">

          {/* ── Error Banner ───────────────────────────── */}
          {error && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 animate-in fade-in slide-in-from-top-1 duration-200" role="alert" aria-live="polite">
              <AlertIcon className="size-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* ═══════ Form Section: Basic Info ═══════ */}
          <div className="flex flex-col gap-2">
            <h2 className="flex items-center gap-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              <span className="size-1.5 rounded-full bg-primary/40" />
              Basic Info
            </h2>
            <div className="bg-card border border-border rounded-xl p-4 space-y-4">
              {/* ── Title ───────────────────────────────── */}
              <section className="flex flex-col gap-1.5">
                <label
                  htmlFor="title"
                  className="flex items-center gap-1 text-xs font-semibold tracking-widest text-muted-foreground uppercase"
                >
                  Title
                  <span className="text-destructive">*</span>
                </label>
                <Input
                  id="title"
                  placeholder="e.g. Bank Default Plant"
                  value={title}
                  onChange={(e) => {
                    logger.debug("SubmitPage", "Title changed", { length: e.target.value.length });
                    setTitle(e.target.value);
                    if (validationErrors.title) setValidationErrors((prev) => ({ ...prev, title: "" }));
                  }}
                  maxLength={120}
                  className={cn(
                    "h-12 rounded-xl",
                    "transition-all duration-200",
                    validationErrors.title && "border-destructive/50 ring-destructive/20"
                  )}
                />
                {validationErrors.title && (
                  <p className="text-xs text-destructive" aria-live="polite">{validationErrors.title}</p>
                )}
              </section>

              {/* ── Description ────────────────────────────── */}
              <section className="flex flex-col gap-1.5">
                <label
                  htmlFor="description"
                  className="flex items-center gap-1 text-xs font-semibold tracking-widest text-muted-foreground uppercase"
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
                    "flex w-full rounded-xl border px-3.5 py-3 text-sm transition-all duration-200 resize-none min-h-[100px]",
                    "bg-input/50 border-border text-foreground",
                    "placeholder:text-muted-foreground/60",
                    "focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-input/80"
                  )}
                />
                <p className="text-xs text-muted-foreground/40 mt-1 text-right">
                  {description.length}/2000
                </p>
              </section>
            </div>
          </div>

          {/* ═══════ Form Section: Map/Site/Operator ═══════ */}
          <div className="flex flex-col gap-2">
            <h2 className="flex items-center gap-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              <span className="size-1.5 rounded-full bg-primary/40" />
              Map, Site &amp; Operator
            </h2>
            <div className="bg-card border border-border rounded-xl p-4 space-y-4">
              {/* ── Map ──────────────────────────── */}
              <section className="flex flex-col gap-1.5">
                <label
                  htmlFor="map"
                  className="flex items-center gap-1 text-xs font-semibold tracking-widest text-muted-foreground uppercase"
                >
                  Map
                  <span className="text-destructive">*</span>
                </label>
                <select
                  id="map"
                  value={selectedMapId}
                  onChange={(e) => {
                    logger.debug("SubmitPage", "Map selection changed", { mapId: e.target.value });
                    setSelectedMapId(e.target.value);
                    if (validationErrors.map) setValidationErrors((prev) => ({ ...prev, map: "" }));
                  }}
                  className={cn(
                    "flex h-12 w-full rounded-xl border px-3 py-2 text-sm transition-all duration-200",
                    "bg-input border-border text-foreground",
                    "focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
                    !selectedMapId && "text-muted-foreground",
                    validationErrors.map && "border-destructive/50 ring-destructive/20"
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
                {validationErrors.map && (
                  <p className="text-xs text-destructive" aria-live="polite">{validationErrors.map}</p>
                )}
              </section>

              {/* ── Site ─────────────────────────── */}
              <section className="flex flex-col gap-1.5">
                <label
                  htmlFor="site"
                  className="flex items-center gap-1 text-xs font-semibold tracking-widest text-muted-foreground uppercase"
                >
                  Site
                  <span className="text-destructive">*</span>
                </label>
                <select
                  id="site"
                  value={selectedSiteId}
                  onChange={(e) => {
                    logger.debug("SubmitPage", "Site selection changed", { siteId: e.target.value });
                    setSelectedSiteId(e.target.value);
                    if (validationErrors.site) setValidationErrors((prev) => ({ ...prev, site: "" }));
                  }}
                  disabled={!selectedMapId || sites.length === 0}
                  className={cn(
                    "flex h-12 w-full rounded-xl border px-3 py-2 text-sm transition-all duration-200",
                    "bg-input border-border text-foreground",
                    "focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
                    (!selectedMapId || sites.length === 0) && "opacity-50 cursor-not-allowed",
                    !selectedSiteId && sites.length > 0 && "text-muted-foreground",
                    validationErrors.site && "border-destructive/50 ring-destructive/20"
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
                {validationErrors.site && (
                  <p className="text-xs text-destructive" aria-live="polite">{validationErrors.site}</p>
                )}
              </section>

              {/* ── Operator ─────────────────────────── */}
              <section className="flex flex-col gap-1.5">
                <label
                  htmlFor="operator"
                  className="flex items-center gap-1 text-xs font-semibold tracking-widest text-muted-foreground uppercase"
                >
                  Operator
                  <span className="text-destructive">*</span>
                </label>
                <select
                  id="operator"
                  value={selectedOperatorId}
                  onChange={(e) => {
                    logger.debug("SubmitPage", "Operator selection changed", { operatorId: e.target.value });
                    setSelectedOperatorId(e.target.value);
                    if (validationErrors.operator) setValidationErrors((prev) => ({ ...prev, operator: "" }));
                  }}
                  className={cn(
                    "flex h-12 w-full rounded-xl border px-3 py-2 text-sm transition-all duration-200",
                    "bg-input border-border text-foreground",
                    "focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
                    !selectedOperatorId && "text-muted-foreground",
                    validationErrors.operator && "border-destructive/50 ring-destructive/20"
                  )}
                >
                  <option value="" disabled>
                    Select an operator…
                  </option>
                  {operators.map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.name} ({op.side})
                    </option>
                  ))}
                </select>
                {validationErrors.operator && (
                  <p className="text-xs text-destructive" aria-live="polite">{validationErrors.operator}</p>
                )}
              </section>
            </div>
          </div>

          {/* ═══════ Form Section: Tags ═══════ */}
          <div className="flex flex-col gap-2">
            <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Tags</h2>
            <div className="bg-card border border-border rounded-xl p-3 space-y-3">
              <section className="flex flex-col gap-1.5">
                <label
                  htmlFor="tags"
                  className="flex items-center gap-1 text-xs font-semibold tracking-widest text-muted-foreground uppercase"
                >
                  Tags
                </label>
                <Input
                  id="tags"
                  placeholder="e.g. plant, bank, default"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="h-12 rounded-xl transition-all duration-200"
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated keywords
                </p>
              </section>
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
            </div>
          </div>

          {/* ═══════ Form Section: Images ═══════ */}
          <div className="flex flex-col gap-2">
            <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Screenshots</h2>
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <section className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                  Images
                  <span className="text-destructive">*</span>
                  {imagePreviews.length > 0 && (
                    <span className="ml-1 text-primary font-normal tracking-normal">
                      ({imagePreviews.length}/10)
                    </span>
                  )}
                </label>
                {validationErrors.images && (
                  <p className="text-xs text-destructive" aria-live="polite">{validationErrors.images}</p>
                )}
              </section>

              {/* Compression indicator */}
              {compressing && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary animate-pulse">
                  <div className="size-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  Compressing…
                </div>
              )}

              {/* Preview thumbnails */}
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
                        <span className="absolute top-2 left-2 px-2 py-1 bg-primary text-primary-foreground text-xs font-bold rounded">
                          Cover
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage(i);
                        }}
                        className="absolute top-2 right-2 p-1 bg-card/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                        aria-label={`Remove image ${i + 1}`}
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Drop zone */}
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
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
                  "active:scale-[0.99]",
                  imagePreviews.length > 0
                    ? "border-border bg-card hover:bg-card/80"
                    : "border-muted bg-background hover:border-muted-foreground/20 hover:bg-card/30"
                )}
              >
                <div className="w-12 h-12 rounded-2xl border border-border bg-card flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-muted-foreground"
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
                <p className="text-sm text-muted-foreground font-semibold">
                  {imagePreviews.length > 0 ? "Add more images" : "Upload screenshots"}
                </p>
                <p className="text-xs text-muted-foreground">
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
            </div>
          </div>

          {/* ═══════ Form Section: Map Hotspot Editor ═══════ */}
          {selectedMap && (
            <div className="flex flex-col gap-2">
              <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Hotspots</h2>
              <div className="bg-card border border-border rounded-xl p-3 space-y-3">
                <section className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
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
                      Map Hotspots
                      {hotspots.length > 0 && (
                        <span className="ml-1 text-primary font-normal tracking-normal">
                          ({hotspots.length})
                        </span>
                      )}
                    </label>
                    <div className="flex items-center gap-2">
                      {hotspots.length > 0 && (
                        <button
                          onClick={handleClearHotspots}
                          className="text-xs text-muted-foreground hover:text-destructive transition-colors duration-200"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Tap on the map to place markers showing key positions and routes.
                  </p>

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
                          <p className="text-xs text-muted-foreground font-medium">
                            {hotspots.length} hotspot{hotspots.length !== 1 ? "s" : ""} placed — tap the map to add more
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {hotspots.map((h, i) => (
                              <div
                                key={h.id}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border text-xs"
                              >
                                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                                  {i + 1}
                                </span>
                                <span className="text-muted-foreground font-mono">
                                  {h.x_percent}%, {h.y_percent}%
                                </span>
                                <button
                                  onClick={() => handleRemoveHotspot(h.id)}
                                  className="ml-1 p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                                  aria-label={`Remove hotspot ${i + 1}`}
                                >
                                  <XIcon className="size-3.5" />
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
              </div>
            </div>
          )}

          {/* ── Submit ──────────────────────────────── */}
          <div className="sticky bottom-0 pt-4 pb-3 bg-background border-t border-border/30 mt-2">
            <Button
              size="lg"
              className={cn(
                "w-full h-14 rounded-2xl text-base font-bold tracking-wide",
                "bg-primary text-primary-foreground",
                "hover:bg-primary-hover active:bg-primary-active",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all duration-200",
                "shadow-[0_0_24px_-4px_oklch(0.65_0.22_25/0.25)]"
              )}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
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
