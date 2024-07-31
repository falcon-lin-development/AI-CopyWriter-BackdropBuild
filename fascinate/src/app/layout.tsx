import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// providers
import StoreProvider from "@/providers/StoreProvider";
import UserSessionProvider from "@/providers/UserSessionProvider";
import MUIThemeProvider from "@/providers/MUIThemeProvider";
import { CssBaseline } from "@mui/material";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Brand Copywriting AI",
  description: "Generate viral brand copywriting with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <StoreProvider >
          <UserSessionProvider >
            <MUIThemeProvider>
              <CssBaseline />
              {children}
            </MUIThemeProvider>
          </UserSessionProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
