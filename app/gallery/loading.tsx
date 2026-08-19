export default function GalleryLoading() {
  return (
    <main className="gallery-loading" aria-label="Loading gallery" aria-live="polite">
      <div className="gallery-loading-spinner" aria-hidden="true" />
      <p>Loading gallery...</p>
    </main>
  )
}
