import TaxonomyForm from "@/components/admin/TaxonomyForm";

export const metadata = { title: "Add category — Nestro Admin" };

export default function AddCategoryPage() {
  return <TaxonomyForm resource="category" listPath="/admin/category" heading="Category" />;
}
