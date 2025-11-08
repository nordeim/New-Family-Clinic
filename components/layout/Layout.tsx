// @/components/layout/Layout.tsx

import React from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { SkipLink } from "@/components/common/SkipLink";

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * The main layout wrapper for the entire application.
 * It combines the Header, Footer, and main content area to ensure a
 * consistent structure on every page. It also includes an accessibility
 * "Skip to main content" link.
 * @param {LayoutProps} props - The component props.
 * @param {React.ReactNode} props.children - The page content to be rendered inside the layout.
 * @returns A React component.
 */
export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <SkipLink targetId="main-content" />
      
      <Header />

      <main 
        id="main-content" 
        className="flex-1 w-full"
        // Add tabIndex to make it programmatically focusable for the skip link
        tabIndex={-1} 
        style={{ outline: 'none' }}
      >
        {children}
      </main>

      <Footer />
    </div>
  );
}
