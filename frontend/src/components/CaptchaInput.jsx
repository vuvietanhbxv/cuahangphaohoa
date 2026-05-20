import { useCallback, useEffect, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { api } from "../api/client.js";
import { TextInput } from "./ui.jsx";

export default function CaptchaInput({ value, onChange }) {
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get("/captcha");
      setChallenge(data);
      onChange({ token: data.token, answer: "" });
    } catch {
      setChallenge(null);
    } finally {
      setLoading(false);
    }
  }, [onChange]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleAnswer = (e) => {
    onChange({ token: challenge?.token || "", answer: e.target.value });
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-amber-600 dark:text-amber-200/80">
        <ShieldCheck className="h-4 w-4 text-amber-500" /> Xác thực chống spam
      </div>
      <div className="flex items-center gap-3">
        <div className="flex h-12 min-w-[120px] items-center justify-center rounded-xl bg-slate-900 px-4 font-mono text-xl font-black tracking-widest text-amber-500 select-none">
          {loading ? "..." : challenge ? `${challenge.question} = ?` : "—"}
        </div>
        <input
          type="number"
          value={value?.answer || ""}
          onChange={handleAnswer}
          placeholder="Đáp án"
          className="h-12 w-32 rounded-xl border border-white/10 bg-slate-950/80 px-4 text-main outline-none focus:border-amber-300 focus:ring-4 focus:ring-amber-300/10"
        />
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          title="Tạo câu hỏi khác"
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-amber-500 hover:bg-white/10 disabled:opacity-50"
        >
          <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
    </div>
  );
}
