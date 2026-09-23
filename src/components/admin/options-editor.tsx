"use client";

import * as React from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProductOption } from "@/db/schema";

const TYPES: ProductOption["type"][] = ["select", "radio", "text", "textarea", "number", "size", "file"];

type Props = { value: ProductOption[]; onChange: (value: ProductOption[]) => void; title?: string; description?: string };

const blank = (order = 0): ProductOption => ({ id: crypto.randomUUID(), name: "", key: "", type: "select", required: false, values: [{ label: "", value: "", priceModifier: 0 }], displayOrder: order });

export function OptionsEditor({ value, onChange, title = "Spesifikasi & pilihan customer", description = "Field di sini tampil dinamis di halaman pemesanan dan ikut divalidasi server." }: Props) {
  const options = Array.isArray(value) ? value : [];
  const update = (id: string, patch: Partial<ProductOption>) => onChange(options.map((item) => item.id === id ? { ...item, ...patch } : item));
  const add = () => onChange([...options, blank(options.length)]);
  const remove = (id: string) => onChange(options.filter((item) => item.id !== id));
  const addValue = (option: ProductOption) => update(option.id, { values: [...(option.values || []), { label: "", value: "", priceModifier: 0 }] });
  const updateValue = (option: ProductOption, index: number, patch: Partial<NonNullable<ProductOption["values"]>[number]>) => update(option.id, { values: (option.values || []).map((item, i) => i === index ? { ...item, ...patch } : item) });
  const removeValue = (option: ProductOption, index: number) => update(option.id, { values: (option.values || []).filter((_, i) => i !== index) });

  return (
    <div className="rounded-2xl border border-dark-100 bg-dark-50/60 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h3 className="font-semibold text-dark">{title}</h3><p className="mt-1 text-xs text-dark-500">{description}</p></div><Button type="button" size="sm" variant="outline" onClick={add}><Plus className="mr-1.5 h-4 w-4" />Tambah field</Button></div>
      {options.length === 0 && <div className="mt-4 rounded-xl border border-dashed border-dark-200 bg-white p-4 text-sm text-dark-500">Belum ada pilihan. Tambahkan jenis bahan, ukuran, finishing, format file, atau brief custom.</div>}
      <div className="mt-4 space-y-4">
        {options.map((option, index) => (
          <div key={option.id} className="rounded-2xl border border-dark-200 bg-white p-4 shadow-sm">
            <div className="flex gap-3"><GripVertical className="mt-3 h-4 w-4 shrink-0 text-dark-300" /><div className="min-w-0 flex-1 grid gap-3 md:grid-cols-[1.15fr_0.8fr_0.8fr_auto_auto] md:items-end">
              <div><label className="mb-1 block text-xs font-medium text-dark-500">Nama field</label><Input value={option.name} onChange={(e) => update(option.id, { name: e.target.value })} placeholder="Contoh: Bahan" /></div>
              <div><label className="mb-1 block text-xs font-medium text-dark-500">Key</label><Input value={option.key} onChange={(e) => update(option.id, { key: e.target.value.toLowerCase().replace(/[^a-z0-9_]+/g, "_") })} placeholder="material" /></div>
              <div><label className="mb-1 block text-xs font-medium text-dark-500">Tipe</label><select value={option.type} onChange={(e) => update(option.id, { type: e.target.value as ProductOption["type"] })} className="h-11 w-full rounded-xl border border-dark-200 bg-white px-3 text-sm">{TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select></div>
              <label className="flex items-center gap-2 rounded-xl border border-dark-200 px-3 py-2.5 text-sm"><input type="checkbox" checked={option.required} onChange={(e) => update(option.id, { required: e.target.checked })} className="h-4 w-4 rounded border-dark-300 text-primary" />Wajib</label>
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(option.id)} aria-label="Hapus field"><Trash2 className="h-4 w-4 text-red-500" /></Button>
            </div></div>
            {(option.type === "select" || option.type === "radio") && <div className="mt-4 rounded-xl bg-dark-50 p-3"><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wider text-dark-500">Nilai pilihan</p><Button type="button" size="sm" variant="ghost" onClick={() => addValue(option)}><Plus className="mr-1 h-3.5 w-3.5" />Tambah</Button></div><div className="mt-2 space-y-2">{(option.values || []).map((val, i) => <div key={`${option.id}-${i}`} className="grid gap-2 sm:grid-cols-[1fr_1fr_130px_40px]"><Input value={val.label} onChange={(e) => updateValue(option, i, { label: e.target.value })} placeholder="Label" /><Input value={val.value} onChange={(e) => updateValue(option, i, { value: e.target.value })} placeholder="Value" /><Input type="number" value={val.priceModifier ?? 0} onChange={(e) => updateValue(option, i, { priceModifier: Number(e.target.value) || 0 })} placeholder="Modifier" /><Button type="button" variant="ghost" size="icon" onClick={() => removeValue(option, i)} aria-label="Hapus pilihan"><Trash2 className="h-4 w-4 text-red-500" /></Button></div>)}</div></div>}
            <div className="mt-3 grid gap-3 sm:grid-cols-2"><Input value={option.placeholder || ""} onChange={(e) => update(option.id, { placeholder: e.target.value })} placeholder="Placeholder / petunjuk" /><Input value={option.helpText || ""} onChange={(e) => update(option.id, { helpText: e.target.value })} placeholder="Keterangan untuk customer" /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
