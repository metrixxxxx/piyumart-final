"use client";
import { useState } from "react";

export default function ProductImageVariants({ onChange }) {
  const [mainImages, setMainImages] = useState([]);
  const [variants, setVariants] = useState([]);

  // --- Main Images ---
  const handleMainImages = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    const updated = [...mainImages, ...previews];
    setMainImages(updated);
    onChange?.({ mainImages: updated, variants });
  };

  const removeMainImage = (index) => {
    const updated = mainImages.filter((_, i) => i !== index);
    setMainImages(updated);
    onChange?.({ mainImages: updated, variants });
  };

  // --- Variants ---
  const addVariant = () => {
    const updated = [...variants, { label: "", image: null, preview: null }];
    setVariants(updated);
    onChange?.({ mainImages, variants: updated });
  };

  const updateVariantLabel = (index, label) => {
    const updated = variants.map((v, i) => i === index ? { ...v, label } : v);
    setVariants(updated);
    onChange?.({ mainImages, variants: updated });
  };

  const updateVariantImage = (index, file) => {
    const updated = variants.map((v, i) =>
      i === index ? { ...v, file, preview: URL.createObjectURL(file) } : v
    );
    setVariants(updated);
    onChange?.({ mainImages, variants: updated });
  };

  const removeVariant = (index) => {
    const updated = variants.filter((_, i) => i !== index);
    setVariants(updated);
    onChange?.({ mainImages, variants: updated });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* MAIN IMAGES */}
      <div>
        <p style={{ fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "10px" }}>
          Product Photos
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
          {mainImages.map((img, i) => (
            <div key={i} style={{ position: "relative", width: "90px", height: "90px" }}>
              <img
                src={img.preview}
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px", border: "1px solid #e5e7eb" }}
              />
              <button
                onClick={() => removeMainImage(i)}
                style={{
                  position: "absolute", top: "-6px", right: "-6px",
                  background: "#e94560", color: "#fff", border: "none",
                  borderRadius: "50%", width: "20px", height: "20px",
                  fontSize: "11px", cursor: "pointer", fontWeight: "700",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}
              >✕</button>
            </div>
          ))}

          {/* Add photo button */}
          <label style={{
            width: "90px", height: "90px", border: "2px dashed #d1d5db",
            borderRadius: "10px", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#9ca3af", fontSize: "11px", gap: "4px"
          }}>
            <span style={{ fontSize: "22px" }}>+</span>
            Add photo
            <input type="file" accept="image/*" multiple onChange={handleMainImages} style={{ display: "none" }} />
          </label>
        </div>
      </div>

      {/* VARIANTS */}
      <div>
        <p style={{ fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "10px" }}>
          Variants <span style={{ fontSize: "12px", fontWeight: "400", color: "#9ca3af" }}>(color, size, etc.)</span>
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {variants.map((variant, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: "12px",
              background: "#f9fafb", borderRadius: "10px",
              padding: "10px 12px", border: "1px solid #f3f4f6"
            }}>

              {/* Variant image */}
              <label style={{ cursor: "pointer", flexShrink: 0 }}>
                {variant.preview ? (
                  <img
                    src={variant.preview}
                    style={{ width: "56px", height: "56px", objectFit: "cover", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                  />
                ) : (
                  <div style={{
                    width: "56px", height: "56px", border: "2px dashed #d1d5db",
                    borderRadius: "8px", display: "flex", alignItems: "center",
                    justifyContent: "center", color: "#9ca3af", fontSize: "20px"
                  }}>+</div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => updateVariantImage(i, e.target.files[0])}
                  style={{ display: "none" }}
                />
              </label>

              {/* Variant label */}
              <input
                type="text"
                placeholder="e.g. Red - Large"
                value={variant.label}
                onChange={(e) => updateVariantLabel(i, e.target.value)}
                style={{
                  flex: 1, padding: "8px 12px", borderRadius: "8px",
                  border: "1px solid #e5e7eb", fontSize: "13px",
                  outline: "none", background: "white"
                }}
              />

              {/* Remove variant */}
              <button
                onClick={() => removeVariant(i)}
                style={{
                  background: "none", border: "none", color: "#e94560",
                  cursor: "pointer", fontSize: "18px", lineHeight: 1
                }}
              >✕</button>
            </div>
          ))}

          <button
            onClick={addVariant}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: "none", border: "1px dashed #d1d5db",
              borderRadius: "10px", padding: "10px 16px",
              color: "#6b7280", fontSize: "13px", cursor: "pointer",
              width: "fit-content"
            }}
          >
            + Add variant
          </button>
        </div>
      </div>
    </div>
  );
}