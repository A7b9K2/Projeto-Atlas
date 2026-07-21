"use client";

import { useState } from "react";

/**
 * Upload de foto MOCK: lê o arquivo no cliente, gera um data-URI e coloca
 * num input oculto (name="foto_url"). Nenhum armazenamento externo no MVP —
 * no Supabase, trocar por upload ao Storage e guardar a URL pública.
 */
export function FotoUpload({ inicial }: { inicial?: string | null }) {
  const [preview, setPreview] = useState<string | null>(inicial ?? null);

  function aoSelecionar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex items-center gap-4">
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="Previa" className="h-16 w-16 rounded-full object-cover" />
      ) : (
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-300">
          🎾
        </span>
      )}
      <div>
        <label className="inline-block cursor-pointer rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
          Escolher foto
          <input type="file" accept="image/*" className="hidden" onChange={aoSelecionar} />
        </label>
        <p className="mt-1 text-xs text-slate-400">Upload mock (não sai do navegador)</p>
      </div>
      <input type="hidden" name="foto_url" value={preview ?? ""} />
    </div>
  );
}
