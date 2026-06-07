import { useCallback, useEffect, useRef } from "react";
import type { SaveState } from "../components/SaveStatusPanel";

const DEBOUNCE_MS = 2000;
const PERIODIC_MS = 30000;

interface AutosavePayload {
  channelId: number;
  campaignId?: number | null;
  title: string;
  contentType: import("../../content-posts/content-posts.types").ContentType;
  contentJson: string;
  imageUrl: string | null;
  prompt?: string;
  aiModel?: string;
  postVariants: import("../../content-posts/content-posts.types").ContentPostVariant[];
}

interface UsePostAutosaveOptions {
  enabled: boolean;
  isDirty: boolean;
  isNew: boolean;
  postId: number | null;
  buildPayload: () => Promise<AutosavePayload>;
  onCreate: (payload: AutosavePayload) => Promise<number>;
  onUpdate: (postId: number, payload: AutosavePayload) => Promise<void>;
  onSaveStateChange?: (state: SaveState, error?: string) => void;
}

export function usePostAutosave({
  enabled,
  isDirty,
  isNew,
  postId,
  buildPayload,
  onCreate,
  onUpdate,
  onSaveStateChange,
}: UsePostAutosaveOptions) {
  const saveStateRef = useRef<SaveState>("idle");
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const periodicTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const savingRef = useRef(false);
  const postIdRef = useRef(postId);
  postIdRef.current = postId;

  const setSaveState = useCallback(
    (state: SaveState, error?: string) => {
      saveStateRef.current = state;
      onSaveStateChange?.(state, error);
    },
    [onSaveStateChange]
  );

  const runSave = useCallback(async () => {
    if (!enabled || savingRef.current) return;
    if (!isDirty && !isNew) return;

    savingRef.current = true;
    setSaveState("saving");

    try {
      const payload = await buildPayload();
      const currentPostId = postIdRef.current;

      if (currentPostId == null) {
        const createdId = await onCreate(payload);
        postIdRef.current = createdId;
      } else {
        await onUpdate(currentPostId, payload);
      }

      setSaveState("saved");
    } catch (error) {
      setSaveState("error", error instanceof Error ? error.message : "Autosave failed");
    } finally {
      savingRef.current = false;
    }
  }, [enabled, isDirty, isNew, buildPayload, onCreate, onUpdate, setSaveState]);

  useEffect(() => {
    if (!enabled) return;

    if (isDirty) {
      setSaveState("dirty");
    } else if (saveStateRef.current === "dirty") {
      setSaveState("idle");
    }
  }, [enabled, isDirty, setSaveState]);

  useEffect(() => {
    if (!enabled || !isDirty) return;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      void runSave();
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [enabled, isDirty, runSave]);

  useEffect(() => {
    if (!enabled) return;

    periodicTimerRef.current = setInterval(() => {
      if (isDirty) void runSave();
    }, PERIODIC_MS);

    return () => {
      if (periodicTimerRef.current) clearInterval(periodicTimerRef.current);
    };
  }, [enabled, isDirty, runSave]);

  const saveNow = useCallback(async () => {
    await runSave();
  }, [runSave]);

  return { saveNow };
}
