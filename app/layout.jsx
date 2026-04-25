import "./globals.css";
import Navbar from "@/components/ui/navbar";
import SessionWrapper from "@/components/SessionWrapper";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-100 min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}