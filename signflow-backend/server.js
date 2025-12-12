// server.js
const express = require('express')
const multer = require('multer')
const cors = require('cors')
const path = require('path')
const fs = require('fs-extra')
const { PDFDocument } = require('pdf-lib')

const app = express()
app.use(cors())
app.use(express.json({ limit: '200mb' }))

const UPLOAD_DIR = path.join(__dirname, 'uploads')
const SIGNED_DIR = path.join(__dirname, 'signed')
fs.ensureDirSync(UPLOAD_DIR)
fs.ensureDirSync(SIGNED_DIR)

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const name = Date.now() + '-' + file.originalname.replace(/\s+/g, '-')
    cb(null, name)
  }
})
const upload = multer({ storage })

// Upload endpoint: accepts a PDF file, returns { url, filename }
app.post('/upload', upload.single('pdf'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' })
  res.json({ url: `/uploads/${req.file.filename}`, filename: req.file.filename })
})

app.use('/uploads', express.static(UPLOAD_DIR))
app.use('/signed', express.static(SIGNED_DIR))

/*
  /sign endpoint expects JSON body:
  {
    filename: 'uploaded-file.pdf',
    signature: 'data:image/png;base64,...',
    page: 1,
    x: 100, y: 150, width: 200, height: 60
  }

  Query parameter:
    ?as=blob  -> returns application/pdf bytes directly (useful for preview)
    otherwise -> saves signed file and returns {url, filename}
*/
app.post('/sign', async (req, res) => {
  try {
    const { filename, signature, page = 1, x, y, width, height } = req.body
    if (!filename || !signature) return res.status(400).json({ error: 'Missing params' })

    const inPath = path.join(UPLOAD_DIR, filename)
    if (!fs.existsSync(inPath)) return res.status(404).json({ error: 'PDF not found' })

    const sigBase64 = signature.split(',')[1]
    const sigBytes = Buffer.from(sigBase64, 'base64')

    const existingPdfBytes = await fs.readFile(inPath)
    const pdfDoc = await PDFDocument.load(existingPdfBytes)

    const pngImage = await pdfDoc.embedPng(sigBytes)
    const pages = pdfDoc.getPages()
    const targetPageIndex = Math.max(0, Math.min(page - 1, pages.length - 1))
    const pdfPage = pages[targetPageIndex]

    const { width: pageWidth, height: pageHeight } = pdfPage.getSize()
    // Convert Y from top-origin (frontend) to bottom-origin (pdf-lib)
    const yFromBottom = pageHeight - y - height

    pdfPage.drawImage(pngImage, {
      x,
      y: yFromBottom,
      width,
      height
    })

    const signedPdfBytes = await pdfDoc.save()

    if (req.query.as === 'blob') {
      res.setHeader('Content-Type', 'application/pdf')
      return res.send(Buffer.from(signedPdfBytes))
    }

    const outName = `signed-${Date.now()}-${filename}`
    const outPath = path.join(SIGNED_DIR, outName)
    await fs.writeFile(outPath, signedPdfBytes)

    res.json({ url: `/signed/${outName}`, filename: outName })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error', details: err.message })
  }
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log('Backend running on port', PORT))
