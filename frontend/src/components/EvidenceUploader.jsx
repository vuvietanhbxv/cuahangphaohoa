import { useRef, useState } from "react";
import { Upload, X, FileText, Image as ImageIcon } from "lucide-react";
import { getToken } from "../api/client.js";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,application/pdf";
const MAX_FILES = 5;
const MAX_BYTES = 5 * 1024 * 1024;

const BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

export default function EvidenceUploader({ value = [], onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFiles = async (files) => {
    setError("");
    if (!files || files.length === 0) return;
    if (value.length + files.length > MAX_FILES) {
      setError(`Tối đa ${MAX_FILES} file mỗi báo cáo.`);
      return;
    }

    const formData = new FormData();
    let valid = 0;
    for (const file of files) {
      if (file.size > MAX_BYTES) {
        setError(`File "${file.name}" vượt quá 5MB.`);
        continue;
      }
      formData.append("files", file);
      valid++;
    }
    if (valid === 0) return;

    setUploading(true);
    try {
      const token = getToken();
      const res = await fetch(BASE_URL + "/uploads", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload thất bại" }));
        throw new Error(err.error || "Upload thất bại");
      }
      const data = await res.json();
      onChange([...value, ...(data.items || [])]);
    } catch (err) {
      setError(err.message || "Upload thất bại");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeAt = (index) => {
    const next = value.filter((_, i) => i !== index);
    onChange(next);
  };

  const onDrop = (event) => {
    event.preventDefault();
    handleFiles(event.dataTransfer.files);
  };

  return (
    <div>
      <span className="mb-2 block text-xs font-black uppercase tracking-wide text-amber-600 dark:text-amber-200/80">
        Bằng chứng (ảnh / PDF, tối đa {MAX_FILES} file, mỗi file ≤ 5MB)
      </span>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-amber-300/30 bg-slate-950/60 px-4 py-6 text-center text-sm text-soft transition hover:border-amber-300 hover:bg-slate-950/80"
      >
        <Upload className="h-6 w-6 text-amber-500" />
        <p>
          <span className="font-bold text-amber-200">Kéo thả</span> hoặc bấm để chọn file. Ảnh chuyển khoản, đoạn chat, hoá đơn...
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {uploading && <p className="mt-2 text-xs text-amber-500">Đang upload...</p>}
      {error && <p className="mt-2 rounded-xl bg-rose-500/10 px-3 py-2 text-xs text-rose-200">{error}</p>}

      {value.length > 0 && (
        <ul className="mt-3 space-y-2">
          {value.map((file, idx) => {
            const isImage = file.mimetype?.startsWith("image/");
            return (
              <li
                key={file.url + idx}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2"
              >
                {isImage ? (
                  <img src={file.url} alt={file.filename} className="h-12 w-12 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-800 text-amber-500">
                    <FileText className="h-6 w-6" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-main">{file.filename}</p>
                  <p className="text-xs text-muted">
                    {(file.size / 1024).toFixed(0)} KB · {file.mimetype}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeAt(idx)}
                  className="rounded-lg p-2 text-muted hover:bg-rose-500/10 hover:text-rose-300"
                  title="Xoá"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
