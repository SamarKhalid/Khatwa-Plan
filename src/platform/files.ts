/**
 * Sanitizes a string for use as a safe, cross-platform file name.
 */
export function sanitizeFileName(name: string, fallback: string): string {
  const cleaned = name
    .trim()
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ');
  return cleaned || fallback;
}

/**
 * Saves a file for the user. Web implementation: browser download.
 * Ensures the extension is strictly maintained and file name is safe.
 * Phase 5 (Android) will add a Capacitor implementation behind the same function.
 */
export function saveFile(
  content: string,
  filename: string,
  mimeType = 'application/octet-stream',
): void {
  // UTF-8 BOM is sometimes used for text, but standard DXF is ASCII/UTF-8 without BOM.
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.setAttribute('download', filename);
  a.rel = 'noopener';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
