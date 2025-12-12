import React, { useState, useRef } from 'react'
import UploadSign from './components/UploadSign'
import SignatureTool from './components/SignatureTool'
import PDFViewer from './components/PDFViewer'
import axios from 'axios'

const API_BASE = 'http://localhost:4000'

export default function App() {
  const [uploaded, setUploaded] = useState(null) // { url, filename }
  const [signatureDataUrl, setSignatureDataUrl] = useState(null) // png data url
  const [placement, setPlacement] = useState(null) // { page, x, y, width, height } in PDF points
  const [signedPreviewUrl, setSignedPreviewUrl] = useState(null) // blob url for preview
  const [signedBlob, setSignedBlob] = useState(null) // store blob for download
  const viewerRef = useRef()

  const handleUpload = (info) => setUploaded(info)

  const handleSignatureSave = (dataUrl) => {
    setSignatureDataUrl(dataUrl)
    alert('Signature saved. Click on the PDF preview to place it.')
  }

  const handlePlace = (place) => {
    setPlacement(place)
  }

  // Request signed PDF as blob preview, and also store blob for download
  const handleSignAndPreview = async () => {
    if (!uploaded) return alert('Upload a PDF first.')
    if (!signatureDataUrl) return alert('Create or upload a signature first.')
    if (!placement) return alert('Place signature on the PDF first.')

    try {
      const payload = {
        filename: uploaded.filename,
        signature: signatureDataUrl,
        page: placement.page,
        x: placement.x,
        y: placement.y,
        width: placement.width,
        height: placement.height
      }

      const res = await axios.post(`${API_BASE}/sign?as=blob`, payload, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      setSignedBlob(blob)
      setSignedPreviewUrl(url)
      // open preview in modal or iframe (we show below)
    } catch (err) {
      console.error(err)
      alert('Error signing PDF: ' + (err.response?.data?.error || err.message))
    }
  }

  const handleDownloadPreview = () => {
    if (!signedBlob) return alert('No signed PDF to download — preview first.')
    const a = document.createElement('a')
    a.href = signedPreviewUrl
    a.download = `signed-${uploaded?.filename ?? 'document'}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  return (
    <div className="app-root">
      <header className="hero">
        <h1 className="title">Signature Injection Engine</h1>
        <p className="subtitle">Upload. Sign. Download. Simple, fast, and accurate.</p>
      </header>

      <main className="container">
        <div className="grid">
          <section className="card large">
            <h2>1. Upload PDF Document</h2>
            <UploadSign onUpload={handleUpload} />
            {uploaded && <div style={{ marginTop: 12 }}>Uploaded: {uploaded.filename}</div>}
          </section>

          <section className="card large">
            <h2>2. Create Signature</h2>
            <SignatureTool onSave={handleSignatureSave} />
          </section>
        </div>

        <section className="card wide" style={{ marginTop: 20 }}>
          <h2>3. Place Signature & Preview / Download</h2>

          {uploaded ? (
            <PDFViewer
              ref={viewerRef}
              pdfUrl={`http://localhost:4000${uploaded.url}`}
              onPlace={handlePlace}
              signaturePreview={signatureDataUrl}
            />
          ) : (
            <div className="placeholder">Upload a PDF to preview and place signature</div>
          )}

          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button className="btn primary" onClick={handleSignAndPreview}>Preview Signed PDF</button>
            <button className="btn" onClick={handleDownloadPreview}>Download Signed PDF</button>
          </div>

          {placement && (
            <div style={{ marginTop: 8 }}>
              Placed: page {placement.page}, x={Math.round(placement.x)}, y={Math.round(placement.y)}
            </div>
          )}
        </section>

        {signedPreviewUrl && (
          <section className="card wide" style={{ marginTop: 20 }}>
            <h2>Signed PDF Preview</h2>
            <iframe src={signedPreviewUrl} title="Signed Preview" style={{ width: '100%', height: '700px', border: '1px solid #e6eef8' }} />
          </section>
        )}
      </main>
    </div>
  )
}
