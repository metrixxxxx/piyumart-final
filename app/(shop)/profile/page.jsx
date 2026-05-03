"use client";
import { useSession } from "next-auth/react";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    firstName: session?.user?.name?.split(" ")[0] || "",
    lastName: session?.user?.name?.split(" ")[1] || "",
    email: session?.user?.email || "",
    contactNumber: session?.user?.contactNumber || "",
    address: session?.user?.address || "",
    currentPassword: "",
    newPassword: "",
  });

  const [preview, setPreview] = useState(session?.user?.image || null);
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const update2 = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("firstName", form.firstName);
    formData.append("lastName", form.lastName);
    formData.append("contactNumber", form.contactNumber);
    formData.append("address", form.address);
    if (form.currentPassword) formData.append("currentPassword", form.currentPassword);
    if (form.newPassword) formData.append("newPassword", form.newPassword);
    if (imageFile) formData.append("image", imageFile);

    const res = await fetch("/api/profile/update", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.message);
    } else {
      setSuccess("Profile updated successfully!");
      await update(); // refresh session
    }
  };

  const field = (label, type, key, placeholder, required = true) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-400">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={form[key]}
        onChange={update2(key)}
        required={required}
        className="h-10 rounded-xl border border-[#2e3460] bg-[#252a4a] px-4 text-sm text-[#e0e4ff] placeholder-[#4a5080] outline-none transition focus:border-[#4f8ef7]"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f1123] px-6 py-10">
      <div className="mx-auto max-w-2xl">

        <h1 className="mb-8 text-2xl font-bold text-white">
          My <span className="text-[#4f8ef7]">Profile</span>
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="relative cursor-pointer"
              onClick={() => fileRef.current.click()}
            >
              {preview ? (
                <img
                  src={preview}
                  alt="avatar"
                  className="h-24 w-24 rounded-full object-cover border-4 border-[#4f8ef7]"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#252a4a] border-4 border-[#4f8ef7] text-3xl font-bold text-[#4f8ef7]">
                  {form.firstName?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#4f8ef7] text-white shadow">
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828A2 2 0 019 15V13z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500">Click to change photo</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </div>

          {/* Info card */}
          <div className="rounded-2xl bg-[#1a1d35] p-6 flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Personal Info</h2>
            <div className="grid grid-cols-2 gap-4">
              {field("First Name", "text", "firstName", "First name")}
              {field("Last Name", "text", "lastName", "Last name")}
            </div>
            {field("Email", "email", "email", "Email", false)}
            <p className="text-[11px] text-gray-600 -mt-2">Email cannot be changed.</p>
            {field("Contact Number", "tel", "contactNumber", "e.g. 09XX XXX XXXX", false)}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Address</label>
              <textarea
                placeholder="Your address"
                value={form.address}
                onChange={update2("address")}
                rows={2}
                className="resize-none rounded-xl border border-[#2e3460] bg-[#252a4a] px-4 py-2.5 text-sm text-[#e0e4ff] placeholder-[#4a5080] outline-none transition focus:border-[#4f8ef7]"
              />
            </div>
          </div>

          {/* Password card */}
          <div className="rounded-2xl bg-[#1a1d35] p-6 flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Change Password</h2>
            <p className="text-xs text-gray-600 -mt-2">Leave blank to keep your current password.</p>
            {field("Current Password", "password", "currentPassword", "Current password", false)}
            {field("New Password", "password", "newPassword", "New password", false)}
          </div>

          {error && <p className="text-center text-sm text-red-400">{error}</p>}
          {success && <p className="text-center text-sm text-green-400">{success}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 h-11 rounded-full border border-[#2e3460] text-sm text-gray-400 hover:bg-[#1a1d35] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-11 rounded-full bg-[#4f8ef7] text-sm font-semibold text-white hover:bg-[#3a7de8] transition active:scale-95 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}