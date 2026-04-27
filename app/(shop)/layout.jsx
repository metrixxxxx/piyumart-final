import Navbar from "@/components/ui/navbar";
import SessionWrapper from "@/components/SessionWrapper";


export default function ShopLayout({ children }) {
  return (
    <SessionWrapper>
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="bg-gray-900 text-green text-center py-4">
        © 2026 My Marketplace
      </footer>
    </SessionWrapper>
  );
  
}