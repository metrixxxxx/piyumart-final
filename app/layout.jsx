import "./globals.css";
import SessionWrapper from "@/components/SessionWrapper";
import Navbar from "@/components/ui/navbar";
import { Suspense } from "react";
import NavigationProgress from "@/components/NavigationProgress";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-100 min-h-screen flex flex-col">
        <Suspense>
          <NavigationProgress />
        </Suspense>
        <SessionWrapper>
          <Navbar />
          {children}
        </SessionWrapper>
      </body>
    </html>
  );
}