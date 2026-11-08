import { describe, expect, it } from "vitest";
import { decodeLegalEnv, legalTextToHtml } from "./legalText";

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

describe("decodeLegalEnv", () => {
  const text = `Impressum\n\n1) Diensteanbieter\n${"Zeile\n".repeat(60)}`;
  const encoded = Buffer.from(text, "utf8").toString("base64");

  it("decodes a base64 text, also with a trailing line break", () => {
    expect(decodeLegalEnv("X", encoded)).toBe(text);
    expect(decodeLegalEnv("X", `${encoded}\n`)).toBe(text);
  });

  it("rejects a value that is not base64 and names the variable", () => {
    expect(() => decodeLegalEnv("LEGAL_X_B64", "LEGAL_X_B64=abc")).toThrow(
      /LEGAL_X_B64: not base64 \(length 15, starts with "LEGAL_X_B64="\)/,
    );
  });

  it("rejects base64 that does not decode to text or is too short", () => {
    const noise = Buffer.from([0xff, 0xfe, 0xfd, 0x80, 0x81, 0x82]).toString("base64");
    expect(() => decodeLegalEnv("X", noise)).toThrow(/does not decode to text/);
    expect(() => decodeLegalEnv("X", Buffer.from("kurz").toString("base64"))).toThrow(
      /too short/,
    );
  });
});
