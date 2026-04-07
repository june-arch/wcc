"use client";
// src/components/TasksClient.tsx
import { useState, useMemo } from "react";
import {
  CheckCircle2, Circle, Clock, Trash2, Plus, Loader2,
  AlertCircle, Filter, Search
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

type TaskWithBooking = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: string;
  priority: string;
  bookingId: string;
  booking: { id: string; clientName: string; startDate: string; hashtag: string | null };
};

const STATUS_ICONS = {
  TODO: Circle,
  IN_PROGRESS: Clock,
  DONE: CheckCircle2,
};

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: "bg-red-50 text-red-600 border-red-100",
  MEDIUM: "bg-amber-50 text-amber-600 border-amber-100",
  LOW: "bg-stone-50 text-stone-500 border-stone-200",
};

const STATUS_LABELS: Record<string, string> = {
  TODO: "Belum",
  IN_PROGRESS: "Proses",
  DONE: "Selesai",
};

export default function TasksClient({ initialTasks }: { initialTasks: TaskWithBooking[] }) {
  const [tasks, setTasks] = useState<TaskWithBooking[]>(initialTasks);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "TODO" | "IN_PROGRESS" | "DONE">("ALL");
  const [filterPriority, setFilterPriority] = useState<"ALL" | "HIGH" | "MEDIUM" | "LOW">("ALL");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch =
        !search ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.booking.clientName.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "ALL" || t.status === filterStatus;
      const matchPriority = filterPriority === "ALL" || t.priority === filterPriority;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [tasks, search, filterStatus, filterPriority]);

  const grouped = useMemo(() => ({
    TODO: filtered.filter((t) => t.status === "TODO"),
    IN_PROGRESS: filtered.filter((t) => t.status === "IN_PROGRESS"),
    DONE: filtered.filter((t) => t.status === "DONE"),
  }), [filtered]);

  const handleCycleStatus = async (task: TaskWithBooking) => {
    const next = task.status === "TODO" ? "IN_PROGRESS" : task.status === "IN_PROGRESS" ? "DONE" : "TODO";
    setLoadingId(task.id);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error();
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: next } : t));
    } catch {
      toast.error("Gagal update task");
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus task ini?")) return;
    try {
      await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((t) => t.id !== id));
      toast.success("Task dihapus");
    } catch {
      toast.error("Gagal hapus task");
    }
  };

  const doneCount = tasks.filter((t) => t.status === "DONE").length;
  const progress = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-stone-900">To Do List</h1>
        <p className="text-stone-500 text-sm mt-0.5">
          {doneCount} dari {tasks.length} task selesai
        </p>
      </div>

      {/* Overall progress */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-stone-700">Progress Keseluruhan</span>
          <span className="text-sm font-bold text-orange-600">{progress}%</span>
        </div>
        <div className="progress-bar h-2">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex gap-4 mt-3 text-xs text-stone-500">
          <span><span className="font-bold text-stone-400">{grouped.TODO.length}</span> Belum dikerjakan</span>
          <span><span className="font-bold text-blue-500">{grouped.IN_PROGRESS.length}</span> Sedang proses</span>
          <span><span className="font-bold text-emerald-500">{grouped.DONE.length}</span> Selesai</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            className="input-base pl-9 py-2 text-sm w-full"
            placeholder="Cari task atau nama klien..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5 bg-stone-100 rounded-lg p-1 overflow-x-auto">
          {(["ALL", "TODO", "IN_PROGRESS", "DONE"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                "px-2 sm:px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap",
                filterStatus === s ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
              )}
            >
              {s === "ALL" ? "Semua" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 bg-stone-100 rounded-lg p-1 overflow-x-auto">
          {(["ALL", "HIGH", "MEDIUM", "LOW"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={cn(
                "px-2 sm:px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap",
                filterPriority === p ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
              )}
            >
              {p === "ALL" ? "Semua" : p === "HIGH" ? "🔴 Tinggi" : p === "MEDIUM" ? "🟡 Sedang" : "⚪ Rendah"}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban-style columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(["TODO", "IN_PROGRESS", "DONE"] as const).map((status) => {
          const colTasks = grouped[status];
          const colColors: Record<string, string> = {
            TODO: "border-t-stone-300",
            IN_PROGRESS: "border-t-blue-400",
            DONE: "border-t-emerald-400",
          };
          const colHeaders: Record<string, string> = {
            TODO: "Belum Dikerjakan",
            IN_PROGRESS: "Sedang Proses",
            DONE: "Selesai",
          };
          const colBg: Record<string, string> = {
            TODO: "bg-stone-50",
            IN_PROGRESS: "bg-blue-50",
            DONE: "bg-emerald-50",
          };

          return (
            <div key={status} className={cn("card border-t-2 overflow-hidden", colColors[status])}>
              <div className={cn("px-4 py-3 border-b border-stone-100 flex items-center justify-between", colBg[status])}>
                <h3 className="text-sm font-bold text-stone-700">{colHeaders[status]}</h3>
                <span className="text-xs font-bold text-stone-400 bg-white px-2 py-0.5 rounded-full border border-stone-200">
                  {colTasks.length}
                </span>
              </div>

              <div className="p-3 space-y-2 min-h-32">
                {colTasks.length === 0 ? (
                  <div className="py-6 text-center text-stone-300 text-xs">Kosong</div>
                ) : (
                  colTasks.map((task) => {
                    const Icon = STATUS_ICONS[task.status as keyof typeof STATUS_ICONS] ?? Circle;
                    const isLoading = loadingId === task.id;

                    return (
                      <div
                        key={task.id}
                        className={cn(
                          "group bg-white border border-stone-200 rounded-xl p-3 transition-all hover:border-stone-300 hover:shadow-sm",
                          task.status === "DONE" && "opacity-60"
                        )}
                      >
                        <div className="flex items-start gap-2.5">
                          <button
                            onClick={() => handleCycleStatus(task)}
                            disabled={isLoading}
                            className={cn(
                              "mt-0.5 shrink-0 transition-colors",
                              task.status === "DONE" ? "text-emerald-500" :
                              task.status === "IN_PROGRESS" ? "text-blue-500" :
                              "text-stone-300 hover:text-stone-500"
                            )}
                          >
                            {isLoading
                              ? <Loader2 size={15} className="animate-spin" />
                              : <Icon size={15} />
                            }
                          </button>

                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "text-sm font-medium leading-tight",
                              task.status === "DONE" ? "line-through text-stone-400" : "text-stone-800"
                            )}>
                              {task.title}
                            </p>

                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span className="text-[10px] text-stone-400 font-medium truncate max-w-28">
                                {task.booking.clientName}
                              </span>
                              <span className={cn(
                                "text-[10px] font-bold px-1.5 py-0.5 rounded-full border",
                                PRIORITY_COLORS[task.priority]
                              )}>
                                {task.priority === "HIGH" ? "Tinggi" : task.priority === "MEDIUM" ? "Sedang" : "Rendah"}
                              </span>
                              {task.dueDate && (
                                <span className="text-[10px] text-stone-400">
                                  {formatDate(task.dueDate)}
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => handleDelete(task.id)}
                            className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-400 transition-all shrink-0"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
