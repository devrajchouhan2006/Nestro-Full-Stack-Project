'use client'
import { client } from '@/utils/helper'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { toast } from 'sonner'


export default function StatusBtn({ status, path }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    function statusHandler() {
        if (loading) return
        setLoading(true)
        client.patch(path).then(
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

        <span onClick={statusHandler} className={`cursor-pointer px-3 py-1 rounded-full text-sm ${loading ? 'opacity-50 cursor-wait' : ''} ${status ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            {status ? 'Active' : 'Inactive'}
        </span>

    )
}