// @/components/appointment/BookingForm.tsx
"use client";
import { useBookingStore } from "@/hooks/use-booking-store";
// import { DoctorSelection } from './DoctorSelection';
// import { TimeSlotPicker } from './TimeSlotPicker';

export function BookingForm() {
  const step = useBookingStore((state) => state.step);

  return (
    <div>
      {step === 1 && <div>Step 1: Select Clinic (Placeholder)</div>}
      {step === 2 && <div>Step 2: Select Doctor (Placeholder)</div> /* <DoctorSelection /> */}
      {step === 3 && <div>Step 3: Select Time (Placeholder)</div> /* <TimeSlotPicker /> */}
      {step === 4 && <div>Step 4: Confirm Details (Placeholder)</div>}
    </div>
  );
}
