// pages/_app.tsx (Updated)

import "@/styles/globals.css";
import "@mantine/core/styles.css";

import type { AppType } from "next/app";
import { Inter } from "next/font/google"; // Import from next/font
import { MantineProvider } from "@mantine/core";
import { TRPCReactProvider } from "@/lib/trpc/react";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { theme } from "@/styles/theme";
import { Layout } from "@/components/layout/Layout";
import { cn } from "@/lib/utils";

// Configure the font
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans", // Create a CSS variable
});

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <main className={cn("font-sans", inter.variable)}> {/* Apply the font variable */}
      <TRPCReactProvider>
        <MantineProvider theme={theme} defaultColorScheme="auto">
          <AuthProvider>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </AuthProvider>
        </MantineProvider>
      </TRPCReactProvider>
    </main>
  );
};

export default MyApp;
