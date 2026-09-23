const ALLOWED_TAGS = new Set(["p","br","h1","h2","h3","h4","h5","h6","strong","b","em","i","u","s","del","sup","sub","ul","ol","li","blockquote","pre","code","a","img","table","thead","tbody","tr","th","td","hr","div","span","section","aside","figure","figcaption"]);
const STYLE_TAGS = new Set(["p","h1","h2","h3","h4","h5","h6","div","span","th","td","blockquote","figcaption","section","aside"]);
function safeStyleDeclaration(property: string, value: string) {
  const p = property.trim().toLowerCase();
  const v = value.trim().toLowerCase().replace(/[<>"']/g, "");
  if (v.includes("url(") || v.includes("expression") || v.includes("javascript:")) return null;
  const rules: Record<string, RegExp> = {
    color: /^(#[0-9a-f]{3,8}|[a-z]+|rgb\((?:[^)]{1,48})\)|rgba\((?:[^)]{1,52})\)|hsl\((?:[^)]{1,48})\)|hsla\((?:[^)]{1,52})\))$/i,
    "background-color": /^(#[0-9a-f]{3,8}|[a-z]+|rgb\((?:[^)]{1,48})\)|rgba\((?:[^)]{1,52})\)|hsl\((?:[^)]{1,48})\)|hsla\((?:[^)]{1,52})\))$/i,
    "text-align": /^(left|right|center|justify|start|end)$/,
    "font-weight": /^(normal|bold|bolder|lighter|[1-9]00)$/,
    "font-style": /^(normal|italic|oblique)$/,
    "text-decoration": /^(none|underline|line-through|overline)$/,
    "font-size": /^(0|[0-9]+(?:\.[0-9]+)?)(px|rem|em|%|pt)?$/,
    "line-height": /^(normal|0|[0-9]+(?:\.[0-9]+)?)(px|rem|em|%)?$/,
  };
  return rules[p]?.test(v) ? `${p}:${v}` : null;
}

function cleanStyle(style: string) {
  return style.split(";").map((chunk) => chunk.trim()).filter(Boolean).map((chunk) => {
    const index = chunk.indexOf(":");
    if (index === -1) return null;
    return safeStyleDeclaration(chunk.slice(0, index), chunk.slice(index + 1));
  }).filter((chunk): chunk is string => Boolean(chunk)).join("; ");
}

export function sanitizeRichHtml(input: string | null | undefined): string {
  if (!input) return "";
  let html = input.replace(/<!--[\s\S]*?-->/g, "");
  html = html.replace(/<\s*(script|iframe|object|embed|form|svg|math|link|meta|base|template)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "");
  html = html.replace(/<\s*font([^>]*)>([\s\S]*?)<\s*\/\s*font\s*>/gi, (_full, attrs: string, body: string) => {
    const color = attrs.match(/\bcolor\s*=\s*["']([^"']+)["']/i)?.[1];
    return color && /^#[0-9a-f]{3,8}$/i.test(color) ? `<span style="color:${color}">${body}</span>` : `<span>${body}</span>`;
  });
  html = html.replace(/<\/?\s*([a-z0-9-]+)([^>]*)>/gi, (full, rawTag: string, rawAttrs: string) => {
    const tag = rawTag.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return tag === "br" || tag === "hr" ? `<${tag}>` : "";
    if (full.startsWith("</")) return `</${tag}>`;
    const attrs: string[] = [];
    const attrRe = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
    for (const match of rawAttrs.matchAll(attrRe)) {
      const name = String(match[1]).toLowerCase();
      const value = String(match[3] ?? match[4] ?? match[5] ?? "");
      if (name.startsWith("on") || name === "srcset") continue;
      if (name === "style") {
        if (!STYLE_TAGS.has(tag)) continue;
        const safeStyle = cleanStyle(value);
        if (safeStyle) attrs.push(` style="${safeStyle.replace(/&/g,"&amp;").replace(/"/g,"&quot;")}"`);
        continue;
      }
      const allowed =
        (tag === "a" && ["href","target","rel","title","id","aria-label"].includes(name)) ||
        (tag === "img" && ["src","alt","title","width","height","loading"].includes(name)) ||
        ((tag === "th" || tag === "td") && ["colspan","rowspan"].includes(name)) ||
        (name === "id" && ["h1","h2","h3","h4","h5","h6","div","section","aside","li","sup","a"].includes(tag)) ||
        (name === "role" && ["div","section","aside"].includes(tag)) ||
        (name === "aria-label" && ["div","section","aside","a"].includes(tag)) ||
        (name === "class" && ["p","h1","h2","h3","h4","h5","h6","div","span","section","aside","figure","figcaption","table","thead","tbody","tr","ul","ol","li","blockquote","pre","code","sup"].includes(tag));
      if (!allowed || /^(javascript:|vbscript:|data:text\/html)/i.test(value)) continue;
      attrs.push(` ${name}="${value.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;")}"`);
    }
    if (tag === "a") {
      attrs.push(' rel="noopener noreferrer"');
      if (!attrs.some((item) => /\starget=/.test(item))) attrs.push(' target="_blank"');
    }
    if (tag === "img" && !attrs.some((item) => /\sloading=/.test(item))) attrs.push(' loading="lazy"');
    return `<${tag}${attrs.join("")}>`;
  });
  return html.trim();
}
