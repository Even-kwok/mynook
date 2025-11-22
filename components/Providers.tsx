"use client";

import { AuthProvider } from "../context/AuthContext";
import { TemplateProvider } from "../context/TemplateContext";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TemplateProvider>
        {children}
        <Toaster position="top-center" />
      </TemplateProvider>
    </AuthProvider>
  );
}

