// Light or dark theme, shared by the landing page and the editor.
export type Theme = "light" | "dark";

const systemTheme = (): Theme =>
  matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const storedTheme = (): Theme | null => {
  try {
    const value = localStorage.getItem("ugg.theme");
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
};

class ThemeState {
  value = $state<Theme>(storedTheme() ?? systemTheme());

  toggle(): void {
    this.value = this.value === "dark" ? "light" : "dark";
    // set it now: the preview reads the theme's colours in the same update
    document.documentElement.dataset.theme = this.value;
    try {
      localStorage.setItem("ugg.theme", this.value);
    } catch {
      // storage may be blocked; the theme still applies for this visit
    }
  }
}

export const theme = new ThemeState();
