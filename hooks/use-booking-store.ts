// @/hooks/use-booking-store.ts
import { create } from "zustand";

type BookingState = {
  step: number;
  clinicId: string | null;
  doctorId: string | null;
  date: Date | null;
  timeSlot: string | null;
  actions: {
    setClinic: (clinicId: string) => void;
    setDoctor: (doctorId: string) => void;
    // ... other actions
    reset: () => void;
  };
};

export const useBookingStore = create<BookingState>((set) => ({
  step: 1,
  clinicId: null,
  doctorId: null,
  date: null,
  timeSlot: null,
  actions: {
    setClinic: (clinicId) => set({ clinicId, step: 2 }),
    setDoctor: (doctorId) => set({ doctorId, step: 3 }),
    reset: () => set({ step: 1, clinicId: null, doctorId: null, date: null, timeSlot: null }),
  },
}));
