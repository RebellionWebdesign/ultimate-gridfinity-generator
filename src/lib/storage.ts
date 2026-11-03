// How full the browser storage is. The models live in localStorage; browsers give it
// about 5 million characters per site (the exact limit differs and is not reported), so
// the bar is an estimate, not a promise.
export const STORAGE_LIMIT_CHARS = 5 * 1024 * 1024;

/** Above this share the bar warns that the next save may fail. */
export const STORAGE_WARN_AT = 0.8;

export interface StorageFill {
  /** 0 to 1 */
  fraction: number;
  /** for example "0.4 MB of about 5 MB" */
  text: string;
  warn: boolean;
}

const mb = (chars: number): string =>
  String(Math.round((chars / 1024 / 1024) * 10) / 10);

export const storageFill = (usedChars: number): StorageFill => {
  const fraction = Math.min(1, Math.max(0, usedChars / STORAGE_LIMIT_CHARS));
  return {
    fraction,
    text: `${mb(usedChars)} MB of about ${mb(STORAGE_LIMIT_CHARS)} MB`,
    warn: fraction >= STORAGE_WARN_AT,
  };
};
