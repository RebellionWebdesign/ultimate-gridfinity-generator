// Turns the plain text of a legal page (the privacy statement and the imprint, as the
// IT-Recht Kanzlei delivers them) into HTML without changing a word of it: the first line
// is the title, a line like `3) Hosting` is a heading, `- ` lines are a list, every other
// line is a paragraph. Used at build time by `vite.config.ts`.

const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Web addresses become links (the text itself stays as it is). */
const linkify = (escaped: string): string =>
  escaped.replace(
    /https?:\/\/[^\s<)]*[^\s<).,;]/g,
    (url) => `<a href="${url}" target="_blank" rel="noopener">${url}</a>`,
  );

const inline = (line: string): string => linkify(escapeHtml(line));

const BYTE_ORDER_MARK = String.fromCharCode(0xfeff);
const LINE_BREAK = new RegExp(String.raw`\r?\n`);
const withoutMark = (text: string): string =>
  text.startsWith(BYTE_ORDER_MARK) ? text.slice(1) : text;

export const legalTextToHtml = (text: string): string => {
  const out: string[] = [];
  let list: string[] = [];
  let hasTitle = false;
  const flush = (): void => {
    if (list.length > 0) out.push(`<ul>${list.join("")}</ul>`);
    list = [];
  };
  for (const raw of withoutMark(text).split(LINE_BREAK)) {
    const line = raw.trim();
    if (line === "") {
      flush();
    } else if (/^[–—-]{5,}$/.test(line)) {
      // the rules above and below the title of the delivered file
    } else if (!hasTitle) {
      out.push(`<h1>${inline(line)}</h1>`);
      hasTitle = true;
    } else if (/^\d+\)\s/.test(line)) {
      flush();
      out.push(`<h2>${inline(line)}</h2>`);
    } else if (line.startsWith("- ")) {
      list.push(`<li>${inline(line.slice(2))}</li>`);
    } else {
      flush();
      out.push(`<p>${inline(line)}</p>`);
    }
  }
  flush();
  return out.join("\n");
};
