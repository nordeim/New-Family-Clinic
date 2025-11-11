// @/pages/index.tsx
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

export default function HomePage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-6xl">
          Welcome to Gabriel Family Clinic
        </h1>
        <p className="mt-6 text-lg leading-8 text-neutral-700">
          Your neighborhood clinic, reimagined.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Button size="lg">Book Appointment</Button>
          <Button size="lg" variant="outline">
            Our Services
          </Button>
        </div>
      </div>
      <div className="mt-16">
        <Card>
          <CardHeader>
            <CardTitle>Core Infrastructure Ready</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              This page demonstrates that the core layout, base UI components,
              and styling are all working correctly.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
