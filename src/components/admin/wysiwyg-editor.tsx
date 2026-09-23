"use client";

import * as React from "react";
import {
  AlignCenter, AlignLeft, AlignRight, Bold, Code2, Eye, Heading1, Heading2, Heading3,
  Image as ImageIcon, Italic, Link as LinkIcon, List, ListOrdered, Maximize2, Minimize2,
  Minus, Quote, Redo2, RemoveFormatting, Strikethrough, Table2, Underline, Undo2, Unlink,
  Lightbulb, AlertTriangle, Sparkles, Bookmark, CheckSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sanitizeRichHtml } from "@/lib/sanitize-rich-html";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  label?: string;
  helpText?: string;
  className?: string;
};

type ToolbarAction = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  command?: string;
  value?: string;
};

const TOOLBAR_GROUPS: ToolbarAction[][] = [
  [
    { key: "bold", label: "Tebal", icon: Bold, command: "bold" },
    { key: "italic", label: "Miring", icon: Italic, command: "italic" },
    { key: "underline", label: "Garis bawah", icon: Underline, command: "underline" },
    { key: "strike", label: "Coret", icon: Strikethrough, command: "strikeThrough" },
  ],
  [
    { key: "h1", label: "Heading 1", icon: Heading1, command: "formatBlock", value: "<h1>" },
    { key: "h2", label: "Heading 2", icon: Heading2, command: "formatBlock", value: "<h2>" },
    { key: "h3", label: "Heading 3", icon: Heading3, command: "formatBlock", value: "<h3>" },
    { key: "quote", label: "Kutipan", icon: Quote, command: "formatBlock", value: "<blockquote>" },
  ],
  [
    { key: "ul", label: "Daftar", icon: List, command: "insertUnorderedList" },
    { key: "ol", label: "Daftar bernomor", icon: ListOrdered, command: "insertOrderedList" },
    { key: "left", label: "Rata kiri", icon: AlignLeft, command: "justifyLeft" },
    { key: "center", label: "Rata tengah", icon: AlignCenter, command: "justifyCenter" },
    { key: "right", label: "Rata kanan", icon: AlignRight, command: "justifyRight" },
  ],
  [
    { key: "link", label: "Tautan", icon: LinkIcon },
    { key: "unlink", label: "Lepas tautan", icon: Unlink, command: "unlink" },
    { key: "image", label: "Upload gambar", icon: ImageIcon },
    { key: "table", label: "Tabel perbandingan", icon: Table2 },
    { key: "code", label: "Blok kode", icon: Code2, command: "formatBlock", value: "<pre>" },
    { key: "hr", label: "Garis pemisah", icon: Minus, command: "insertHorizontalRule" },
  ],
];

const INSERT_ACTIONS: ToolbarAction[] = [
  { key: "tip", label: "Callout tips", icon: Lightbulb },
  { key: "warning", label: "Callout peringatan", icon: AlertTriangle },
  { key: "summary", label: "Callout ringkasan", icon: CheckSquare },
  { key: "cta", label: "Inline CTA", icon: Sparkles },
  { key: "footnote", label: "Catatan kaki / sumber", icon: Bookmark },
];

