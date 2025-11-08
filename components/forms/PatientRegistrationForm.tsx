// @/components/forms/PatientRegistrationForm.tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  patientRegistrationSchema,
  type PatientRegistrationSchema,
} from "@/types/zod-schemas";
import { signup } from "@/lib/auth/actions";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

export function PatientRegistrationForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PatientRegistrationSchema>({
    resolver: zodResolver(patientRegistrationSchema),
  });

  const onSubmit = async (data: PatientRegistrationSchema) => {
    setFormError(null);
    const result = await signup(data);
    if (result.error) {
      setFormError(result.error);
    } else {
      setIsSuccess(true);
    }
  };
  
  if (isSuccess) {
    return (
      <div className="text-center">
        <h3 className="text-xl font-semibold">Registration Successful!</h3>
        <p className="mt-2 text-neutral-600">
          Please check your email to verify your account.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* NRIC Field */}
      <div className="space-y-2">
        <Label htmlFor="nric">NRIC</Label>
        <Input id="nric" {...register("nric")} />
        {errors.nric && <p className="text-sm text-red-500">{errors.nric.message}</p>}
      </div>

      {/* Full Name Field */}
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name (as per NRIC)</Label>
        <Input id="fullName" {...register("fullName")} />
        {errors.fullName && <p className="text-sm text-red-500">{errors.fullName.message}</p>}
      </div>

      {/* ... Other fields for Email, Phone, DOB, Password, Confirm Password ... */}
      
      {formError && <p className="text-sm text-red-500">{formError}</p>}
      
      <Button type="submit" className="w-full" isLoading={isSubmitting}>
        Create Account
      </Button>
    </form>
  );
}
