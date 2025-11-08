// @/lib/auth/actions.ts
"use server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { patientRegistrationSchema } from "@/types/zod-schemas";
import { env } from "@/env";

export async function signup(formData: unknown) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  // Use a service role client to insert into non-auth tables
  const supabaseAdmin = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  const parsed = patientRegistrationSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: "Invalid form data.", details: parsed.error.flatten() };
  }

  const { email, password, fullName, phone, dateOfBirth, nric } = parsed.data;

  // 1. Create the auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (authError || !authData.user) {
    return { error: authError?.message ?? "Could not sign up user." };
  }
  const userId = authData.user.id;

  // 2. Create the corresponding public.users record
  const { error: userError } = await supabaseAdmin.from("users").insert({
    id: userId,
    full_name: fullName,
    email: email,
    phone: phone,
    role: "patient",
  });
  
  if (userError) {
    // This is a critical failure. We should ideally roll back the auth user creation.
    // For now, we'll log it and return an error.
    console.error("Failed to create public.users record:", userError);
    return { error: "Failed to create user profile. Please contact support." };
  }
  
  // 3. Create the patient profile
  const { error: patientError } = await supabaseAdmin.from("patients").insert({
    user_id: userId,
    date_of_birth: dateOfBirth,
    // A placeholder clinicId for now. A real app would have a selection.
    clinic_id: "your-default-clinic-uuid", 
    patient_number: `P-${Date.now()}`, // Placeholder logic
    nric_hash: "...", // Hash the NRIC server-side
    nric_encrypted: "...", // Encrypt the NRIC server-side
    gender: "prefer_not_to_say", // Default or from form
  });

  if (patientError) {
    console.error("Failed to create patient profile:", patientError);
    return { error: "Failed to create patient profile. Please contact support." };
  }

  return { error: null, success: true };
}
