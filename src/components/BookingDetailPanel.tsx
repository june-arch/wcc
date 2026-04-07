"use client";
// src/components/BookingDetailPanel.tsx
import { useState } from "react";
import {
  X, MapPin, Calendar, Tag, CreditCard, CheckSquare,
  Plus, Trash2, Circle, Clock, CheckCircle2, Loader2,
} from "lucide-react";
import { cn, formatDate, getStatusColor, getStatusLabel, getPaymentStatus } from "@/lib/utils";
import type { BookingWithRelations, Task, Payment } from "@/types";
import toast from "react-hot-toast";

const EVENT_COLORS: Record<string, string> = {
  PENGAJIAN: "bg-purple-100 text-purple-700 border-purple-200",
  AKAD:      "bg-blue-100 text-blue-700 border-blue-200",
  RESEPSI:   "bg-pink-100 text-pink-700 border-pink-200",
  TAMAT_KAJI:"bg-teal-100 text-teal-700 border-teal-200",
  LAINNYA:   "bg-stone-100 text-stone-600 border-stone-200",
};

const TASK_STATUS_CYCLE: Record<string, string> = {
  TODO: "IN_PROGRESS",
  IN_PROGRESS: "DONE",
  DONE: "TODO",
};

const TASK_STATUS_ICONS = {
  TODO: Circle,
  IN_PROGRESS: Clock,
  DONE: CheckCircle2,
};

interface Props {
  booking: BookingWithRelations;
  onClose: () => void;
  /** Patch the booking in parent state immediately (optimistic) */
  onPatch: (id: string, patch: Partial<BookingWithRelations>) => void;
}

