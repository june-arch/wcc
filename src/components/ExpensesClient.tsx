"use client";
// src/components/ExpensesClient.tsx
import { useMemo, useState } from "react";
import {
  Plus, User as UserIcon, Car, Wallet, Pencil, Trash2, Users, Briefcase, Phone, Banknote,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn, formatDate } from "@/lib/utils";
import { EXPENSE_CATEGORY_LABEL, type Expense, type Employee, type ExpenseCategory } from "@/types";
import ResponsiveModal from "./ui/ResponsiveModal";
import ResponsiveConfirm from "./ui/ResponsiveConfirm";

interface Props {
  initialExpenses: Expense[];
  initialEmployees: Employee[];
}

type Tab = "expenses" | "employees";
type FilterCat = "ALL" | ExpenseCategory;

const CATEGORY_META: Record<ExpenseCategory, { icon: typeof Wallet; color: string; bg: string; ring: string }> = {
  SALARY: { icon: UserIcon, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100", ring: "ring-emerald-200" },
  FUEL: { icon: Car, color: "text-amber-600", bg: "bg-amber-50 border-amber-100", ring: "ring-amber-200" },
  OTHER: { icon: Wallet, color: "text-stone-600", bg: "bg-stone-50 border-stone-200", ring: "ring-stone-200" },
};

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const toDateInput = (d: Date | string) => {
  const date = new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const monthKey = (d: Date | string) =>
  new Date(d).toLocaleDateString("id-ID", { year: "numeric", month: "long" });

const sortExpenses = (list: Expense[]) =>
  [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

const emptyExpenseForm = () => ({
  date: todayStr(),
  amount: "",
  category: "SALARY" as ExpenseCategory,
  employeeId: "",
  workPeriod: "",
  note: "",
});

const emptyEmpForm = () => ({ name: "", position: "", phone: "", salary: "", isActive: true });

export default function ExpensesClient({ initialExpenses, initialEmployees }: Props) {
  const [tab, setTab] = useState<Tab>("expenses");
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [filter, setFilter] = useState<FilterCat>("ALL");

  // Expense form modal
  const [expFormOpen, setExpFormOpen] = useState(false);
  const [expForm, setExpForm] = useState(emptyExpenseForm());
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Employee form modal
  const [empFormOpen, setEmpFormOpen] = useState(false);
  const [empForm, setEmpForm] = useState(emptyEmpForm());
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [confirm, setConfirm] = useState<{ type: "expense" | "employee"; id: string; label: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const activeEmployees = employees.filter((e) => e.isActive);

  const grouped = useMemo(() => {
    const filtered = expenses.filter((e) => filter === "ALL" || e.category === filter);
    const map: Record<string, Expense[]> = {};
    filtered.forEach((e) => {
      const key = monthKey(e.date);
      (map[key] = map[key] || []).push(e);
    });
    return map;
  }, [expenses, filter]);

  const totalFiltered = useMemo(
    () => expenses.filter((e) => filter === "ALL" || e.category === filter).reduce((s, e) => s + e.amount, 0),
    [expenses, filter]
  );

  // ─── Expense CRUD ───────────────────────────────────────────────────────────
  const openCreateExpense = () => {
    setEditingExpense(null);
    setExpForm({ ...emptyExpenseForm(), employeeId: activeEmployees[0]?.id || "" });
    setExpFormOpen(true);
  };

  const openEditExpense = (e: Expense) => {
    setEditingExpense(e);
    setExpForm({
      date: toDateInput(e.date),
      amount: String(e.amount),
      category: e.category,
      employeeId: e.employeeId || "",
      workPeriod: e.workPeriod || "",
      note: e.note || "",
    });
    setExpFormOpen(true);
  };

  const submitExpense = async () => {
    if (!expForm.date || expForm.amount === "" || Number(expForm.amount) <= 0) {
      toast.error("Tanggal dan nominal wajib diisi");
      return;
    }
    if (expForm.category === "SALARY" && !expForm.employeeId) {
      toast.error("Pilih karyawan untuk gaji");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        date: expForm.date,
        amount: Number(expForm.amount),
        category: expForm.category,
        employeeId: expForm.category === "SALARY" ? expForm.employeeId : null,
        workPeriod: expForm.workPeriod || null,
        note: expForm.note || null,
      };
      const res = await fetch(editingExpense ? `/api/expenses/${editingExpense.id}` : "/api/expenses", {
        method: editingExpense ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan");
      if (editingExpense) {
        setExpenses((prev) => sortExpenses(prev.map((x) => (x.id === data.id ? data : x))));
        toast.success("Pengeluaran diperbarui");
      } else {
        setExpenses((prev) => sortExpenses([data, ...prev]));
        toast.success("Pengeluaran dicatat");
      }
      setExpFormOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  // ─── Employee CRUD ──────────────────────────────────────────────────────────
  const openCreateEmployee = () => {
    setEditingEmployee(null);
    setEmpForm(emptyEmpForm());
    setEmpFormOpen(true);
  };

  const openEditEmployee = (emp: Employee) => {
    setEditingEmployee(emp);
    setEmpForm({
      name: emp.name,
      position: emp.position || "",
      phone: emp.phone || "",
      salary: emp.salary != null ? String(emp.salary) : "",
      isActive: emp.isActive,
    });
    setEmpFormOpen(true);
  };

  const submitEmployee = async () => {
    if (!empForm.name.trim()) {
      toast.error("Nama karyawan wajib diisi");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: empForm.name,
        position: empForm.position || null,
        phone: empForm.phone || null,
        salary: empForm.salary !== "" ? Number(empForm.salary) : null,
        isActive: empForm.isActive,
      };
      const res = await fetch(editingEmployee ? `/api/employees/${editingEmployee.id}` : "/api/employees", {
        method: editingEmployee ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan");
      if (editingEmployee) {
        setEmployees((prev) => prev.map((x) => (x.id === data.id ? data : x)));
        toast.success("Karyawan diperbarui");
      } else {
        setEmployees((prev) => [...prev, data]);
        toast.success("Karyawan ditambahkan");
      }
      setEmpFormOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!confirm) return;
    setSaving(true);
    try {
      const url = confirm.type === "expense" ? `/api/expenses/${confirm.id}` : `/api/employees/${confirm.id}`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus");
      if (confirm.type === "expense") {
        setExpenses((prev) => prev.filter((x) => x.id !== confirm.id));
      } else {
        setEmployees((prev) => prev.filter((x) => x.id !== confirm.id));
        setExpenses((prev) => prev.map((x) => (x.employeeId === confirm.id ? { ...x, employee: null, employeeId: null } : x)));
      }
      toast.success("Data dihapus");
    } catch (e: any) {
      toast.error(e.message || "Gagal menghapus");
    } finally {
      setSaving(false);
      setConfirm(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Pengeluaran</h1>
        <p className="text-stone-500 text-sm mt-0.5">Catat gaji karyawan, bensin mobil & pengeluaran lainnya</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("expenses")}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-semibold transition-colors",
            tab === "expenses" ? "bg-orange-500 text-white" : "bg-white text-stone-600 border border-stone-200"
          )}
        >
          Pengeluaran
        </button>
        <button
          onClick={() => setTab("employees")}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-semibold transition-colors",
            tab === "employees" ? "bg-orange-500 text-white" : "bg-white text-stone-600 border border-stone-200"
          )}
        >
          Data Karyawan
        </button>
      </div>

      {tab === "expenses" ? (
        <>
          {/* Action + filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <button onClick={openCreateExpense} className="btn btn-primary">
              <Plus size={16} /> Catat Pengeluaran
            </button>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterCat)}
              className="input sm:w-52"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="SALARY">Gaji Karyawan</option>
              <option value="FUEL">Bensin Mobil</option>
              <option value="OTHER">Lainnya</option>
            </select>
            <div className="sm:ml-auto text-sm">
              <span className="text-stone-400">Total: </span>
              <span className="font-bold text-stone-900">Rp {totalFiltered.toLocaleString("id-ID")}</span>
            </div>
          </div>

          {/* List grouped by month */}
          {Object.keys(grouped).length === 0 ? (
            <div className="card p-10 text-center">
              <Wallet size={28} className="mx-auto text-stone-300 mb-3" />
              <p className="text-stone-500 text-sm font-medium">Belum ada pengeluaran</p>
              <p className="text-stone-400 text-xs mt-1">Klik &quot;Catat Pengeluaran&quot; untuk mulai</p>
            </div>
          ) : (
            Object.entries(grouped).map(([month, items]) => (
              <div key={month} className="card overflow-hidden">
                <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between">
                  <h3 className="font-bold text-stone-900 text-sm capitalize">{month}</h3>
                  <span className="text-sm font-semibold text-red-500">
                    Rp {items.reduce((s, e) => s + e.amount, 0).toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="divide-y divide-stone-50">
                  {items.map((e) => {
                    const meta = CATEGORY_META[e.category];
                    const Icon = meta.icon;
                    const title =
                      e.category === "SALARY" ? (e.employee?.name || "Karyawan") : EXPENSE_CATEGORY_LABEL[e.category];
                    return (
                      <div key={e.id} className="flex items-center gap-3 px-4 sm:px-5 py-3">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border", meta.bg)}>
                          <Icon size={17} className={meta.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-stone-900 text-sm truncate">{title}</p>
                          <p className="text-xs text-stone-400">
                            {formatDate(e.date)}
                            {e.workPeriod ? ` · Kerja: ${e.workPeriod}` : ""}
                            {e.note ? ` · ${e.note}` : ""}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-stone-900 text-sm">Rp {e.amount.toLocaleString("id-ID")}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => openEditExpense(e)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600"
                            aria-label="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => setConfirm({ type: "expense", id: e.id, label: title })}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-500"
                            aria-label="Hapus"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </>
      ) : (
        <>
          {/* Employees tab */}
          <div className="flex items-center justify-between gap-3">
            <button onClick={openCreateEmployee} className="btn btn-primary">
              <Plus size={16} /> Tambah Karyawan
            </button>
            <span className="text-sm text-stone-400">{activeEmployees.length} aktif</span>
          </div>

          {employees.length === 0 ? (
            <div className="card p-10 text-center">
              <Users size={28} className="mx-auto text-stone-300 mb-3" />
              <p className="text-stone-500 text-sm font-medium">Belum ada karyawan</p>
              <p className="text-stone-400 text-xs mt-1">Tambah data karyawan untuk pencatatan gaji</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="divide-y divide-stone-50">
                {employees.map((emp) => (
                  <div key={emp.id} className="flex items-center gap-3 px-4 sm:px-5 py-3.5">
                    <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center shrink-0">
                      <UserIcon size={17} className="text-stone-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-stone-900 text-sm truncate">{emp.name}</p>
                        {!emp.isActive && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-500 whitespace-nowrap">
                            Nonaktif
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-400 truncate">
                        {[emp.position, emp.phone].filter(Boolean).join(" · ") || "—"}
                        {emp.salary != null && ` · Gaji: Rp ${emp.salary.toLocaleString("id-ID")}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditEmployee(emp)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600"
                        aria-label="Edit"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setConfirm({ type: "employee", id: emp.id, label: emp.name })}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-500"
                        aria-label="Hapus"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── Expense form modal ─────────────────────────────────────────────── */}
      <ResponsiveModal
        isOpen={expFormOpen}
        onClose={() => setExpFormOpen(false)}
        title={editingExpense ? "Edit Pengeluaran" : "Catat Pengeluaran"}
        subtitle="Gaji karyawan, bensin mobil & lainnya"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Kategori</label>
            <div className="grid grid-cols-3 gap-2">
              {(["SALARY", "FUEL", "OTHER"] as ExpenseCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setExpForm((f) => ({ ...f, category: cat, employeeId: cat === "SALARY" ? f.employeeId || activeEmployees[0]?.id || "" : "" }))}
                  className={cn(
                    "border rounded-xl px-3 py-2.5 text-sm font-medium transition-all text-center",
                    expForm.category === cat
                      ? cn("border-transparent ring-2", CATEGORY_META[cat].ring, CATEGORY_META[cat].bg, CATEGORY_META[cat].color)
                      : "border-stone-200 text-stone-500 hover:border-stone-300"
                  )}
                >
                  {EXPENSE_CATEGORY_LABEL[cat]}
                </button>
              ))}
            </div>
          </div>

          {expForm.category === "SALARY" && (
            <div>
              <label className="label">Karyawan</label>
              <select
                value={expForm.employeeId}
                onChange={(e) => setExpForm((f) => ({ ...f, employeeId: e.target.value }))}
                className="input"
              >
                <option value="">Pilih karyawan</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                    {emp.salary != null ? ` (Rp ${emp.salary.toLocaleString("id-ID")})` : ""}
                    {!emp.isActive ? " — Nonaktif" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {expForm.category === "SALARY" && (
            <div>
              <label className="label">Tanggal Kerja <span className="text-stone-300">(opsional)</span></label>
              <input
                type="text"
                placeholder="Mis. 1-15 Agustus 2026"
                value={expForm.workPeriod}
                onChange={(e) => setExpForm((f) => ({ ...f, workPeriod: e.target.value }))}
                className="input"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Tanggal</label>
              <input
                type="date"
                value={expForm.date}
                onChange={(e) => setExpForm((f) => ({ ...f, date: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="label">Nominal (Rp)</label>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="100000"
                value={expForm.amount}
                onChange={(e) => setExpForm((f) => ({ ...f, amount: e.target.value }))}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Keterangan <span className="text-stone-300">(opsional)</span></label>
            <input
              type="text"
              placeholder={expForm.category === "SALARY" ? "Mis. Gaji bulan Agustus" : "Mis. Isi Pertamax 20L"}
              value={expForm.note}
              onChange={(e) => setExpForm((f) => ({ ...f, note: e.target.value }))}
              className="input"
            />
          </div>

          <button onClick={submitExpense} disabled={saving} className="btn btn-primary w-full justify-center">
            {saving ? "Menyimpan..." : editingExpense ? "Simpan Perubahan" : "Simpan Pengeluaran"}
          </button>
        </div>
      </ResponsiveModal>

      {/* ─── Employee form modal ───────────────────────────────────────────── */}
      <ResponsiveModal
        isOpen={empFormOpen}
        onClose={() => setEmpFormOpen(false)}
        title={editingEmployee ? "Edit Karyawan" : "Tambah Karyawan"}
        subtitle="Data karyawan untuk pencatatan gaji"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Nama Lengkap</label>
            <input
              type="text"
              placeholder="Nama karyawan"
              value={empForm.name}
              onChange={(e) => setEmpForm((f) => ({ ...f, name: e.target.value }))}
              className="input"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Jabatan <span className="text-stone-300">(opsional)</span></label>
              <div className="relative">
                <Briefcase size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" />
                <input
                  type="text"
                  placeholder="Fotografer"
                  value={empForm.position}
                  onChange={(e) => setEmpForm((f) => ({ ...f, position: e.target.value }))}
                  className="input pl-9"
                />
              </div>
            </div>
            <div>
              <label className="label">Telepon <span className="text-stone-300">(opsional)</span></label>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" />
                <input
                  type="text"
                  inputMode="tel"
                  placeholder="08xxxx"
                  value={empForm.phone}
                  onChange={(e) => setEmpForm((f) => ({ ...f, phone: e.target.value }))}
                  className="input pl-9"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="label">Gaji Pokok (Rp) <span className="text-stone-300">(opsional, default isian)</span></label>
            <div className="relative">
              <Banknote size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" />
              <input
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="1000000"
                value={empForm.salary}
                onChange={(e) => setEmpForm((f) => ({ ...f, salary: e.target.value }))}
                className="input pl-9"
              />
            </div>
          </div>
          <label className="flex items-center gap-2.5 select-none">
            <input
              type="checkbox"
              checked={empForm.isActive}
              onChange={(e) => setEmpForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="w-4 h-4 accent-orange-500"
            />
            <span className="text-sm text-stone-700">Karyawan aktif</span>
          </label>
          <button onClick={submitEmployee} disabled={saving} className="btn btn-primary w-full justify-center">
            {saving ? "Menyimpan..." : editingEmployee ? "Simpan Perubahan" : "Simpan Karyawan"}
          </button>
        </div>
      </ResponsiveModal>

      {/* ─── Confirm delete ────────────────────────────────────────────────── */}
      <ResponsiveConfirm
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={handleDelete}
        title="Hapus Data"
        message={
          confirm
            ? `Yakin ingin menghapus ${confirm.type === "expense" ? "pengeluaran" : "karyawan"} "${confirm.label}"? Tindakan ini tidak bisa dibatalkan.`
            : ""
        }
      />
    </div>
  );
}
