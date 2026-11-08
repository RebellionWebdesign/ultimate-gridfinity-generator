// Light or dark theme, shared by the landing page and the editor. The switch in the header
// goes round three modes: automatic (follows the system and changes with it), light, dark.
import { readConsent } from "./consent";

export type Theme = "light" | "dark";
export type ThemeMode = "auto" | "light" | "dark";

const STORAGE_KEY = "ugg.theme";
const NEXT: Record<ThemeMode, ThemeMode> = {
  auto: "light",
  light: "dark",
  dark: "auto",
};

// kept in a variable for the life of the page, so the listener is not lost
// (the build renders the landing page in Node, where there is no matchMedia)
const dark =
  typeof matchMedia === "function"
    ? matchMedia("(prefers-color-scheme: dark)")
    : undefined;
const systemTheme = (): Theme => (dark?.matches ? "dark" : "light");

// The choice is kept in the browser only after the user said yes to saving (consent.ts);
// before that the theme lasts for the visit and starts as automatic.
const storedMode = (): ThemeMode => {
  if (readConsent() !== "yes") return "auto";
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "auto";
  } catch {
    return "auto";
  }
};

class ThemeState {
  mode = $state<ThemeMode>(storedMode());
  /** what the system asks for now; only used in the automatic mode */
  private system = $state<Theme>(systemTheme());

  constructor() {
    if (!dark) return;
    // the automatic mode follows the system while the page is open
    const follow = () => {
      this.system = systemTheme();
      if (this.mode === "auto") this.apply();
    };
    dark.addEventListener("change", follow);
    // also when the page comes back to the front, in case a change was missed meanwhile
    addEventListener("focus", follow);
    document.addEventListener("visibilitychange", follow);
  }

  /** The theme that is shown. */
  get value(): Theme {
    return this.mode === "auto" ? this.system : this.mode;
  }

  /** The icon of the switch: the mode it is in. */
  get icon(): "monitor" | "sun" | "moon" {
    return { auto: "monitor", light: "sun", dark: "moon" }[this.mode] as
      "monitor" | "sun" | "moon";
  }

  /** What the switch says and does, for screen readers and the tooltip. */
  get label(): string {
    const now = { auto: `automatic (${this.system})`, light: "light", dark: "dark" }[
      this.mode
    ];
    const next = { auto: "automatic", light: "light", dark: "dark" }[NEXT[this.mode]];
    return `Theme: ${now}. Switch to ${next}`;
  }

  private apply(): void {
    // set it now: the preview reads the theme's colours in the same update
    document.documentElement.dataset.theme = this.value;
  }

  toggle(): void {
    this.mode = NEXT[this.mode];
    this.apply();
    this.persist();
  }

  /** Keeps the mode in the browser, only with consent; the automatic mode keeps nothing. */
  persist(): void {
    if (readConsent() !== "yes") return;
    try {
      if (this.mode === "auto") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, this.mode);
    } catch {
      // storage may be blocked; the theme still applies for this visit
    }
  }

  /** Removes the kept mode (saving was switched off); the page keeps its theme until closed. */
  forget(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // nothing to remove when storage is blocked
    }
  }
}

export const theme = new ThemeState();