export default function BookingDetailPanel({ booking, onClose, onPatch }: Props) {
  const [tab, setTab] = useState<"info" | "tasks" | "payment">("info");
  const [newTask, setNewTask] = useState("");
  const [newPayment, setNewPayment] = useState("");
  const [addingTask, setAddingTask] = useState(false);
  const [addingPayment, setAddingPayment] = useState(false);
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const sisa = booking.package - booking.paid;
  const pay = getPaymentStatus(booking.paid, booking.package);
  const progress = Math.min(Math.round((booking.paid / booking.package) * 100), 100);
  const doneTasks = booking.tasks.filter((t) => t.status === "DONE").length;

  // ─── Status ────────────────────────────────────────────────────────────────
  const handleUpdateStatus = async (status: string) => {
    if (status === booking.status || updatingStatus) return;
    // Optimistic
    onPatch(booking.id, { status });
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast.success("Status diperbarui");
    } catch {
      // Rollback
      onPatch(booking.id, { status: booking.status });
      toast.error("Gagal update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ─── Tasks ─────────────────────────────────────────────────────────────────
  const handleAddTask = async () => {
    if (!newTask.trim() || addingTask) return;
    setAddingTask(true);
    // Optimistic temp task
    const tempId = `temp-${Date.now()}`;
    const tempTask: Task = {
      id: tempId,
      bookingId: booking.id,
      title: newTask.trim(),
      description: null,
      dueDate: null,
      status: "TODO",
      priority: "MEDIUM",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onPatch(booking.id, { tasks: [...booking.tasks, tempTask] });
    setNewTask("");
    try {
      const res = await fetch(`/api/bookings/${booking.id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: tempTask.title, priority: "MEDIUM" }),
      });
      if (!res.ok) throw new Error();
      const saved: Task = await res.json();
      // Replace temp with real
      onPatch(booking.id, {
        tasks: booking.tasks.filter((t) => t.id !== tempId).concat(saved),
      });
      toast.success("Task ditambahkan");
    } catch {
      // Rollback
      onPatch(booking.id, { tasks: booking.tasks.filter((t) => t.id !== tempId) });
      toast.error("Gagal menambah task");
    } finally {
      setAddingTask(false);
    }
  };

  const handleToggleTask = async (task: Task) => {
    if (loadingTaskId) return;
    const nextStatus = TASK_STATUS_CYCLE[task.status] ?? "TODO";
    setLoadingTaskId(task.id);
    // Optimistic
    onPatch(booking.id, {
      tasks: booking.tasks.map((t) => t.id === task.id ? { ...t, status: nextStatus } : t),
    });
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Rollback
      onPatch(booking.id, {
        tasks: booking.tasks.map((t) => t.id === task.id ? { ...t, status: task.status } : t),
      });
      toast.error("Gagal update task");
    } finally {
      setLoadingTaskId(null);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Hapus task ini?")) return;
    // Optimistic
    const prev = booking.tasks;
    onPatch(booking.id, { tasks: booking.tasks.filter((t) => t.id !== taskId) });
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Task dihapus");
    } catch {
      onPatch(booking.id, { tasks: prev });
      toast.error("Gagal hapus task");
    }
  };

  // ─── Payments ──────────────────────────────────────────────────────────────
  const handleAddPayment = async () => {
    const amount = parseInt(newPayment);
    if (!amount || amount <= 0 || addingPayment) return;
    setAddingPayment(true);
    const newPaid = booking.paid + amount;
    const newStatus = newPaid >= booking.package ? "COMPLETED" : booking.status;
    // Optimistic
    const tempPayment: Payment = {
      id: `temp-${Date.now()}`,
      bookingId: booking.id,
      amount,
      note: null,
      paidAt: new Date().toISOString(),
    };
    onPatch(booking.id, {
      paid: newPaid,
      status: newStatus,
      payments: [tempPayment, ...booking.payments],
    });
    setNewPayment("");
    try {
      const res = await fetch(`/api/bookings/${booking.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) throw new Error();
      const saved: Payment = await res.json();
      onPatch(booking.id, {
        payments: [saved, ...booking.payments.filter((p) => p.id !== tempPayment.id)],
      });
      toast.success(`Pembayaran Rp${amount}k dicatat`);
    } catch {
      // Rollback
      onPatch(booking.id, {
        paid: booking.paid,
        status: booking.status,
        payments: booking.payments.filter((p) => p.id !== tempPayment.id),
      });
      toast.error("Gagal catat pembayaran");
    } finally {
      setAddingPayment(false);
    }
  };

  return (
    <div
      className="card overflow-hidden flex flex-col"
      style={{ maxHeight: "calc(100vh - 160px)", position: "sticky", top: 0 }}
    >
      {/* Header */}
      <div className="px-4 py-4 border-b border-stone-100 shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-stone-900 text-base leading-tight truncate">
                {booking.clientName}
              </h3>
              {booking.isConfirmed && (
                <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full font-bold shrink-0">✓</span>
              )}
            </div>
            {booking.hashtag && (
              <p className="text-xs text-stone-400 mt-0.5 font-medium">{booking.hashtag}</p>
            )}
          </div>
          <button onClick={onClose} className="btn btn-ghost w-7 h-7 p-0 justify-center shrink-0">
            <X size={14} />
          </button>
        </div>
        <div className="flex gap-1 mt-2 flex-wrap">
          {booking.eventType.map((et) => (
            <span key={et} className={cn("badge text-[10px]", EVENT_COLORS[et])}>
              {et === "TAMAT_KAJI" ? "Tamat Kaji" : et.charAt(0) + et.slice(1).toLowerCase()}
            </span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-100 shrink-0">
        {(["info", "tasks", "payment"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-2.5 text-xs font-semibold transition-colors",
              tab === t
                ? "text-orange-600 border-b-2 border-orange-500"
                : "text-stone-400 hover:text-stone-600"
            )}
          >
            {t === "tasks"
              ? `Tasks (${doneTasks}/${booking.tasks.length})`
              : t === "payment"
              ? "Bayar"
              : "Info"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="overflow-y-auto flex-1">

        {/* ── INFO TAB ──────────────────────────────────────────────────────── */}
        {tab === "info" && (
          <div className="p-4 space-y-4">
            <InfoRow icon={Calendar} label="Tanggal">
              <span className="text-sm font-medium text-stone-800">
                {formatDate(booking.startDate)}
                {booking.endDate &&
                  ` – ${formatDate(booking.endDate)}`}
              </span>
            </InfoRow>

            {booking.location && (
              <InfoRow icon={MapPin} label="Lokasi">
                <span className="text-sm text-stone-700">{booking.location}</span>
              </InfoRow>
            )}

            <InfoRow icon={CreditCard} label="Paket">
              <div>
                <p className="text-sm font-bold text-stone-900">Rp {booking.package.toLocaleString()}k</p>
                <div className="progress-bar mt-1.5">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <p className={cn("text-xs font-medium mt-1", pay.color.split(" ")[0])}>
                  {pay.label} · {progress}%
                  {sisa > 0 && ` · Sisa Rp${sisa}k`}
                </p>
              </div>
            </InfoRow>

            {booking.notes && (
              <InfoRow icon={Tag} label="Catatan">
                <p className="text-sm text-stone-700">{booking.notes}</p>
              </InfoRow>
            )}

            {/* Status picker */}
            <div>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Status</p>
              <div className="grid grid-cols-2 gap-1.5">
                {(["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const).map((s) => (
                  <button
                    key={s}
                    disabled={updatingStatus}
                    onClick={() => handleUpdateStatus(s)}
                    className={cn(
                      "text-xs py-1.5 px-2 rounded-lg font-medium border transition-all",
                      booking.status === s
                        ? getStatusColor(s) + " ring-2 ring-offset-1 ring-orange-300"
                        : "border-stone-200 text-stone-500 hover:border-stone-300 hover:bg-stone-50"
                    )}
                  >
                    {getStatusLabel(s)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TASKS TAB ─────────────────────────────────────────────────────── */}
        {tab === "tasks" && (
          <div className="p-4 space-y-3">
            <div className="flex gap-2">
              <input
                className="input-base text-sm py-1.5 flex-1"
                placeholder="Tambah task baru... (Enter)"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
              />
              <button
                onClick={handleAddTask}
                disabled={!newTask.trim() || addingTask}
                className="btn btn-primary px-3 py-1.5 shrink-0"
              >
                {addingTask
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Plus size={14} />
                }
              </button>
            </div>

            {booking.tasks.length === 0 ? (
              <div className="py-8 text-center text-stone-400 text-sm">
                <CheckSquare size={24} className="mx-auto mb-2 text-stone-300" />
                Belum ada task
              </div>
            ) : (
              <div className="space-y-1.5">
                {booking.tasks.map((task) => {
                  const Icon = TASK_STATUS_ICONS[task.status as keyof typeof TASK_STATUS_ICONS] ?? Circle;
                  const isLoading = loadingTaskId === task.id;
                  const isTemp = task.id.startsWith("temp-");

                  return (
                    <div
                      key={task.id}
                      className={cn(
                        "flex items-center gap-2.5 p-2.5 rounded-lg group border transition-all",
                        task.status === "DONE"
                          ? "bg-stone-50 border-stone-100 opacity-60"
                          : "bg-white border-stone-200 hover:border-stone-300",
                        isTemp && "opacity-60"
                      )}
                    >
                      <button
                        onClick={() => !isTemp && handleToggleTask(task)}
                        disabled={isLoading || isTemp}
                        className={cn(
                          "shrink-0 transition-colors",
                          task.status === "DONE"
                            ? "text-emerald-500"
                            : task.status === "IN_PROGRESS"
                            ? "text-blue-500"
                            : "text-stone-300 hover:text-stone-500"
                        )}
                      >
                        {isLoading
                          ? <Loader2 size={16} className="animate-spin" />
                          : <Icon size={16} />
                        }
                      </button>

                      <span className={cn(
                        "flex-1 text-sm min-w-0 truncate",
                        task.status === "DONE" ? "line-through text-stone-400" : "text-stone-800"
                      )}>
                        {task.title}
                      </span>

                      <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0",
                        task.priority === "HIGH"
                          ? "bg-red-50 text-red-600"
                          : task.priority === "MEDIUM"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-stone-100 text-stone-500"
                      )}>
                        {task.priority === "HIGH" ? "Tinggi" : task.priority === "MEDIUM" ? "Sedang" : "Rendah"}
                      </span>

                      {!isTemp && (
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-400 transition-all shrink-0"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── PAYMENT TAB ───────────────────────────────────────────────────── */}
        {tab === "payment" && (
          <div className="p-4 space-y-4">
            {/* Summary */}
            <div className="bg-stone-50 rounded-xl p-4 space-y-2 border border-stone-100">
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Total Paket</span>
                <span className="font-semibold text-stone-900">Rp {booking.package.toLocaleString()}k</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Sudah Dibayar</span>
                <span className="font-semibold text-emerald-600">Rp {booking.paid.toLocaleString()}k</span>
              </div>
              <div className="border-t border-stone-200 pt-2 flex justify-between text-sm">
                <span className="font-semibold text-stone-600">Sisa</span>
                <span className={cn("font-bold", sisa > 0 ? "text-red-600" : "text-emerald-600")}>
                  {sisa > 0 ? `Rp ${sisa.toLocaleString()}k` : "✓ Lunas"}
                </span>
              </div>
              <div className="progress-bar mt-1">
                <div
                  className="progress-fill"
                  style={{
                    width: `${progress}%`,
                    background: progress >= 100 ? "#10b981" : "var(--brand)",
                  }}
                />
              </div>
            </div>

            {/* Add payment */}
            {sisa > 0 && (
              <div>
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
                  Catat Pembayaran
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-medium">Rp</span>
                    <input
                      className="input-base text-sm py-1.5 pl-8"
                      placeholder="Jumlah (ribu)"
                      type="number"
                      min="1"
                      value={newPayment}
                      onChange={(e) => setNewPayment(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddPayment()}
                    />
                  </div>
                  <button
                    onClick={handleAddPayment}
                    disabled={!newPayment || addingPayment}
                    className="btn btn-primary px-3 shrink-0 text-xs"
                  >
                    {addingPayment
                      ? <Loader2 size={14} className="animate-spin" />
                      : "Simpan"
                    }
                  </button>
                </div>
              </div>
            )}

            {/* Payment history */}
            {booking.payments.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Riwayat</p>
                <div className="space-y-2">
                  {booking.payments.map((p) => {
                    const isTemp = p.id.startsWith("temp-");
                    return (
                      <div
                        key={p.id}
                        className={cn(
                          "flex items-center justify-between p-2.5 bg-emerald-50 rounded-lg border border-emerald-100 transition-opacity",
                          isTemp && "opacity-60"
                        )}
                      >
                        <div>
                          <p className="text-sm font-semibold text-emerald-800">+Rp {p.amount.toLocaleString()}k</p>
                          {p.note && <p className="text-xs text-emerald-600">{p.note}</p>}
                        </div>
                        <p className="text-xs text-emerald-600">
                          {isTemp ? "Menyimpan..." : formatDate(p.paidAt)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ size: number; className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
        <Icon size={13} className="text-stone-500" />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-[11px] text-stone-400 font-semibold uppercase tracking-wider mb-0.5">{label}</p>
        {children}
      </div>
    </div>
  );
}
