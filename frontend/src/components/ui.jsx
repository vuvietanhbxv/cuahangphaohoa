import { Sparkles, Flame } from "lucide-react";

export function LocalChevronDown({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LocalBarChart({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 19V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 19h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 16v-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 16V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 16v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function LocalFacebook({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M14 8h2V5h-2c-2.2 0-4 1.8-4 4v2H8v3h2v6h3v-6h2.4l.6-3h-3V9c0-.6.4-1 1-1Z" fill="currentColor" />
    </svg>
  );
}

export function FireworkBurst({ className = "", tone = "gold" }) {
  const color = tone === "red" ? "#fb7185" : tone === "purple" ? "#c084fc" : "#fbbf24";
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <circle cx="60" cy="60" r="3" fill={color} />
      {Array.from({ length: 18 }).map((_, index) => {
        const angle = (index * 20 * Math.PI) / 180;
        const x1 = 60 + Math.cos(angle) * 12;
        const y1 = 60 + Math.sin(angle) * 12;
        const x2 = 60 + Math.cos(angle) * (36 + (index % 3) * 12);
        const y2 = 60 + Math.sin(angle) * (36 + (index % 3) * 12);
        return (
          <path
            key={index}
            d={`M${x1} ${y1} L${x2} ${y2}`}
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            opacity={0.75 - (index % 3) * 0.12}
          />
        );
      })}
    </svg>
  );
}

export function ProductThumb({ className = "" }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-600 via-amber-500 to-yellow-300 shadow-lg shadow-amber-500/20 ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.8),transparent_18%),radial-gradient(circle_at_70%_65%,rgba(255,255,255,0.45),transparent_22%)]" />
      <div className="absolute inset-x-2 bottom-2 h-8 rounded-lg bg-slate-950/80 ring-1 ring-white/20" />
      <Sparkles className="absolute left-3 top-3 h-5 w-5 text-white" />
      <Flame className="absolute bottom-3 right-3 h-5 w-5 text-yellow-200" />
    </div>
  );
}

export function SectionTitle({ eyebrow, title, desc, dark = false }) {
  // `dark` prop giữ để compat với code cũ, nhưng giờ luôn dùng theme variables
  return (
    <div>
      <p className="inline-flex items-center gap-2 text-sm font-bold text-amber-500">
        <Sparkles className="h-4 w-4" /> {eyebrow}
      </p>
      <h3 className="mt-2 text-2xl font-extrabold text-main md:text-3xl">{title}</h3>
      {desc && <p className="mt-2 max-w-2xl text-sm leading-6 text-soft">{desc}</p>}
    </div>
  );
}

export function Badge({ children, variant = "safe" }) {
  const styles = {
    safe:    "bg-emerald-500/10 text-emerald-600 ring-emerald-500/30 dark:text-emerald-300 dark:ring-emerald-400/20",
    danger:  "bg-rose-500/15 text-rose-600 ring-rose-500/30 dark:text-rose-200 dark:ring-rose-400/30",
    warn:    "bg-amber-400/15 text-amber-700 ring-amber-500/40 dark:text-amber-200 dark:ring-amber-300/30",
    neutral: "bg-slate-500/15 text-slate-700 ring-slate-400/40 dark:text-slate-200 dark:ring-slate-300/20",
    gold:    "bg-amber-400 text-slate-950 ring-amber-300",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ring-1 ${styles[variant]}`}>
      {children}
    </span>
  );
}

export function SelectBox({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-wide text-amber-600 dark:text-amber-200/80">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="theme-input h-12 w-full appearance-none px-4 pr-10 text-sm font-semibold outline-none"
        >
          {options.map((option) => {
            const value = typeof option === "object" ? option.value : option;
            const label = typeof option === "object" ? option.label : option;
            return (
              <option key={value} value={value}>
                {label}
              </option>
            );
          })}
        </select>
        <LocalChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-500" />
      </div>
    </label>
  );
}

export function GlassCard({ children, className = "", ...rest }) {
  return (
    <div {...rest} className={`theme-card ${className}`}>
      {children}
    </div>
  );
}

export function TextInput({ label, error, ...rest }) {
  return (
    <label className="block">
      {label && <span className="mb-2 block text-xs font-black uppercase tracking-wide text-amber-600 dark:text-amber-200/80">{label}</span>}
      <input
        {...rest}
        className="theme-input w-full px-4 py-3 outline-none"
      />
      {error && <span className="mt-1 block text-xs text-rose-500 dark:text-rose-300">{error}</span>}
    </label>
  );
}

export function TextArea({ label, error, ...rest }) {
  return (
    <label className="block">
      {label && <span className="mb-2 block text-xs font-black uppercase tracking-wide text-amber-600 dark:text-amber-200/80">{label}</span>}
      <textarea
        {...rest}
        rows={rest.rows || 4}
        className="theme-input w-full px-4 py-3 outline-none"
      />
      {error && <span className="mt-1 block text-xs text-rose-500 dark:text-rose-300">{error}</span>}
    </label>
  );
}

export function PrimaryButton({ children, className = "", ...rest }) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-300 to-orange-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/20 transition hover:from-yellow-200 hover:to-amber-300 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, className = "", ...rest }) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/10 disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}
