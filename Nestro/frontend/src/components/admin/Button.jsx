import React from 'react'
import Link from 'next/link'
export default function Button({ path ,name}) {
    return (
        <div className="flex justify-end mb-4">
            <Link href={`${path}`}>
                <button
                    className="bg-[#3b497e] text-white px-5 py-2 rounded-xl flex items-center gap-2 hover:bg-[#2f3b69]"
                >
                    {name}
                </button>
            </Link>

        </div>
    )
}