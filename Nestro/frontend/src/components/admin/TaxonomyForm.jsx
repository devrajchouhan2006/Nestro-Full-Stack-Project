"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiSave, FiTag } from "react-icons/fi";
import { toast } from "sonner";
import { client, generateSlug } from "@/utils/helper";

const inputClass =
    "w-full border-[1.5px] border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#3b497e] transition";
const labelClass = "text-xs font-semibold text-slate-700";

/**
 * Shared by categories and room types, for both add and edit — the two
 * resources have identical shapes, and keeping one form means a fix to
 * validation or slug handling lands in all four screens at once.
 */
export default function TaxonomyForm({
    resource,          // "category" | "room"
    listPath,          // where to go after saving
    heading,           // "Category" | "Room type"
    record = null,     // present when editing
}) {
    const router = useRouter();
    const isEdit = Boolean(record);

    const [formData, setFormData] = useState({
        name: record?.name || "",
        slug: record?.slug || "",
        status: record?.status ?? true,
    });
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);

    function changeHandler(event) {
        const { name, value } = event.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
            // An existing slug is left alone: changing it would break links
            // that already point at this collection.
            slug: name === "name" && !isEdit ? generateSlug(value) : prev.slug,
        }));
    }

    async function submitHandler(event) {
        event.preventDefault();

        const name = formData.name.trim();
        if (name.length < 3 || name.length > 20) {
            return toast.error("The name must be between 3 and 20 characters");
        }
        if (!isEdit && !formData.slug.trim()) {
            return toast.error("A slug is required");
        }

        setLoading(true);
        try {
            const body = new FormData();
            body.append("name", name);
            body.append("slug", formData.slug.trim());
            body.append("status", String(Boolean(formData.status)));
            if (image) body.append("image", image);

            const response = isEdit
                ? await client.put(`${resource}/edit/${record._id}`, body)
                : await client.post(`${resource}/create`, body);

            if (response.data.success) {
                toast.success(response.data.message);
                router.push(listPath);
                router.refresh();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Internal server error");
        } finally {
            setLoading(false);
        }
    }

    const preview = image ? URL.createObjectURL(image) : record?.image;

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-8">
            <div className="max-w-3xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        {isEdit ? `Edit ${heading.toLowerCase()}` : `Add ${heading.toLowerCase()}`}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {isEdit
                            ? "Changes go live on the storefront immediately."
                            : `A ${heading.toLowerCase()} groups products in the store filters.`}
                    </p>
                </div>

                <form
                    onSubmit={submitHandler}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                >
                    <div className="bg-[#3b497e] px-5 py-4 flex items-center gap-2 text-white">
                        <FiTag size={18} />
                        <h2 className="text-[15px] font-semibold">{heading} details</h2>
                    </div>

                    <div className="p-5 space-y-5">
                        <div className="flex flex-col gap-1.5">
                            <label className={labelClass} htmlFor="name">Name *</label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                value={formData.name}
                                onChange={changeHandler}
                                maxLength={20}
                                className={inputClass}
                            />
                            <span className="text-[11px] text-slate-400">3–20 characters.</span>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className={labelClass} htmlFor="slug">Slug</label>
                            <input
                                id="slug"
                                name="slug"
                                type="text"
                                value={formData.slug}
                                onChange={changeHandler}
                                readOnly={!isEdit}
                                className={`${inputClass} ${!isEdit ? "bg-slate-50 text-slate-500" : ""}`}
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className={labelClass} htmlFor="image">
                                Image {isEdit ? "(leave empty to keep the current one)" : ""}
                            </label>
                            <input
                                id="image"
                                type="file"
                                accept="image/*"
                                onChange={(event) => setImage(event.target.files[0])}
                                className={inputClass}
                            />
                            {preview && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={preview}
                                    alt="Preview"
                                    className="w-28 h-28 object-cover rounded-xl border border-slate-200 mt-1"
                                />
                            )}
                        </div>

                        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={Boolean(formData.status)}
                                onChange={(event) =>
                                    setFormData((prev) => ({ ...prev, status: event.target.checked }))
                                }
                                className="w-4 h-4 accent-[#3b497e]"
                            />
                            Visible in the store
                        </label>
                    </div>

                    <div className="px-5 py-4 border-t border-slate-100 flex gap-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-[#3b497e] text-white text-sm font-medium px-6 py-2.5 rounded-xl flex items-center gap-2 hover:bg-[#2f3b69] transition disabled:opacity-50"
                        >
                            <FiSave size={15} />
                            {loading ? "Saving…" : isEdit ? "Save changes" : `Create ${heading.toLowerCase()}`}
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push(listPath)}
                            className="border border-slate-200 text-slate-700 text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-slate-50 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
