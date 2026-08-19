"use client"

import { useEffect, useState } from 'react'
import { getDownloadURL, listAll, ref, type StorageReference } from 'firebase/storage'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { storage } from '@/lib/firebase'

type GalleryImage = {
  name: string
  url: string
}

const placeholderStyles = [
  { icon: '📸', background: 'linear-gradient(135deg, rgba(122,63,228,0.3), rgba(232,69,184,0.2))' },
  { icon: '🎉', background: 'linear-gradient(135deg, rgba(232,194,106,0.2), rgba(122,63,228,0.2))' },
  { icon: '🏆', background: 'linear-gradient(135deg, rgba(232,69,184,0.2), rgba(122,63,228,0.3))' },
]

async function getGalleryImages(folder: StorageReference): Promise<GalleryImage[]> {
  const result = await listAll(folder)
  const files = await Promise.all(
    result.items.map(async (item) => ({
      name: item.name,
      url: await getDownloadURL(item),
    })),
  )
  const nestedFiles = await Promise.all(result.prefixes.map(getGalleryImages))

  return [...files, ...nestedFiles.flat()]
}

async function preloadImages(images: GalleryImage[]) {
  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          const preload = new Image()
          preload.onload = () => resolve()
          preload.onerror = () => resolve()
          preload.src = image.url
        }),
    ),
  )
}

export default function Gallery() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadGallery() {
      try {
        // Upload photos to gallery/ in the configured idea-matcher Storage bucket.
        const galleryImages = await getGalleryImages(ref(storage, 'gallery'))
        await preloadImages(galleryImages)
        if (active) setImages(galleryImages)
      } catch (error) {
        console.error('Unable to load gallery images from Firebase Storage:', error)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadGallery()
    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return (
      <main className="gallery-loading" aria-label="Loading gallery" aria-live="polite">
        <div className="gallery-loading-spinner" aria-hidden="true" />
        <p>Loading gallery...</p>
      </main>
    )
  }

  return (
    <>
      <div className="cosmic-bg" />
      <div className="cosmic-vignette" />
      <Navbar />

      <div className="page-wrap">
        <section className="gallery-hero">
          <h1 className="hero-title" data-text="Gallery">Gallery</h1>
          <p className="hero-tagline">Cosmic moments and memories</p>
        </section>

        <section className="section">
          {images.length > 0 ? (
            <div className="gallery-grid">
              {images.map((image) => (
                <div key={image.url} className="gallery-item">
                  <img
                    src={image.url}
                    alt={image.name.replace(/[-_]/g, ' ').replace(/\.[^.]+$/, '')}
                    style={{ width: '100%', height: '280px', objectFit: 'cover', borderRadius: '1rem' }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="gallery-grid">
              {placeholderStyles.map((placeholder) => (
                <div key={placeholder.icon} className="gallery-item">
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '280px',
                      background: placeholder.background,
                      borderRadius: '1rem',
                      fontSize: '3rem',
                    }}
                  >
                    {placeholder.icon}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && images.length === 0 && (
            <div style={{ marginTop: '80px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-dim)', fontSize: '1rem' }}>
                Gallery coming soon! Stay tuned for epic moments from URJA 2026.
              </p>
            </div>
          )}
        </section>
      </div>

      <Footer />
    </>
  )
}
