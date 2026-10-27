import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import { fetchProductById } from "@/utils/api";

export const dynamic = "force-dynamic";

export const metadata = { title: "Edit product — Nestro Admin" };

export default async function EditProductPage({ params }) {
  const { prod_id } = await params;
  const { data: product, success } = await fetchProductById(prod_id);

  if (!success || !product) notFound();

  return <ProductForm product={product} />;
}
