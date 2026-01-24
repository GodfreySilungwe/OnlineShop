import React, { useEffect, useState } from 'react'
import './components.css'

export default function Gallery() {
  const [images, setImages] = useState([])
  const [error, setError] = useState(null)
  const [selectedIndex, setSelectedIndex] = useState(null)

  useEffect(() => {
    fetch('/api/gallery')
      .then((r) => r.json())
      .then(setImages)
      .catch((e) => setError(String(e)))
  }, [])

  // Handle keyboard navigation
  useEffect(() => {
    if (selectedIndex === null) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedIndex(null)
      if (e.key === 'ArrowLeft') setSelectedIndex((prev) => (prev - 1 + images.length) % images.length)
      if (e.key === 'ArrowRight') setSelectedIndex((prev) => (prev + 1) % images.length)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedIndex, images.length])

  const openLightbox = (index) => setSelectedIndex(index)
  const closeLightbox = () => setSelectedIndex(null)
  const prevImage = () => setSelectedIndex((prev) => (prev - 1 + images.length) % images.length)
  const nextImage = () => setSelectedIndex((prev) => (prev + 1) % images.length)

  if (error) return <div>Error loading gallery: {error}</div>

  const currentImg = selectedIndex !== null ? images[selectedIndex] : null
  const currentUrl = currentImg ? `/api/images/${encodeURIComponent(currentImg)}` : ''

  return (
    <div>
      <h2>Gallery</h2>
      <div className="gallery-grid">
        {images.map((img, idx) => (
          <div key={img} className="gallery-item" onClick={() => openLightbox(idx)}>
            <img
              src={`/api/images/${encodeURIComponent(img)}`}
              alt={img}
              className="gallery-img"
            />
            <div className="gallery-meta">{img}</div>
            <div className="gallery-overlay">
              <span className="zoom-icon">🔍 View</span>
            </div>
          </div>
        ))}
        {images.length === 0 && <div>No images found.</div>}
      </div>

      {/* Lightbox Modal */}
      {selectedIndex !== null && (
        <div className="lightbox-backdrop" onClick={closeLightbox}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button onClick={closeLightbox} className="lightbox-close" title="Close (ESC)">
              ✕
            </button>

            {/* Main image */}
            <img src={currentUrl} alt={currentImg} className="lightbox-img" />

            {/* Previous button */}
            {images.length > 1 && (
              <button onClick={prevImage} className="lightbox-nav lightbox-prev" title="Previous (←)">‹</button>
            )}

            {/* Next button */}
            {images.length > 1 && (
              <button onClick={nextImage} className="lightbox-nav lightbox-next" title="Next (→)">›</button>
            )}

            {/* Image counter */}
            {images.length > 1 && <div className="lightbox-counter">{selectedIndex + 1} / {images.length}</div>}

            {/* Image filename */}
            <div className="lightbox-filename">{currentImg}</div>
          </div>
        </div>
      )}
    </div>
  )
}
