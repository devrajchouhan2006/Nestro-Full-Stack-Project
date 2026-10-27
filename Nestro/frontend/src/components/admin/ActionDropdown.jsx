"use client"

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MdMoreVert, MdEdit, MdDelete, MdVisibility } from "react-icons/md"
import { toast } from 'sonner'
import { client } from '@/utils/helper'

export default function ActionDropdown({ id, module, apiModule, viewPath }) {
    const [open, setOpen] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const wrapRef = useRef(null)
    const router = useRouter()
    const api = apiModule || module

    // Without this the menu stays open behind whatever the admin clicks next.
    useEffect(() => {
        if (!open) return
        const onDocClick = (event) => {
            if (!wrapRef.current?.contains(event.target)) setOpen(false)
        }
        const onEsc = (event) => { if (event.key === 'Escape') setOpen(false) }
        document.addEventListener('mousedown', onDocClick)
        document.addEventListener('keydown', onEsc)
        return () => {
            document.removeEventListener('mousedown', onDocClick)
            document.removeEventListener('keydown', onEsc)
        }
    }, [open])

    function deleteHandler() {
        if (deleting) return
        // Deleting a product also drops its reviews, so confirm first.
        if (!window.confirm('Delete this permanently? This cannot be undone.')) return

        setDeleting(true)
        client.delete(`${api}/delete/${id}`)
            .then((response) => {
                if (response.data.success) {
                    toast.success(response.data.message)
                    setOpen(false)
                    router.refresh()
                }
            })
            .catch((error) => {
                toast.error(error?.response?.data?.message || error?.message || 'Internal server error')
            })
            .finally(() => setDeleting(false))
    }

    return (
        <div className="relative" ref={wrapRef}>
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label="Actions"
                className="p-2 rounded-lg hover:bg-gray-100"
            >
                <MdMoreVert size={22} />
            </button>

            {open && (
                <div role="menu" className="absolute right-0 top-10 w-36 bg-white shadow-xl rounded-lg z-20 p-2 border border-gray-100">
                    {viewPath && (
                        <Link href={viewPath} target="_blank" onClick={() => setOpen(false)}>
                            <span className="flex gap-2 items-center w-full p-2 hover:bg-gray-100 rounded text-sm cursor-pointer">
                                <MdVisibility /> View
                            </span>
                        </Link>
                    )}

                    <Link href={`/admin/${module}/edit/${id}`} onClick={() => setOpen(false)}>
                        <span className="flex gap-2 items-center w-full p-2 hover:bg-gray-100 rounded text-sm cursor-pointer">
                            <MdEdit /> Edit
                        </span>
                    </Link>

                    <button
                        type="button"
                        onClick={deleteHandler}
                        disabled={deleting}
                        className="flex gap-2 items-center w-full p-2 hover:bg-red-50 text-red-600 rounded text-sm disabled:opacity-50"
                    >
                        <MdDelete /> {deleting ? 'Deleting…' : 'Delete'}
                    </button>
                </div>
            )}
        </div>
    )
}
