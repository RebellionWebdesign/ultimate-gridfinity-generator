// The user's choice about saving in this browser: models in local storage (autosave) and
// the app's files in the offline cache. Until the user says "yes", nothing of the editor is
// read from or written to the browser's storage; only this choice itself is, because it
// cannot be honoured otherwise.
export type Consent = "yes" | "no" | "unset";

export const CONSENT_KEY = "ugg.consent";

export interface ChoiceStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const browserStore = (): ChoiceStore | undefined => {
  try {
    return localStorage;
  } catch {
    return undefined;
  }
};

export const readConsent = (
  store: ChoiceStore | undefined = browserStore(),
): Consent => {
  try {
    const value = store?.getItem(CONSENT_KEY);
    return value === "yes" || value === "no" ? value : "unset";
  } catch {
    return "unset";
  }
};

/** Remembers the choice; false when the browser does not allow it (the choice then lasts for this visit). */
export const writeConsent = (
  value: "yes" | "no",
  store: ChoiceStore | undefined = browserStore(),
): boolean => {
  try {
    store?.setItem(CONSENT_KEY, value);
    return store !== undefined;
  } catch {
    return false;
  }
};
