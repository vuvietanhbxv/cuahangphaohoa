import { useEffect, useState } from "react";
import {
  FileWarning,
  ShieldAlert,
  Store,
  TrendingUp,
  Search,
  Activity,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { api } from "../../api/client.js";
import { GlassCard } from "../../components/ui.jsx";

const KPI_COLORS = {
  rose: "from-rose-500/20 to-rose-500/5 text-rose-200 ring-rose-400/30",
  amber: "from-amber-400/20 to-amber-400/5 text-amber-200 ring-amber-300/30",
  emerald: "from-emerald-400/20 to-emerald-400/5 text-emerald-200 ring-emerald-400/30",
  sky: "from-sky-400/20 to-sky-400/5 text-sky-200 ring-sky-400/30",
};

function KPI({ icon: Icon, color, label, value, sub }) {
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-4 ring-1 ${KPI_COLORS[color]}`}>
      <Icon className="h-6 w-6" />
      <p className="mt-3 text-xs uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-3xl font-black">{value}</p>
      {sub && <p className="text-xs opacity-70">{sub}</p>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);

  useEffect(() => {
    api.get("/admin/stats", { auth: true }).then(setStats);
    api.get("/admin/charts", { auth: true }).then(setCharts);
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black text-white md:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">Tổng quan thao tác cần xử lý hôm nay.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI icon={FileWarning} color="rose" label="Báo cáo chờ duyệt" value={stats?.pendingReports ?? "—"} sub="Cần xử lý" />
        <KPI icon={Activity} color="amber" label="Đang xem xét" value={stats?.reviewingReports ?? "—"} sub="Reports REVIEWING" />
        <KPI icon={Store} color="sky" label="Người bán chờ" value={stats?.pendingSellers ?? "—"} sub="Cần xác minh" />
        <KPI icon={TrendingUp} color="emerald" label="Giá chờ duyệt" value={stats?.pendingPrices ?? "—"} sub="Cần kiểm tra" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-amber-300">7 ngày qua</p>
              <h3 className="text-lg font-black text-white">Lượt tra cứu</h3>
            </div>
            <Search className="h-5 w-5 text-amber-300" />
          </div>
          <div className="mt-4 h-64">
            {charts?.timeseries ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.timeseries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 12, color: "#fff" }} />
                  <Line type="monotone" dataKey="lookups" stroke="#fbbf24" strokeWidth={3} dot={{ r: 4, fill: "#fbbf24" }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400">Đang tải...</p>
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-amber-300">7 ngày qua</p>
              <h3 className="text-lg font-black text-white">Báo cáo mới mỗi ngày</h3>
            </div>
            <FileWarning className="h-5 w-5 text-rose-300" />
          </div>
          <div className="mt-4 h-64">
            {charts?.timeseries ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.timeseries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 12 }} />
                  <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} />
                  <Bar dataKey="reports" name="Báo cáo" fill="#fb7185" />
                  <Bar dataKey="verified" name="Đã xác minh" fill="#34d399" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400">Đang tải...</p>
            )}
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-amber-300">7 ngày qua</p>
            <h3 className="text-lg font-black text-white">Top thông tin bị tra cứu nhiều</h3>
          </div>
          <ShieldAlert className="h-5 w-5 text-amber-300" />
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-amber-300">
              <tr>
                <th className="py-2">#</th>
                <th>Loại</th>
                <th>Giá trị (chuẩn hoá)</th>
                <th className="text-right">Số lượt tra cứu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {(charts?.top_targets || []).map((t, idx) => (
                <tr key={`${t.type}-${t.value}`} className="hover:bg-white/5">
                  <td className="py-2 text-slate-500">{idx + 1}</td>
                  <td>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${t.type === "PHONE" ? "bg-sky-400/15 text-sky-200" : "bg-emerald-400/15 text-emerald-200"}`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="font-mono">{t.value}</td>
                  <td className="text-right font-black text-amber-300">{t.count}</td>
                </tr>
              ))}
              {(charts?.top_targets || []).length === 0 && (
                <tr><td colSpan={4} className="py-6 text-center text-slate-500">Chưa có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
