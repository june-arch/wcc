"use client";
// src/components/EventTypesClient.tsx
import { useState, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Search,
  Tag,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { EventType } from "@/types";
import ResponsiveModal from "./ui/ResponsiveModal";
import ResponsiveConfirm from "./ui/ResponsiveConfirm";
import toast from "react-hot-toast";

interface Props {
  eventTypes: EventType[];
}

export default function EventTypesClient({ eventTypes: initialEventTypes }: Props) {
  const [eventTypes, setEventTypes] = useState<EventType[]>(initialEventTypes);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingEventType, setEditingEventType] = useState<EventType | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
  }>({ isOpen: false, id: "", name: "" });

  const [form, setForm] = useState({
    name: "",
    label: "",
    description: "",
    isActive: true,
    sortOrder: "0",
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return eventTypes;
    const s = search.toLowerCase();
    return eventTypes.filter(
      (et) =>
        et.name.toLowerCase().includes(s) ||
        et.label.toLowerCase().includes(s) ||
        et.description?.toLowerCase().includes(s)
    );
  }, [eventTypes, search]);

  const resetForm = () => {
    setForm({
      name: "",
      label: "",
      description: "",
      isActive: true,
      sortOrder: "0",
    });
    setEditingEventType(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (eventType: EventType) => {
    setEditingEventType(eventType);
    setForm({
      name: eventType.name,
      label: eventType.label,
      description: eventType.description || "",
      isActive: eventType.isActive,
      sortOrder: eventType.sortOrder.toString(),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.label.trim()) {
      toast.error("Nama dan label wajib diisi");
      return;
    }

    const data = {
      name: form.name.trim(),
      label: form.label.trim(),
      description: form.description.trim() || null,
      isActive: form.isActive,
      sortOrder: parseInt(form.sortOrder) || 0,
    };

    setSaving(true);

    try {
      if (editingEventType) {
        // Optimistic update
        const originalEventTypes = [...eventTypes];
        const optimisticUpdate = { ...editingEventType, ...data };
        setEventTypes((prev) =>
          prev.map((et) => (et.id === editingEventType.id ? optimisticUpdate : et))
        );

        const res = await fetch(`/api/event-types/${editingEventType.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          setEventTypes(originalEventTypes);
          throw new Error();
        }

        const updated = await res.json();
        setEventTypes((prev) =>
          prev.map((et) => (et.id === updated.id ? updated : et))
        );
        toast.success("Event type diperbarui");
      } else {
        // Optimistic update
        const tempId = `temp-${Date.now()}`;
        const optimisticEventType: EventType = {
          ...data,
          id: tempId,
          sortOrder: parseInt(form.sortOrder) || 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setEventTypes((prev) => [...prev, optimisticEventType]);

        const res = await fetch("/api/event-types", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          setEventTypes((prev) => prev.filter((et) => et.id !== tempId));
          throw new Error();
        }

        const created = await res.json();
        setEventTypes((prev) =>
          prev.map((et) => (et.id === tempId ? created : et))
        );
        toast.success("Event type ditambahkan");
      }
      setShowModal(false);
      resetForm();
    } catch {
      toast.error("Gagal menyimpan event type");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const { id } = deleteConfirm;
    const originalEventTypes = [...eventTypes];

    // Optimistic update
    setEventTypes((prev) => prev.filter((et) => et.id !== id));
    setDeletingId(id);
    setDeleteConfirm({ isOpen: false, id: "", name: "" });

    try {
      const res = await fetch(`/api/event-types/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Event type dihapus");
    } catch {
      setEventTypes(originalEventTypes);
      toast.error("Gagal menghapus event type");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-stone-900">Event Types</h1>
          <p className="text-stone-500 text-sm mt-0.5">
            Kelola jenis acara untuk booking dan paket harga
          </p>
        </div>
        <button onClick={openCreate} className="btn btn-primary gap-2 shrink-0">
          <Plus size={16} />
          Tambah Event Type
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
          <input
            type="text"
            placeholder="Cari event type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base w-full pl-10"
          />
        </div>
        <span className="text-sm text-stone-400">
          {filtered.length} event type
        </span>
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((eventType) => (
          <div
            key={eventType.id}
            className={cn(
              "card p-4 border-2 transition-all",
              eventType.isActive ? "border-transparent" : "border-stone-200 opacity-60"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 text-stone-400">
                <GripVertical size={16} />
                <span className="text-xs font-medium">#{eventType.sortOrder}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(eventType)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() =>
                    setDeleteConfirm({
                      isOpen: true,
                      id: eventType.id,
                      name: eventType.label,
                    })
                  }
                  disabled={deletingId === eventType.id}
                  className={cn(
                    "w-8 h-8 flex items-center justify-center rounded-lg transition-colors",
                    deletingId === eventType.id
                      ? "text-stone-300 cursor-not-allowed"
                      : "text-stone-400 hover:text-red-600 hover:bg-red-50"
                  )}
                >
                  {deletingId === eventType.id ? (
                    <div className="w-4 h-4 border-2 border-stone-300 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-stone-900">{eventType.label}</h3>
                {!eventType.isActive && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-500">
                    Nonaktif
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-400 font-mono mt-0.5">{eventType.name}</p>
            </div>

            {eventType.description && (
              <p className="text-xs text-stone-500 mt-2 line-clamp-2">{eventType.description}</p>
            )}

            <div className="mt-3 pt-3 border-t border-stone-100">
              <span className="text-[10px] text-stone-400">
                ID: {eventType.id.slice(0, 8)}...
              </span>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card py-12 text-center">
          <Tag size={32} className="mx-auto text-stone-300 mb-3" />
          <p className="text-stone-500 font-medium">Belum ada event type</p>
          <p className="text-stone-400 text-sm mt-1">Klik tombol di atas untuk menambahkan</p>
        </div>
      )}

      {/* Modal */}
      <ResponsiveModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingEventType ? "Edit Event Type" : "Tambah Event Type"}
        subtitle={editingEventType ? editingEventType.label : "Buat event type baru"}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                Label <span className="text-red-400">*</span>
              </label>
              <input
                className="input-base w-full"
                placeholder="Contoh: Akad Nikah"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
              />
              <p className="text-xs text-stone-400 mt-1">Nama tampilan untuk UI</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                Name (Key) <span className="text-red-400">*</span>
              </label>
              <input
                className="input-base w-full"
                placeholder="Contoh: AKAD_NIKAH"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value.toUpperCase().replace(/\s+/g, "_") })
                }
              />
              <p className="text-xs text-stone-400 mt-1">Identifier unik (UPPERCASE_SNAKE)</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                Urutan
              </label>
              <input
                type="number"
                className="input-base w-full"
                placeholder="0"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setForm({ ...form, isActive: !form.isActive })}
                  className={cn(
                    "relative w-10 h-5 rounded-full transition-colors",
                    form.isActive ? "bg-orange-500" : "bg-stone-300"
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                      form.isActive ? "translate-x-5" : "translate-x-0.5"
                    )}
                  />
                </div>
                <span className="text-sm font-medium text-stone-700">Aktif</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              Deskripsi
            </label>
            <textarea
              className="input-base w-full resize-none"
              rows={2}
              placeholder="Deskripsi event type..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="btn btn-secondary flex-1 order-2 sm:order-1"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary flex-1 justify-center order-1 sm:order-2"
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Menyimpan...
                </div>
              ) : editingEventType ? (
                "Simpan Perubahan"
              ) : (
                "Tambah Event Type"
              )}
            </button>
          </div>
        </div>
      </ResponsiveModal>

      {/* Delete Confirmation */}
      <ResponsiveConfirm
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: "", name: "" })}
        onConfirm={handleDelete}
        title="Hapus Event Type?"
        message={`Yakin ingin menghapus "${deleteConfirm.name}"? Event type yang sudah dihapus tidak bisa dikembalikan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
