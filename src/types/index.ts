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
  payments: Payment[];
  bookingAddOns?: BookingAddOn[];
  createdBy?: { name: string; email: string } | null;
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

export type PricePackage = {
  id: string;
  name: string;
  price: number;
  eventTypes: string[];
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type AddOn = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type BookingAddOn = {
  id: string;
  bookingId: string;
  addOnId: string;
  price: number;
  addOn: AddOn;
};
