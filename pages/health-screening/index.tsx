/**
* pages/health-screening/index.tsx
*
* NOTE:
* - The `health` tRPC router does not yet expose `getScreeningPackages`.
* - To keep types and build clean, this page renders a static placeholder and
*   does not call a non-existent procedure.
* - When the endpoint is implemented in `lib/trpc/routers/health.router.ts`,
*   wire it back here using `api.health.getScreeningPackages.useQuery()`.
*/
export default function HealthScreeningPage() {
 return (
   <div className="container mx-auto py-12">
     <h1 className="text-3xl font-bold">Health Screening Packages</h1>
     <p className="mt-4 text-gray-600">
       Explore our range of preventive health screening packages tailored for different
       age groups and risk profiles.
     </p>
     <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
       <p className="text-gray-600">
         Dynamic package listing is coming soon. This page is intentionally static until
         a typed tRPC endpoint is implemented and connected.
       </p>
     </div>
   </div>
 );
}
