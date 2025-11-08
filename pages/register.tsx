// @/pages/register.tsx
import { PatientRegistrationForm } from "@/components/forms/PatientRegistrationForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

export default function RegisterPage() {
  return (
    <div className="container mx-auto flex min-h-[80vh] items-center justify-center py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Create Your Account</CardTitle>
          <CardDescription>
            Join Gabriel Family Clinic to manage your health with ease.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PatientRegistrationForm />
        </CardContent>
      </Card>
    </div>
  );
}
