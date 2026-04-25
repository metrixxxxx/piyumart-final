// app/(auth)/login/layout.jsx
export default function LoginLayout({ children }) {
  return (
    <div className="min-h-2xl w-1/2 p-12 mx-auto border rounded-md flex items-center justify-center">
      {children}
    </div>
  );
}
