import React, { forwardRef, useEffect, useRef } from 'react'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf'
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js'

const PDFViewer = forwardRef(({ pdfUrl, onPlace, signaturePreview }, ref) => {
  const containerRef = useRef()

  useEffect(() => {
    if (pdfUrl) loadPdf(pdfUrl)
    else if (containerRef.current) containerRef.current.innerHTML = ''
  }, [pdfUrl, signaturePreview])

  async function loadPdf(url) {
    const loadingTask = pdfjsLib.getDocument(url)
    const pdfDoc = await loadingTask.promise
    const container = containerRef.current
    container.innerHTML = ''

    // scale to render — keep this stable so conversion px->points is consistent
    const SCALE = 1.5

    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i)
      const viewport = page.getViewport({ scale: SCALE })

      // create wrapper
      const wrapper = document.createElement('div')
      wrapper.className = 'canvas-wrapper'

      // create canvas for page rendering
      const canvas = document.createElement('canvas')
      canvas.className = 'pdf-canvas'
      canvas.width = viewport.width
      canvas.height = viewport.height

      const ctx = canvas.getContext('2d')
      await page.render({ canvasContext: ctx, viewport }).promise

      // overlay to capture click (absolute, same size as canvas)
      const overlay = document.createElement('div')
      overlay.className = 'overlay-capture'
      overlay.style.left = '0px'
      overlay.style.top = '0px'
      overlay.style.width = canvas.width + 'px'
      overlay.style.height = canvas.height + 'px'
      overlay.style.position = 'absolute'
      overlay.style.cursor = 'crosshair'
      overlay.dataset.page = i
      overlay.dataset.scale = SCALE

      overlay.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect()
        const xPx = e.clientX - rect.left
        const yPx = e.clientY - rect.top

        // convert px -> PDF points: xPts = px / scale
        const scale = Number(overlay.dataset.scale)
        const xPts = xPx / scale
        const yPts = yPx / scale

        // signature default size in px on canvas (changeable)
        const sigWidthPx = 150
        const sigHeightPx = 50

        const sigWidthPts = sigWidthPx / scale
        const sigHeightPts = sigHeightPx / scale

        const place = {
          page: Number(overlay.dataset.page),
          x: xPts - sigWidthPts / 2,
          y: yPts - sigHeightPts / 2,
          width: sigWidthPts,
          height: sigHeightPts
        }

        if (typeof onPlace === 'function') onPlace(place)
      })

      // append canvas + overlay
      wrapper.style.position = 'relative'
      wrapper.appendChild(canvas)
      wrapper.appendChild(overlay)

      // optionally render signature preview on top of overlay (not persisted — for visual feedback)
      if (signaturePreview) {
        const img = document.createElement('img')
        img.src = signaturePreview
        img.style.position = 'absolute'
        img.style.left = '8px'
        img.style.top = '8px'
        img.style.width = '120px'
        img.style.opacity = '0.95'
        img.style.pointerEvents = 'none'
        wrapper.appendChild(img)
      }

      container.appendChild(wrapper)
    }
  }

  return (
    <div className="pdf-viewer card" style={{ marginTop: 16 }}>
      <h3>PDF Preview</h3>
      <div ref={containerRef} className="canvas-wrap"></div>
    </div>
  )
})

export default PDFViewer
