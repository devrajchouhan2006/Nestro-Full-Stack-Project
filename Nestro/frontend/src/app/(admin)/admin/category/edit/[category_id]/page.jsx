import { notFound } from "next/navigation";
import TaxonomyForm from "@/components/admin/TaxonomyForm";
import { fetchCategoryById } from "@/utils/api";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit category — Nestro Admin" };

export default async function EditCategoryPage({ params }) {
  const { category_id } = await params;
  const { data: category, success } = await fetchCategoryById(category_id);

  if (!success || !category?._id) notFound();

  return (
    <TaxonomyForm
      resource="category"
      listPath="/admin/category"
      heading="Category"
      record={category}
    />
  );
}
