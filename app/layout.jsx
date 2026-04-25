import "./globals.css";
import Navbar from "@/components/ui/navbar";
import SessionWrapper from "@/components/SessionWrapper"; // 👈 add this

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-100 min-h-screen flex flex-col">
        <SessionWrapper> {/* 👈 wrap everything */}
          <Navbar />
          <main className="flex-1 p-6">{children}</main>
          <footer className="bg-gray-900 text-green text-center py-4">
            © 2026 My Marketplace
          </footer>
        </SessionWrapper>
      </body>
    </html>
  );
}