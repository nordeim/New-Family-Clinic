// pages/doctor/login.tsx
// This can reuse the existing /pages/login.tsx component.
// The login logic will now include a role-based redirect.

// Updated logic snippet for handleLogin in /pages/login.tsx:
/*
  const { data: sessionData, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    setError(error.message);
    setIsLoading(false);
  } else if (sessionData.user) {
    // Fetch user role after successful login
    const { data: userProfile } = await supabase
      .from("users")
      .select("role")
      .eq("id", sessionData.user.id)
      .single();

    if (userProfile?.role === 'doctor') {
      router.push("/doctor/dashboard");
    } else {
      router.push("/dashboard"); // Default to patient dashboard
    }
  }
*/
