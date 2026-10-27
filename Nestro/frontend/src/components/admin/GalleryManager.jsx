'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { FiUpload, FiTrash2 } from 'react-icons/fi'
import { client } from '@/utils/helper'
import { removeProductImage } from '@/utils/api'

export default function GalleryManager({ productId, thumbnail, initialImages = [] }) {
  const router = useRouter()
  const [images, setImages] = useState(initialImages)
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (event) => {
    event.preventDefault()
    if (!files.length) return toast.error('Choose at least one image')

    setUploading(true)
    try {
      const body = new FormData()
      // Six is the multer ceiling on this route.
      files.slice(0, 6).forEach((file) => body.append('images', file))

      const response = await client.post(`product/add-images/${productId}`, body)
      if (!response.data.success) throw new Error(response.data.message)

      setImages(response.data.images)
      setFiles([])
      toast.success('Images added')
      router.refresh()
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async (url) => {
    if (!window.confirm('Remove this image from the product?')) return
    const data = await removeProductImage(productId, url)
    if (!data.success) return toast.error(data.message)
    setImages(data.images)
    toast.success('Image removed')
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleUpload} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700" htmlFor="gallery-files">
            Add images (up to 6 at a time)
          </label>
          <input
            id="gallery-files"
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => setFiles(Array.from(event.target.files))}
            className="w-full border-[1.5px] border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#3b497e] transition"
          />
        </div>

        {files.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {files.slice(0, 6).map((file) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={file.name}
                src={URL.createObjectURL(file)}
                alt=""
                className="w-20 h-20 object-cover rounded-lg border border-slate-200"
              />
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={uploading || files.length === 0}
          className="self-start bg-[#3b497e] text-white text-sm font-medium px-6 py-2.5 rounded-xl flex items-center gap-2 hover:bg-[#2f3b69] transition disabled:opacity-50"
        >
          <FiUpload size={15} />
          {uploading ? 'Uploading…' : `Upload ${files.length || ''}`.trim()}
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <p className="text-xs font-semibold text-slate-700 mb-3">
          Current gallery ({images.length})
        </p>

        {images.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">
            No gallery images yet. The product page will show the thumbnail alone.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {images.map((url) => (
              <div key={url} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full aspect-square object-cover rounded-lg border border-slate-200" />
                {url === thumbnail && (
                  <span className="absolute bottom-1 left-1 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded">
                    Thumbnail
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(url)}
                  aria-label="Remove image"
                  className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-white/90 text-red-600 flex items-center justify-center shadow-sm hover:bg-red-600 hover:text-white transition"
                >
                  <FiTrash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
