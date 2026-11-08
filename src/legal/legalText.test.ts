import { describe, expect, it } from "vitest";
import { legalTextToHtml } from "./legalText";

describe("legalTextToHtml", () => {
  it("uses the first line as the title and skips the rules around it", () => {
    const html = legalTextToHtml(
      "––––––––––\nDatenschutzerklärung\n––––––––––\n\nText",
    );
    expect(html).toBe("<h1>Datenschutzerklärung</h1>\n<p>Text</p>");
  });

  it("makes numbered lines headings and keeps numbered paragraphs as paragraphs", () => {
    const html = legalTextToHtml("Titel\n\n1) Einleitung\n1.1 Erster Absatz");
    expect(html).toContain("<h2>1) Einleitung</h2>");
    expect(html).toContain("<p>1.1 Erster Absatz</p>");
  });

  it("groups consecutive dash lines into one list", () => {
    const html = legalTextToHtml("Titel\n- Eins\n- Zwei\nDanach");
    expect(html).toContain("<ul><li>Eins</li><li>Zwei</li></ul>");
    expect(html).toContain("<p>Danach</p>");
  });

  it("escapes markup and keeps the words unchanged", () => {
    const html = legalTextToHtml('Titel\n<b>"A" & B</b>');
    expect(html).toContain("&lt;b&gt;&quot;A&quot; &amp; B&lt;/b&gt;");
    expect(html).not.toContain("<b>");
  });

  it("turns web addresses into links without the closing punctuation", () => {
    const html = legalTextToHtml("Titel\nSiehe https://example.com/x.");
    expect(html).toContain(
      '<a href="https://example.com/x" target="_blank" rel="noopener">https://example.com/x</a>.',
    );
  });

  it("accepts Windows line endings and a byte order mark", () => {
    const html = legalTextToHtml(String.fromCharCode(0xfeff) + "Titel\r\n\r\nText\r\n");
    expect(html).toBe("<h1>Titel</h1>\n<p>Text</p>");
  });
});
