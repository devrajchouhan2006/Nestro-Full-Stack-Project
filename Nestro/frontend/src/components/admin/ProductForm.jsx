"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Select from "react-select";
import { Editor } from "primereact/editor";
import { FiTag, FiTrash2, FiPlus } from "react-icons/fi";
import { toast } from "sonner";

import { client, generateSlug } from "@/utils/helper";
import { fetchRoom, fetchCategory, removeProductImage } from "@/utils/api";

const inputClass =
  "w-full border-[1.5px] border-[#c3c9e3] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#3b497e] transition";
const labelClass = "text-xs font-semibold text-[#2a3460]";

function computeDiscount(originalPrice, salePrice) {
  const original = Number(originalPrice);
  const sale = Number(salePrice);
  if (original > 0 && sale >= 0 && sale <= original) {
    return Math.round(((original - sale) / original) * 100);
  }
  return "";
}

const emptyVariant = () => ({
  key: "",
  label: "",
  color: "",
  size: "",
  salePrice: "",
  originalPrice: "",
  stockQty: 0,
});

const blank = {
  roomId: "",
  categoryId: "",
  name: "",
  slug: "",
  sku: "",
  originalPrice: "",
  salePrice: "",
  shortDescription: "",
  description: "",
  material: "",
  color: "",
  width: "",
  height: "",
  depth: "",
  weight: "",
  stockQty: 0,
  lowStockThreshold: 3,
  bestSeller: false,
  newArrival: false,
  featured: false,
  status: true,
};

/**
 * One form, two jobs. `product` absent means create; present means edit, where
 * only the fields the admin actually touched are sent so a partial form can
 * never blank out data it does not render.
 */
