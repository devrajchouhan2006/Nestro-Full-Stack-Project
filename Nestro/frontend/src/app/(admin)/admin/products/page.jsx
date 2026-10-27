import Link from "next/link";
import ActionDropdown from "@/components/admin/ActionDropdown";
import Button from "@/components/admin/Button";
import StatusBtn from "@/components/admin/StatusBtn";
import FieldToggleBtn from "@/components/admin/FieldToggleBtn";
import { fetchProduct } from "@/utils/api";

export const dynamic = "force-dynamic";

const rupees = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

// Products with options carry their stock on each option, so the list has to
// total them rather than read the top-level count.
const totalStock = (product) =>
  product.variants?.length
    ? product.variants.reduce((sum, variant) => sum + (variant.stockQty || 0), 0)
    : (product.stockQty ?? 0);

export default async function AdminProductsPage() {
  const product = await fetchProduct({ limit: 60 });

  if (product.success === false) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-800 font-medium">Could not load products</p>
        <p className="text-sm text-gray-500 mt-1">
          Check that the API is running and that you are signed in as an admin.
        </p>
      </div>
    );
  }

  return (
    <>
      <Button path="/admin/products/add" name="Add product" />

      <div className="bg-white rounded-xl shadow p-5 overflow-x-auto">
        {product.data.length === 0 ? (
          <p className="text-sm text-gray-400 py-12 text-center">
            No products yet. Add your first one to open the store.
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-gray-600 text-sm">
                <th className="p-3 font-medium">S.No</th>
                <th className="p-3 font-medium">Product</th>
                <th className="p-3 font-medium">Price</th>
                <th className="p-3 font-medium">Stock</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Bestseller</th>
                <th className="p-3 font-medium">New</th>
                <th className="p-3 font-medium">Images</th>
                <th className="p-3 font-medium">Action</th>
              </tr>
            </thead>

            <tbody>
              {product.data.map((prod, index) => {
                const stock = totalStock(prod);
                const low = stock > 0 && stock <= (prod.lowStockThreshold ?? 3);
                return (
                  <tr key={prod._id} className="border-b hover:bg-gray-50 text-sm">
                    <td className="p-3 text-gray-400 tabular-nums">{index + 1}</td>

                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {prod.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={prod.thumbnail} alt="" width={44} height={44} className="w-11 h-11 rounded object-cover bg-gray-100 shrink-0" />
                        ) : (
                          <span className="w-11 h-11 rounded bg-gray-100 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <Link href={`/admin/products/edit/${prod._id}`} className="font-medium text-gray-800 hover:text-[#3b497e] line-clamp-1">
                            {prod.name}
                          </Link>
                          <p className="text-xs text-gray-400">
                            {prod.categoryId?.name || "—"}
                            {prod.variants?.length ? ` · ${prod.variants.length} options` : ""}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      <span className="font-medium text-gray-800 tabular-nums">{rupees(prod.salePrice)}</span>
                      {prod.discount > 0 && (
                        <span className="ml-1.5 text-xs text-green-600 tabular-nums">-{prod.discount}%</span>
                      )}
                    </td>

                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium tabular-nums whitespace-nowrap ${
                        stock === 0 ? "bg-red-50 text-red-600"
                          : low ? "bg-amber-50 text-amber-700"
                            : "bg-green-50 text-green-700"
                      }`}>
                        {stock === 0 ? "Out of stock" : `${stock} in stock`}
                      </span>
                    </td>

                    <td className="p-3">
                      <StatusBtn status={prod.status} path={`product/status-update/${prod._id}`} />
                    </td>

                    <td className="p-3">
                      <FieldToggleBtn
                        id={prod._id}
                        field="bestSeller"
                        value={prod.bestSeller}
                        path={`product/status/${prod._id}`}
                        activeLabel="Yes"
                        inactiveLabel="No"
                      />
                    </td>

                    <td className="p-3">
                      <FieldToggleBtn
                        id={prod._id}
                        field="newArrival"
                        value={prod.newArrival}
                        path={`product/status/${prod._id}`}
                        activeLabel="Yes"
                        inactiveLabel="No"
                      />
                    </td>

                    <td className="p-3">
                      <Link
                        href={`/admin/products/add-images/${prod._id}`}
                        className="text-xs text-[#3b497e] hover:underline whitespace-nowrap"
                      >
                        {prod.images?.length || 0} · add
                      </Link>
                    </td>

                    <td className="p-3">
                      <ActionDropdown id={prod._id} module="products" apiModule="product" viewPath={`/product/${prod._id}`} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
