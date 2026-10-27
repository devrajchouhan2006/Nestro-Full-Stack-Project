'use client'
import { client } from '@/utils/helper'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

export default function FieldToggleBtn({ id, field, value, path, activeLabel, inactiveLabel }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    function toggleHandler() {
        if (loading) return
        setLoading(true)
        client.patch(path, { field }).then(
            (response) => {
                if (response.data.success) {
                    toast.success(response.data.message)
                    router.refresh()
                }
            }
        ).catch(
            (error) => {
                const msg = error?.response?.data?.message || error?.message || 'Internal server error'
                toast.error(msg)
            }
        ).finally(() => {
            setLoading(false)
        })
    }

    return (
        <span
            onClick={toggleHandler}
            className={`cursor-pointer px-3 py-1 rounded-full text-sm ${loading ? 'opacity-50 cursor-wait' : ''} ${value ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}
        >
            {value ? activeLabel : inactiveLabel}
        </span>
    )
}
