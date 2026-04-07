// src/types/index.ts
export type BookingWithRelations = {
  id: string;
  clientName: string;
  hashtag: string | null;
  package: number;
  dp: number;
  paid: number;
  location: string | null;
  eventType: string[];
  startDate: Date | string;
  endDate: Date | string | null;
  status: string;
  notes: string | null;
  isConfirmed: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  tasks: Task[];
  payments: Payment[];
  createdBy?: { name: string; email: string } | null;
};

export type Task = {
  id: string;
  bookingId: string;
  title: string;
  description: string | null;
  dueDate: Date | string | null;
  status: string;
  priority: string;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type Payment = {
  id: string;
  bookingId: string;
  amount: number;
  note: string | null;
  paidAt: Date | string;
};

export type CalendarDay = {
  date: Date;
  bookings: BookingWithRelations[];
  isCurrentMonth: boolean;
  isToday: boolean;
};

export type ViewMode = "list" | "calendar";
export type FilterStatus = "ALL" | "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
