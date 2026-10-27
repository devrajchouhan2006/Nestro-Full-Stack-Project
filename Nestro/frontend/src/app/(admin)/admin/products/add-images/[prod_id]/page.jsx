import { notFound } from "next/navigation";
import Link from "next/link";
import GalleryManager from "@/components/admin/GalleryManager";
import { fetchProductById } from "@/utils/api";

export const dynamic = "force-dynamic";
export const metadata = { title: "Product images — Nestro Admin" };

export default async function AddImagesPage({ params }) {
  const { prod_id } = await params;
  const { data: product, success } = await fetchProductById(prod_id);

  if (!success || !product) notFound();

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      <Link href="/admin/products" className="text-sm text-[#3b497e] hover:underline">
        ← All products
      </Link>

      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{product.name}</h1>
        <p className="text-sm text-slate-500 mt-1">
          The first image is the thumbnail shown on cards and in the cart.
        </p>
      </div>

      <GalleryManager
        productId={product._id}
        thumbnail={product.thumbnail}
        initialImages={product.images || []}
      />
    </div>
  );
}
