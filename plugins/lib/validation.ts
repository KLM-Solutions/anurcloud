/**
 * Shared upload validation — safe to import from both client and server
 * (pure, no server-only deps). Used by the /extraction page and /api/extract.
 *
 * M1 (upload-only scope) accepts files that carry profile details:
 *   - Documents: PDF, DOCX
 *   - Images:    JPG, PNG   (visiting cards, scanned docs)
 *   → all handled by one extraction engine (images are OCR'd natively).
 *
 * No app-level size limit. NOTE: upstream limits still apply — host request-body
 * caps (e.g. Vercel serverless ~4.5MB) and engine file limits. Truly large
 * files should move to a direct-to-storage + URL path later.
 */

import type { ProfileType } from "./types";

export const DOC_EXTENSIONS = [".pdf", ".docx"] as const;
export const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png"] as const;

export const DOC_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;
export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png"] as const;

/** A profile-source file = document OR image. */
export const SOURCE_EXTENSIONS = [...DOC_EXTENSIONS, ...IMAGE_EXTENSIONS];
export const SOURCE_MIME_TYPES = [...DOC_MIME_TYPES, ...IMAGE_MIME_TYPES];

/** For the file input `accept` attribute. */
export const ACCEPT_ATTR = [...SOURCE_EXTENSIONS, ...SOURCE_MIME_TYPES].join(",");

export const PROFILE_TYPES: readonly ProfileType[] = ["student", "professional"];

export type FileValidationCode = "NO_FILE" | "UNSUPPORTED_TYPE";
export interface FileValidationError {
  code: FileValidationCode;
  message: string;
}

interface FileLike {
  name: string;
  size: number;
  type: string;
}

function matchesType(
  file: FileLike,
  extensions: readonly string[],
  mimeTypes: readonly string[],
): boolean {
  const lower = file.name.toLowerCase();
  // MIME *or* extension — browsers/OSes are inconsistent (esp. DOCX).
  return mimeTypes.includes(file.type) || extensions.some((ext) => lower.endsWith(ext));
}

/** Validates a profile-source file (PDF/DOCX/JPG/PNG). `null` = valid. */
export function validateSourceFile(file: FileLike | null): FileValidationError | null {
  if (!file) {
    return { code: "NO_FILE", message: "Choose a PDF, DOCX, JPG, or PNG file." };
  }
  if (!matchesType(file, SOURCE_EXTENSIONS, SOURCE_MIME_TYPES)) {
    return { code: "UNSUPPORTED_TYPE", message: "Accepted: PDF, DOCX, JPG, or PNG." };
  }
  return null;
}

export function isProfileType(value: unknown): value is ProfileType {
  return typeof value === "string" && (PROFILE_TYPES as readonly string[]).includes(value);
}

/** Human-readable byte size, e.g. 1.4 MB. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