function selectionInside(root: HTMLElement) {
  const selection = window.getSelection();
  return Boolean(selection && selection.rangeCount && selection.anchorNode && root.contains(selection.anchorNode));
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function insertHtmlAtRange(root: HTMLElement, range: Range | null, html: string) {
  const selection = window.getSelection();
  const workingRange = range?.cloneRange();
  if (!workingRange || !selection) {
    root.focus();
    return false;
  }
  selection.removeAllRanges();
  selection.addRange(workingRange);
  root.focus({ preventScroll: true });
  selection.removeAllRanges();
  selection.addRange(workingRange);
  const fragment = workingRange.createContextualFragment(sanitizeRichHtml(html));
  workingRange.deleteContents();
  workingRange.insertNode(fragment);
  const caret = document.createRange();
  caret.selectNodeContents(root);
  caret.collapse(false);
  selection.removeAllRanges();
  selection.addRange(caret);
  return true;
}

export function RichTextEditor({ value, onChange, placeholder = "Tulis konten…", minHeight = 320, label, helpText, className }: Props) {
  const editorRef = React.useRef<HTMLDivElement>(null);
  const savedRangeRef = React.useRef<Range | null>(null);
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const [sourceMode, setSourceMode] = React.useState(false);
  const [fullscreen, setFullscreen] = React.useState(false);
  const [wordCount, setWordCount] = React.useState(0);
  const [uploadingImage, setUploadingImage] = React.useState(false);

  const saveSelection = React.useCallback(() => {
    const root = editorRef.current;
    if (!root || !selectionInside(root)) return;
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    savedRangeRef.current = selection.getRangeAt(0).cloneRange();
  }, []);

  const restoreSelection = React.useCallback(() => {
    const range = savedRangeRef.current;
    const root = editorRef.current;
    const selection = window.getSelection();
    if (!range || !root || !selection) return false;
    try {
      selection.removeAllRanges();
      selection.addRange(range);
      return true;
    } catch {
      return false;
    }
  }, []);

  const updateStats = React.useCallback(() => {
    const text = editorRef.current?.innerText.replace(/\s+/g, " ").trim() || "";
    setWordCount(text ? text.split(" ").length : 0);
  }, []);

  const commit = React.useCallback(() => {
    const root = editorRef.current;
    if (!root) return;
    const safe = sanitizeRichHtml(root.innerHTML);
    if (safe !== root.innerHTML) root.innerHTML = safe;
    onChange(safe);
    updateStats();
    requestAnimationFrame(saveSelection);
  }, [onChange, saveSelection, updateStats]);

  React.useEffect(() => {
    if (sourceMode) return;
    const root = editorRef.current;
    if (!root) return;
    const safeValue = sanitizeRichHtml(value || "");
    if (root.innerHTML !== safeValue) root.innerHTML = safeValue;
    updateStats();
  }, [sourceMode, updateStats, value]);

  const execute = React.useCallback((command: string, commandValue?: string) => {
    const root = editorRef.current;
    if (!root) return;
    root.focus({ preventScroll: true });
    restoreSelection();
    try {
      document.execCommand("styleWithCSS", false, "true");
      document.execCommand(command, false, commandValue);
    } catch {
      return;
    }
    commit();
    saveSelection();
  }, [commit, restoreSelection, saveSelection]);

  const insertHtml = React.useCallback((html: string) => {
    const root = editorRef.current;
    if (!root) return;
    restoreSelection();
    const range = savedRangeRef.current?.cloneRange() || (() => { const r = document.createRange(); r.selectNodeContents(root); r.collapse(false); return r; })();
    if (insertHtmlAtRange(root, range, html)) {
      commit();
      saveSelection();
    }
  }, [commit, restoreSelection, saveSelection]);

  const promptLink = React.useCallback(() => {
    saveSelection();
    const url = window.prompt("URL tautan", "https://");
    if (!url?.trim()) return;
    execute("createLink", url.trim());
  }, [execute, saveSelection]);

  const insertImageFromUpload = React.useCallback(async (file: File) => {
    if (!file.type.startsWith("image/") || file.size > 15 * 1024 * 1024) return;
    setUploadingImage(true);
    saveSelection();
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("purpose", "content_image");
      body.append("visibility", "public");
      const response = await fetch("/api/media/upload", { method: "POST", body });
      const data = await response.json();
      if (!response.ok || !data.success || !data.media?.url) throw new Error(data.error?.message || "Upload gambar gagal");
      const alt = window.prompt("Alt text gambar", label || "Gambar konten") || "Gambar konten";
      insertHtml(`<figure class="rich-media"><img src="${escapeHtml(data.media.url)}" alt="${escapeHtml(alt.trim())}" loading="lazy"><figcaption>${escapeHtml(alt.trim())}</figcaption></figure><p><br></p>`);
    } catch {
      // Upload failure is intentionally non-blocking; the URL image command remains available.
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  }, [insertHtml, label, saveSelection]);

  const promptImage = React.useCallback(() => {
    saveSelection();
    const url = window.prompt("URL gambar publik", "https://");
    if (!url?.trim()) return;
    const alt = window.prompt("Alt text gambar", label || "Gambar konten") || "Gambar konten";
    insertHtml(`<figure class="rich-media"><img src="${escapeHtml(url.trim())}" alt="${escapeHtml(alt.trim())}" loading="lazy"><figcaption>${escapeHtml(alt.trim())}</figcaption></figure><p><br></p>`);
  }, [insertHtml, label, saveSelection]);

  const insertTable = React.useCallback(() => {
    const cols = Math.max(2, Math.min(5, Number(window.prompt("Jumlah kolom", "3") || 3)));
    const rows = Math.max(2, Math.min(8, Number(window.prompt("Jumlah baris data", "3") || 3)));
    const header = Array.from({ length: cols }, (_, i) => `<th>Kolom ${i + 1}</th>`).join("");
    const body = Array.from({ length: rows }, () => `<tr>${Array.from({ length: cols }, () => "<td>Isi</td>").join("")}</tr>`).join("");
    insertHtml(`<div class="rich-table-wrap"><table class="rich-table"><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table></div><p><br></p>`);
  }, [insertHtml]);

  const insertCallout = React.useCallback((kind: "tip" | "warning" | "summary") => {
    const defaults = { tip: ["Tips", "Tambahkan insight yang membantu pembaca bertindak lebih cepat."], warning: ["Peringatan", "Tambahkan hal penting yang perlu diperhatikan sebelum mengambil keputusan."], summary: ["Ringkasan", "Tuliskan inti pembahasan dalam satu atau dua kalimat." ] } as const;
    const [title, body] = defaults[kind];
    const customTitle = window.prompt("Judul callout", title) || title;
    const customBody = window.prompt("Isi callout", body) || body;
    insertHtml(`<div class="rich-callout rich-callout-${kind}" role="note" aria-label="${escapeHtml(customTitle)}"><strong>${escapeHtml(customTitle)}</strong><p>${escapeHtml(customBody)}</p></div><p><br></p>`);
  }, [insertHtml]);

  const insertCta = React.useCallback(() => {
    const title = window.prompt("Judul CTA", "Butuh bantuan profesional?") || "Butuh bantuan profesional?";
    const body = window.prompt("Deskripsi CTA", "Konsultasikan kebutuhan desain dan printing Anda dengan tim Madina Solution.") || "Konsultasikan kebutuhan Anda.";
    const href = window.prompt("URL CTA", "/contact") || "/contact";
    const labelText = window.prompt("Label tombol", "Konsultasi sekarang") || "Konsultasi sekarang";
    insertHtml(`<aside class="rich-inline-cta"><div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(body)}</p></div><a href="${escapeHtml(href)}">${escapeHtml(labelText)}</a></aside><p><br></p>`);
  }, [insertHtml]);

  const insertFootnote = React.useCallback(() => {
    const existing = (value.match(/id="footnote-(\d+)"/g) || []).map((v) => Number(v.match(/(\d+)/)?.[1] || 0));
    const number = Math.max(0, ...existing) + 1;
    const source = window.prompt("Sumber / catatan kaki", "Nama sumber — URL atau referensi")?.trim();
    if (!source) return;
    insertHtml(`<sup class="footnote-ref"><a href="#footnote-${number}" id="footnote-ref-${number}">[${number}]</a></sup>`);
    const root = editorRef.current;
    if (root) {
      const current = sanitizeRichHtml(root.innerHTML);
      root.innerHTML = `${current}<section class="rich-footnotes"><h3>Catatan & sumber</h3><ol><li id="footnote-${number}"><p>${escapeHtml(source)}</p><a href="#footnote-ref-${number}">Kembali ke teks</a></li></ol></section>`;
      onChange(root.innerHTML);
      updateStats();
    }
  }, [insertHtml, onChange, updateStats, value]);

  const runAction = React.useCallback((action: ToolbarAction) => {
    if (action.key === "link") return void promptLink();
    if (action.key === "image") return void promptImage();
    if (action.key === "table") return void insertTable();
    if (action.command) execute(action.command, action.value);
  }, [execute, insertTable, promptImage, promptLink]);

  const runInsertAction = React.useCallback((action: ToolbarAction) => {
    if (action.key === "tip") return void insertCallout("tip");
    if (action.key === "warning") return void insertCallout("warning");
    if (action.key === "summary") return void insertCallout("summary");
    if (action.key === "cta") return void insertCta();
    if (action.key === "footnote") return void insertFootnote();
  }, [insertCallout, insertCta, insertFootnote]);

  const onPaste = React.useCallback((event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const html = event.clipboardData.getData("text/html");
    const text = event.clipboardData.getData("text/plain");
    const payload = html ? sanitizeRichHtml(html) : escapeHtml(text).replace(/\n/g, "<br>");
    insertHtml(payload);
  }, [insertHtml]);

  const onKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    const mod = event.metaKey || event.ctrlKey;
    if (mod && event.key.toLowerCase() === "b") { event.preventDefault(); execute("bold"); }
    else if (mod && event.key.toLowerCase() === "i") { event.preventDefault(); execute("italic"); }
    else if (mod && event.key.toLowerCase() === "u") { event.preventDefault(); execute("underline"); }
    else if (mod && event.key.toLowerCase() === "k") { event.preventDefault(); void promptLink(); }
  }, [execute, promptLink]);

  const toggleSource = () => {
    if (!sourceMode) saveSelection();
    setSourceMode((current) => !current);
  };

  return (
    <div className={cn("space-y-2", fullscreen && "fixed inset-3 z-[70] flex flex-col rounded-3xl bg-white p-3 shadow-2xl ring-1 ring-black/10 dark:bg-slate-950 dark:ring-slate-800", className)}>
      {label && <div><label className="block text-sm font-semibold text-dark dark:text-white">{label}</label>{helpText && <p className="mt-1 text-xs text-dark-500 dark:text-slate-400">{helpText}</p>}</div>}
      <div className="overflow-hidden rounded-3xl border border-dark-200 bg-white shadow-[0_14px_50px_rgba(15,23,42,.08)] dark:border-slate-800 dark:bg-slate-950">
        <div className="sticky top-0 z-10 border-b border-dark-100 bg-white/95 p-2 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95" role="toolbar" aria-label={label ? `Format ${label}` : "Toolbar editor konten"}>
          <div className="flex flex-wrap items-center gap-1">
            {TOOLBAR_GROUPS.map((group, groupIndex) => <React.Fragment key={groupIndex}>
              {groupIndex > 0 && <span className="mx-1 h-7 w-px bg-dark-100 dark:bg-slate-800" aria-hidden="true" />}
              {group.map((action) => { const Icon = action.icon; return <button key={action.key} type="button" title={action.label} aria-label={action.label} onPointerDown={(event) => { event.preventDefault(); saveSelection(); }} onClick={() => { if (action.key === "image") imageInputRef.current?.click(); else runAction(action); }} disabled={action.key === "image" && uploadingImage} className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-dark-600 transition hover:bg-dark-50 hover:text-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 disabled:cursor-wait disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"><Icon className="h-4 w-4" aria-hidden="true" /></button>; })}
            </React.Fragment>)}
            <span className="mx-1 h-7 w-px bg-dark-100 dark:bg-slate-800" aria-hidden="true" />
            {INSERT_ACTIONS.map((action) => { const Icon = action.icon; return <button key={action.key} type="button" title={action.label} aria-label={action.label} onPointerDown={(event) => { event.preventDefault(); saveSelection(); }} onClick={() => runInsertAction(action)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-dark-600 transition hover:bg-dark-50 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 dark:text-slate-300 dark:hover:bg-slate-800"><Icon className="h-4 w-4" aria-hidden="true" /></button>; })}
            <button type="button" title="HTML source" aria-label={sourceMode ? "Kembali ke editor visual" : "Edit HTML source"} aria-pressed={sourceMode} onClick={toggleSource} className={cn("ml-1 inline-flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary", sourceMode ? "bg-dark text-white" : "text-dark-600 hover:bg-dark-50 dark:text-slate-300 dark:hover:bg-slate-800")}>{sourceMode ? <Eye className="h-4 w-4" aria-hidden="true" /> : <Code2 className="h-4 w-4" aria-hidden="true" />}{sourceMode ? "Visual" : "HTML"}</button>
            <button type="button" title={fullscreen ? "Keluar fullscreen" : "Fullscreen"} aria-label={fullscreen ? "Keluar fullscreen" : "Buka editor fullscreen"} aria-pressed={fullscreen} onClick={() => setFullscreen((open) => !open)} className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-xl text-dark-600 hover:bg-dark-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-slate-300 dark:hover:bg-slate-800">{fullscreen ? <Minimize2 className="h-4 w-4" aria-hidden="true" /> : <Maximize2 className="h-4 w-4" aria-hidden="true" />}</button>
          </div>
        </div>
        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void insertImageFromUpload(file); }} aria-label="Upload gambar ke editor" />
        {sourceMode ? <textarea value={value} onChange={(event) => onChange(sanitizeRichHtml(event.target.value))} aria-label="HTML sumber" spellCheck={false} className="block w-full resize-none border-0 bg-slate-950 p-5 font-mono text-xs leading-6 text-slate-100 outline-none placeholder:text-slate-500" style={{ minHeight }} /> : <div ref={editorRef} contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label={label || "Editor konten"} data-placeholder={placeholder} onInput={commit} onBlur={saveSelection} onKeyDown={onKeyDown} onKeyUp={saveSelection} onMouseUp={saveSelection} onFocus={saveSelection} onPaste={onPaste} className="rich-editor-content max-w-none overflow-auto bg-white px-6 py-5 text-sm leading-7 text-dark outline-none dark:bg-slate-950 dark:text-slate-100" style={{ minHeight }} />}
        <div className="flex items-center justify-between border-t border-dark-100 bg-dark-50/50 px-4 py-2 text-[11px] text-dark-400 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-500"><span>⌘/Ctrl+B · I · U · K</span><span>{wordCount.toLocaleString("id-ID")} kata</span></div>
      </div>
    </div>
  );
}
