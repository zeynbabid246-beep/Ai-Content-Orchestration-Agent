import type { BrandImportStatus } from "../types/brandStudio.types";

export const brandStudioKeys = {
  all: ["brand-studio"] as const,
  detail: () => [...brandStudioKeys.all, "detail"] as const,
  job: (jobId: number) => [...brandStudioKeys.all, "jobs", jobId] as const,
};

export const importStatusCopy: Record<BrandImportStatus, { label: string; description: string }> = {
  queued: {
    label: "Queued",
    description: "The import request is saved and waiting for processing.",
  },
  processing: {
    label: "Processing",
    description: "Brand Studio is preparing a structured company profile.",
  },
  completed: {
    label: "Completed",
    description: "The brand profile is ready to use as team-level context.",
  },
  failed: {
    label: "Failed",
    description: "The import could not be completed. You can retry with the same URL.",
  },
};
