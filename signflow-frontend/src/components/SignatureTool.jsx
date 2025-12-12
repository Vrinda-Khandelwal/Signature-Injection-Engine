import React, { useRef, useState, useEffect } from 'react'

export default function SignatureTool({ onSave }) {
  const canvasRef = useRef(null)
  const [mode, setMode] = useState('draw') // draw | type | upload
  const [isDown, setIsDown] = useState(false)
  const [text, setText] = useState('Your Name')
  const fileRef = useRef(null)

  useEffect(() => {
    const c = canvasRef.current
    if (c) {
      const ctx = c.getContext('2d')
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = 2.5
      ctx.strokeStyle = '#111'
    }
  }, [])

  const start = (e) => {
    if (mode !== 'draw') return
    setIsDown(true)
    const rect = canvasRef.current.getBoundingClientRect()
    const ctx = canvasRef.current.getContext('2d')
    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
  }
  const move = (e) => {
    if (!isDown || mode !== 'draw') return
    const rect = canvasRef.current.getBoundingClientRect()
    const ctx = canvasRef.current.getContext('2d')
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.stroke()
  }
  const end = () => { setIsDown(false) }

  const clear = () => {
    const c = canvasRef.current
    const ctx = c.getContext('2d')
    ctx.clearRect(0, 0, c.width, c.height)
  }

  const saveDraw = () => {
    const dataUrl = canvasRef.current.toDataURL('image/png')
    onSave(dataUrl)
  }

  const renderTyped = () => {
    const c = canvasRef.current
    const ctx = c.getContext('2d')
    ctx.clearRect(0, 0, c.width, c.height)
    ctx.font = 'bold 48px "Pacifico", cursive, sans-serif'
    ctx.fillStyle = '#111'
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.fillText(text, c.width / 2, c.height / 2)
  }

  useEffect(() => {
    if (mode === 'type') renderTyped()
  }, [mode, text])

  const onFile = (e) => {
    const f = e.target.files[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const c = canvasRef.current
        const ctx = c.getContext('2d')
        ctx.clearRect(0, 0, c.width, c.height)
        const ratio = Math.min(c.width / img.width, c.height / img.height)
        const w = img.width * ratio
        const h = img.height * ratio
        ctx.drawImage(img, (c.width - w) / 2, (c.height - h) / 2, w, h)
      }
      img.src = reader.result
    }
    reader.readAsDataURL(f)
  }

  const saveAll = () => {
    if (mode === 'type') renderTyped()
    const dataUrl = canvasRef.current.toDataURL('image/png')
    onSave(dataUrl)
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button className={`btn ${mode === 'draw' ? 'primary' : ''}`} onClick={() => setMode('draw')}>Draw</button>
        <button className={`btn ${mode === 'type' ? 'primary' : ''}`} onClick={() => setMode('type')}>Type</button>
        <button className={`btn ${mode === 'upload' ? 'primary' : ''}`} onClick={() => setMode('upload')}>Upload</button>
      </div>

      <div>
        <canvas ref={canvasRef} width={600} height={160} className="sig-canvas"
          onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end} />
      </div>

      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        {mode === 'type' && (
          <input value={text} onChange={e => setText(e.target.value)} style={{ padding: 8, flex: 1 }} />
        )}
        {mode === 'upload' && (
          <>
            <input type="file" accept="image/*" ref={fileRef} onChange={onFile} />
          </>
        )}
        <button className="btn" onClick={clear}>Clear</button>
        <button className="btn primary" onClick={saveAll}>Save Signature</button>
      </div>
    </div>
  )
}
