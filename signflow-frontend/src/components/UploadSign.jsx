// UploadSign.jsx  
import React from 'react'
import axios from 'axios'

const API_BASE = 'http://localhost:4000'

export default function UploadSign({ onUpload }) {
  const handleFile = async (e) => {
    const f = e.target.files[0]
    if (!f) return

    const form = new FormData()
    form.append('pdf', f)

    const res = await axios.post(`${API_BASE}/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    onUpload(res.data)
  }

  return (
    <div>
      <div className="uploader">
        <div className="upload-inner">
          <p className="upload-cta">Click or drop PDF to upload</p>
          <br></br>
          {/* FIXED BUTTON */}
          <label className="btn primary">
            Select PDF
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFile}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>
    </div>
  )
}