export default function ProductForm({ product = null }) {
  const router = useRouter();
  const isEdit = Boolean(product);

  const [rooms, setRooms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [wait, setWait] = useState(false);

  const [formData, setFormData] = useState(() => {
    if (!product) return { ...blank };
    return {
      ...blank,
      ...product,
      roomId: product.roomId?._id || product.roomId || "",
      categoryId: product.categoryId?._id || product.categoryId || "",
      width: product.dimensions?.width ?? "",
      height: product.dimensions?.height ?? "",
      depth: product.dimensions?.depth ?? "",
      weight: product.weight ?? "",
    };
  });

  const [variants, setVariants] = useState(product?.variants || []);
  const [image, setImage] = useState(null);
  const [gallery, setGallery] = useState(product?.images || []);
  const [galleryFiles, setGalleryFiles] = useState([]);

  const discount = computeDiscount(formData.originalPrice, formData.salePrice);

  const roomOptions = useMemo(
    () => rooms.map((room) => ({ value: room._id, label: room.name })),
    [rooms]
  );
  const categoryOptions = useMemo(
    () => categories.map((category) => ({ value: category._id, label: category.name })),
    [categories]
  );

  useEffect(() => {
    Promise.all([fetchRoom(), fetchCategory()]).then(([roomRes, catRes]) => {
      setRooms(roomRes.data || []);
      setCategories(catRes.data || []);
    });
  }, []);

  const handleNameChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      name: value,
      // Editing an existing product keeps its slug: changing it would break
      // links that are already out in the world.
      slug: isEdit ? prev.slug : generateSlug(value),
    }));
  };

  const handleChange = (event) =>
    setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }));

  const handleCheckbox = (event) =>
    setFormData((prev) => ({ ...prev, [event.target.name]: event.target.checked }));

  const setVariant = (index, patch) =>
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));

  const addVariant = () => setVariants((prev) => [...prev, emptyVariant()]);
  const removeVariant = (index) => setVariants((prev) => prev.filter((_, i) => i !== index));

  const deleteGalleryImage = async (url) => {
    const data = await removeProductImage(product._id, url);
    if (!data.success) return toast.error(data.message);
    setGallery(data.images);
    toast.success("Image removed");
  };

  const validate = () => {
    if (!formData.name.trim()) return "Product name is required";
    if (!formData.roomId) return "Choose a room";
    if (!formData.categoryId) return "Choose a category";
    if (!formData.originalPrice || !formData.salePrice) return "Both prices are required";
    if (discount === "") return "The sale price cannot be higher than the original price";
    if (!isEdit && !image) return "A thumbnail image is required";

    for (const variant of variants) {
      if (!variant.label.trim()) return "Every option needs a label";
      if (!variant.salePrice) return `Set a price for “${variant.label}”`;
    }
    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const problem = validate();
    if (problem) return toast.error(problem);

    setWait(true);
    try {
      const body = new FormData();

      const fields = [
        "roomId", "categoryId", "name", "sku", "originalPrice", "salePrice",
        "shortDescription", "description", "material", "color",
        "width", "height", "depth", "weight",
        "stockQty", "lowStockThreshold",
        "bestSeller", "newArrival", "featured", "status",
      ];

      fields.forEach((field) => {
        const value = formData[field];
        // Empty optional numbers must not be sent as "" — the schema coerces
        // and would read that as zero.
        if (value === "" || value === null || value === undefined) return;
        body.append(field, value);
      });

      if (!isEdit) body.append("slug", formData.slug);
      body.append("discount", discount);

      if (variants.length) {
        body.append(
          "variants",
          JSON.stringify(
            variants.map((variant) => ({
              ...variant,
              key: variant.key || generateSlug(variant.label),
              salePrice: Number(variant.salePrice),
              originalPrice: variant.originalPrice ? Number(variant.originalPrice) : undefined,
              stockQty: Number(variant.stockQty) || 0,
            }))
          )
        );
      }

      if (image) body.append("image", image);

      const response = isEdit
        ? await client.put(`product/edit/${product._id}`, body)
        : await client.post("product/create", body);

      if (!response.data.success) throw new Error(response.data.message);

      const savedId = isEdit ? product._id : response.data.product?._id;

      // Extra gallery shots go up in a second call, because they use a
      // different multer field.
      if (galleryFiles.length && savedId) {
        const images = new FormData();
        galleryFiles.forEach((file) => images.append("images", file));
        await client.post(`product/add-images/${savedId}`, images);
      }

      toast.success(response.data.message);
      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Internal server error");
    } finally {
      setWait(false);
    }
  };

  return (
    <div className="min-h-screen mx-auto bg-[#f7f8fd] p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl border border-[#eef0f8] shadow-md overflow-hidden">
        <div className="bg-[#3b497e] px-5 py-4 flex items-center gap-2 text-white">
          <FiTag size={18} />
          <h2 className="text-[15px] font-semibold">{isEdit ? "Edit product" : "Add product"}</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-6">
          <div className="grid md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="name">Product name *</label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={(event) => handleNameChange(event.target.value)}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="slug">Slug</label>
              <input
                id="slug"
                type="text"
                value={formData.slug}
                readOnly
                className={`${inputClass} bg-gray-50 text-gray-500`}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Room *</label>
              <Select
                instanceId="product-room"
                options={roomOptions}
                value={roomOptions.find((option) => option.value === formData.roomId) || null}
                onChange={(selected) =>
                  setFormData((prev) => ({ ...prev, roomId: selected?.value || "" }))
                }
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Category *</label>
              <Select
                instanceId="product-category"
                options={categoryOptions}
                value={categoryOptions.find((option) => option.value === formData.categoryId) || null}
                onChange={(selected) =>
                  setFormData((prev) => ({ ...prev, categoryId: selected?.value || "" }))
                }
              />
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="originalPrice">Original price *</label>
              <input id="originalPrice" type="number" min="0" name="originalPrice" value={formData.originalPrice} onChange={handleChange} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="salePrice">Sale price *</label>
              <input id="salePrice" type="number" min="0" name="salePrice" value={formData.salePrice} onChange={handleChange} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Discount</label>
              <input type="text" value={discount === "" ? "" : `${discount}%`} readOnly className={`${inputClass} bg-gray-50 text-gray-500`} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="sku">SKU</label>
              <input id="sku" type="text" name="sku" value={formData.sku} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="stockQty">Stock quantity</label>
              <input id="stockQty" type="number" min="0" name="stockQty" value={formData.stockQty} onChange={handleChange} className={inputClass} />
              <span className="text-[11px] text-gray-400">
                {variants.length > 0 ? "Ignored — stock is tracked per option below." : "Zero marks the product out of stock."}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="lowStockThreshold">Low-stock alert at</label>
              <input id="lowStockThreshold" type="number" min="0" name="lowStockThreshold" value={formData.lowStockThreshold} onChange={handleChange} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="material">Material</label>
              <input id="material" type="text" name="material" value={formData.material} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="color">Colour</label>
              <input id="color" type="text" name="color" value={formData.color} onChange={handleChange} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="width">Width (cm)</label>
              <input id="width" type="number" min="0" name="width" value={formData.width} onChange={handleChange} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="height">Height (cm)</label>
              <input id="height" type="number" min="0" name="height" value={formData.height} onChange={handleChange} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="depth">Depth (cm)</label>
              <input id="depth" type="number" min="0" name="depth" value={formData.depth} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="weight">Weight (kg)</label>
              <input id="weight" type="number" min="0" name="weight" value={formData.weight} onChange={handleChange} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="shortDescription">Short description</label>
              <input id="shortDescription" type="text" name="shortDescription" maxLength={300} value={formData.shortDescription} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Full description</label>
            <Editor
              value={formData.description}
              onTextChange={(event) =>
                setFormData((prev) => ({ ...prev, description: event.htmlValue || "" }))
              }
              style={{ height: "220px" }}
            />
          </div>

          {/* Variants */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <p className={labelClass}>Options</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Add finishes or sizes that carry their own price and stock. Leave empty for a single-option product.
                </p>
              </div>
              <button
                type="button"
                onClick={addVariant}
                className="flex items-center gap-1.5 text-xs font-medium text-[#3b497e] border border-[#c3c9e3] rounded-lg px-3 py-2 hover:bg-[#f7f8fd] transition"
              >
                <FiPlus size={14} /> Add option
              </button>
            </div>

            {variants.map((variant, index) => (
              <div key={index} className="grid md:grid-cols-6 gap-3 items-end border border-[#eef0f8] rounded-xl p-3 bg-[#fbfcff]">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-gray-500">Label *</label>
                  <input value={variant.label} onChange={(e) => setVariant(index, { label: e.target.value })} className="border border-[#c3c9e3] rounded-lg px-2.5 py-2 text-sm outline-none focus:border-[#3b497e]" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-gray-500">Finish</label>
                  <input value={variant.color} onChange={(e) => setVariant(index, { color: e.target.value })} className="border border-[#c3c9e3] rounded-lg px-2.5 py-2 text-sm outline-none focus:border-[#3b497e]" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-gray-500">Size</label>
                  <input value={variant.size} onChange={(e) => setVariant(index, { size: e.target.value })} className="border border-[#c3c9e3] rounded-lg px-2.5 py-2 text-sm outline-none focus:border-[#3b497e]" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-gray-500">Sale price *</label>
                  <input type="number" min="0" value={variant.salePrice} onChange={(e) => setVariant(index, { salePrice: e.target.value })} className="border border-[#c3c9e3] rounded-lg px-2.5 py-2 text-sm outline-none focus:border-[#3b497e]" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-gray-500">Stock</label>
                  <input type="number" min="0" value={variant.stockQty} onChange={(e) => setVariant(index, { stockQty: e.target.value })} className="border border-[#c3c9e3] rounded-lg px-2.5 py-2 text-sm outline-none focus:border-[#3b497e]" />
                </div>
                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  aria-label={`Remove option ${variant.label || index + 1}`}
                  className="h-[38px] flex items-center justify-center gap-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
                >
                  <FiTrash2 size={14} /> Remove
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-6">
            {[
              ["bestSeller", "Bestseller"],
              ["newArrival", "New arrival"],
              ["featured", "Featured"],
              ["status", "Visible in store"],
            ].map(([name, label]) => (
              <label key={name} className="flex items-center gap-2 text-sm text-[#2a3460] cursor-pointer">
                <input
                  type="checkbox"
                  name={name}
                  checked={Boolean(formData[name])}
                  onChange={handleCheckbox}
                  className="w-4 h-4 accent-[#3b497e]"
                />
                {label}
              </label>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="thumbnail">
                Thumbnail {isEdit ? "(leave empty to keep the current one)" : "*"}
              </label>
              <input
                id="thumbnail"
                type="file"
                accept="image/*"
                onChange={(event) => setImage(event.target.files[0])}
                className={`${inputClass} text-[#3a3f5c]`}
              />
              {(image || product?.thumbnail) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image ? URL.createObjectURL(image) : product.thumbnail}
                  alt="Thumbnail preview"
                  className="w-28 h-28 object-cover rounded-xl border border-[#eef0f8] mt-1"
                />
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="gallery">Gallery images</label>
              <input
                id="gallery"
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => setGalleryFiles(Array.from(event.target.files).slice(0, 6))}
                className={`${inputClass} text-[#3a3f5c]`}
              />
              {gallery.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {gallery.map((url) => (
                    <div key={url} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-20 h-20 object-cover rounded-lg border border-[#eef0f8]" />
                      <button
                        type="button"
                        onClick={() => deleteGalleryImage(url)}
                        aria-label="Remove image"
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center hover:bg-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {galleryFiles.length > 0 && (
                <p className="text-[11px] text-gray-500">
                  {galleryFiles.length} new image{galleryFiles.length > 1 ? "s" : ""} will upload on save.
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-[#eef0f8]">
            <button
              type="submit"
              disabled={wait}
              className="bg-[#3b497e] text-white text-sm font-medium px-6 py-3 rounded-xl hover:bg-[#2f3b69] transition disabled:opacity-50"
            >
              {wait ? "Saving…" : isEdit ? "Save changes" : "Create product"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/products")}
              className="border border-[#c3c9e3] text-[#2a3460] text-sm font-medium px-6 py-3 rounded-xl hover:bg-[#f7f8fd] transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
