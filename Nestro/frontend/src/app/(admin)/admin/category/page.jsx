import ActionDropdown from "@/components/admin/ActionDropdown"
import Button from "@/components/admin/Button";
import StatusBtn from "@/components/admin/StatusBtn";
import { fetchCategory } from "@/utils/api"

// Live catalogue data: stock, prices and admin sessions all change between
// deploys, so these pages render per request rather than at build time.
export const dynamic = 'force-dynamic'


export default async function AdminTable() {
    const category = await fetchCategory();
    if (category.success === false) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <p className="text-gray-800 font-medium">Could not load categories</p>
                <p className="text-sm text-gray-500 mt-1">
                    Check that the API is running and that you are signed in as an admin.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Categories</h2>
                <Button path="/admin/category/add" name="Add Category" />
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 ">
                <div>
                    <table className="w-full text-left border-collapse">
                        
                        <thead className="bg-gray-50/50">
                            <tr className="border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                                <th className="px-6 py-4 whitespace-nowrap">S.No</th>
                                <th className="px-6 py-4 whitespace-nowrap">Name</th>
                                <th className="px-6 py-4 whitespace-nowrap">Slug</th>
                                <th className="px-6 py-4 whitespace-nowrap">Thumbnail</th>
                                <th className="px-6 py-4 whitespace-nowrap">Status</th>
                                <th className="px-6 py-4 whitespace-nowrap">Action</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100 text-sm">
                            {
                                category.data.map((cat, index) => (
                                    <tr 
                                        key={cat._id} 
                                        className="hover:bg-gray-50/80 transition-colors duration-200 group"
                                    >
                                        <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                                            {index + 1}
                                        </td>

                                        <td className="px-6 py-4 font-semibold text-gray-800 whitespace-nowrap">
                                            {cat.name}
                                        </td>

                                        <td className="px-6 py-4 text-gray-500 font-mono text-xs whitespace-nowrap">
                                            {cat.slug}
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="h-12 w-12 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 shadow-sm group-hover:shadow transition-shadow duration-200">
                                                {cat.image ? (
                                                    <img src={cat.image} className="h-full w-full object-cover" alt={cat.name || "Category thumbnail"} />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">No img</div>
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusBtn status={cat.status} path={`category/status-update/${cat._id}`} />
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <ActionDropdown module="category" apiModule="category" id={cat._id} />
                                        </td>
                                    </tr>
                                ))
                            }
                        </tbody>
                        
                    </table>
                </div>
            </div>
        </div>
    )
}