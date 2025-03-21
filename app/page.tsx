"use client";

import { Suspense, useState, useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";
import dynamic from "next/dynamic";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation"; // ✅ Correct import

const DynamicAdminContent = dynamic(() => import("../components/admin-content"), { ssr: false });
const DynamicUserContent = dynamic(() => import("../components/user-content"), { ssr: false });

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert" className="p-4 bg-red-100 border border-red-400 rounded">
      <p className="font-bold text-red-800">Something went wrong:</p>
      <pre className="text-sm text-red-600 mt-2">{error.message}</pre>
      <Button onClick={resetErrorBoundary} className="mt-4">
        Try again
      </Button>
    </div>
  );
}

export default function Home() {
  return (
    <div className="container mx-auto p-4">
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Suspense fallback={<div>Loading...</div>}>
          <ClientSideContent />
        </Suspense>
      </ErrorBoundary>
      <Toaster />
    </div>
  );
}

// ✅ Move to a separate file or explicitly mark as a Client Component
function ClientSideContent() {
  "use client"; // ✅ Ensure this is treated as a Client Component

  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (!role) {
      router.push("/login");
    } else {
      setUserRole(role);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("username");
    router.push("/login");
  };

  if (!userRole) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Nahom Computer Store</h1>
        <Button onClick={handleLogout}>Logout</Button>
      </div>
      {userRole === "admin" ? <DynamicAdminContent /> : <DynamicUserContent />}
    </>
  );
} // ✅ Make sure this closing bracket exists!
