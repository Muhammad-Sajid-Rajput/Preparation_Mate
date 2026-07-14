const pdfParse = require('pdf-parse')

exports.extractText = async (buffer) => {
  const result = await pdfParse(buffer)
  if (!result.text?.trim())
    throw new Error('Could not extract text from PDF. The file may be image-only.')
  return { text: result.text, pageCount: result.numpages }
}
