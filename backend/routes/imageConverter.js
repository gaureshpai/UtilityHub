const PDFDocument = require('pdfkit');
const router = require('express').Router();
const multer = require('multer');
const archiver = require('archiver');
const sharp = require('sharp');
const path = require('path');
const os = require('os');
const fsp = require('fs').promises;
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const upload = multer({ storage: multer.memoryStorage() });

// @route   POST /api/convert/png-to-jpg
// @desc    Convert PNG images to JPG
// @access  Public
router.post('/png-to-jpg', upload.array('images'), async (req, res) => {
  try {
    const { files } = req;
    if (!files || files.length === 0) {
      return res.status(400).json({ msg: 'No image files uploaded.' });
    }

    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    const archiveBuffer = await new Promise((resolve, reject) => {
      const buffers = [];
      archive.on('data', (data) => buffers.push(data));
      archive.on('end', () => resolve(Buffer.concat(buffers)));
      archive.on('error', (err) => reject(err));

      const conversionPromises = files.map(async (file) => {
        const imageBuffer = file.buffer;
        const { originalname } = file;
        const nameWithoutExt = originalname.split('.').slice(0, -1).join('.');

        const jpgBuffer = await sharp(imageBuffer).jpeg().toBuffer();

        archive.append(jpgBuffer, { name: `${nameWithoutExt}_converted.jpg` });
      });

      Promise.all(conversionPromises)
        .then(() => archive.finalize())
        .catch((err) => reject(err));
    });

    const zipFileName = `converted_png_to_jpg_${Date.now()}.zip`;
    const { error: uploadError } = await supabase.storage
      .from('utilityhub')
      .upload(zipFileName, archiveBuffer, {
        contentType: 'application/zip',
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage
      .from('utilityhub')
      .getPublicUrl(zipFileName);

    return res.json({ path: publicUrlData.publicUrl, originalname: zipFileName });
  } catch (err) {
    console.error(err);
    console.error(JSON.stringify(err, Object.getOwnPropertyNames(err)));
    return res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET /api/convert/download-image/:filename
// @desc    Download a converted image
// @access  Public
router.get('/download-image/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const { data, error } = await supabase.storage.from('utilityhub').download(filename);

    if (error) {
      throw error;
    }

    res.set('Content-Type', data.type);
    res.set('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST /api/convert/image-to-pdf
// @desc    Convert images to PDF
// @access  Public
router.post('/image-to-pdf', upload.array('images'), async (req, res) => {
  try {
    const { files } = req;
    if (!files || files.length === 0) {
      return res.status(400).json({ msg: 'No image files uploaded.' });
    }

    const pdfDoc = new PDFDocument({
      autoFirstPage: false,
    });

    const buffers = [];
    pdfDoc.on('data', buffers.push.bind(buffers));
    const pdfGenerationPromise = new Promise((resolve, reject) => {
      pdfDoc.on('end', () => resolve(Buffer.concat(buffers)));
      pdfDoc.on('error', reject);
    });

    const imageProcessingPromises = files.map((file) => new Promise((resolve, reject) => {
      (async () => {
        let tempImagePath = '';
        try {
          const imageBuffer = file.buffer;

          const image = sharp(imageBuffer);
          const metadata = await image.metadata();
          const pngBuffer = await image.png().toBuffer();

          tempImagePath = path.join(os.tmpdir(), `temp_image_${Date.now()}.png`);
          await fsp.writeFile(tempImagePath, pngBuffer);

          const A4_WIDTH = 595.28;
          const A4_HEIGHT = 841.89;

          const imgWidth = metadata.width;
          const imgHeight = metadata.height;

          const scaleX = A4_WIDTH / imgWidth;
          const scaleY = A4_HEIGHT / imgHeight;
          const scale = Math.min(scaleX, scaleY);

          const finalWidth = imgWidth * scale;
          const finalHeight = imgHeight * scale;

          const x = (A4_WIDTH - finalWidth) / 2;
          const y = (A4_HEIGHT - finalHeight) / 2;

          pdfDoc.addPage({ size: 'A4' });
          pdfDoc.image(tempImagePath, x, y, { width: finalWidth, height: finalHeight });
          resolve();
        } catch (imageErr) {
          console.error(`Error processing image ${file.originalname}:`, imageErr);
          pdfDoc.end();
          reject(new Error(`Failed to process image ${file.originalname}: ${imageErr.message}`));
        } finally {
          if (tempImagePath) {
            try {
              await fsp.unlink(tempImagePath);
            } catch (unlinkErr) {
              console.error(`Error deleting temp image file ${tempImagePath}:`, unlinkErr);
            }
          }
        }
      })();
    }));

    await Promise.all(imageProcessingPromises);

    pdfDoc.end();
    const pdfBuffer = await pdfGenerationPromise;

    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    const archiveBuffer = await new Promise((resolve, reject) => {
      const archiveBuffers = [];
      archive.on('data', (data) => archiveBuffers.push(data));
      archive.on('end', () => resolve(Buffer.concat(archiveBuffers)));
      archive.on('error', (err) => reject(err));

      archive.append(pdfBuffer, { name: `converted_images_${Date.now()}.pdf` });
      archive.finalize();
    });

    const zipFileName = `converted_images_${Date.now()}.zip`;
    const { error: uploadError } = await supabase.storage
      .from('utilityhub')
      .upload(zipFileName, archiveBuffer, {
        contentType: 'application/zip',
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage
      .from('utilityhub')
      .getPublicUrl(zipFileName);

    return res.json({ path: publicUrlData.publicUrl, originalname: zipFileName });
  } catch (err) {
    console.error(err);
    console.error(JSON.stringify(err, Object.getOwnPropertyNames(err)));
    return res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST /api/convert/resize-image
// @desc    Resize images
// @access  Public
router.post('/resize-image', upload.array('images'), async (req, res) => {
  try {
    const { files } = req;
    if (!files || files.length === 0) {
      return res.status(400).json({ msg: 'No image files uploaded.' });
    }

    const { width, height } = req.body;
    const parsedWidth = parseInt(width, 10);
    const parsedHeight = parseInt(height, 10);

    if (Number.isNaN(parsedWidth) || parsedWidth <= 0
      || Number.isNaN(parsedHeight) || parsedHeight <= 0) {
      return res.status(400).json({ msg: 'Invalid width or height provided. Must be positive numbers.' });
    }

    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    const archiveBuffer = await new Promise((resolve, reject) => {
      const buffers = [];
      archive.on('data', (data) => buffers.push(data));
      archive.on('end', () => resolve(Buffer.concat(buffers)));
      archive.on('error', (err) => reject(err));

      const resizePromises = files.map(async (file) => {
        const imageBuffer = file.buffer;
        const { originalname } = file;
        const nameWithoutExt = originalname.split('.').slice(0, -1).join('.');

        const resizedBuffer = await sharp(imageBuffer)
          .resize(parsedWidth, parsedHeight)
          .jpeg()
          .toBuffer();

        archive.append(resizedBuffer, { name: `${nameWithoutExt}_resized.jpg` });
      });

      Promise.all(resizePromises)
        .then(() => archive.finalize())
        .catch((err) => reject(err));
    });

    const zipFileName = `resized_images_${Date.now()}.zip`;
    const { error: uploadError } = await supabase.storage
      .from('utilityhub')
      .upload(zipFileName, archiveBuffer, {
        contentType: 'application/zip',
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage
      .from('utilityhub')
      .getPublicUrl(zipFileName);

    return res.json({ path: publicUrlData.publicUrl, originalname: zipFileName });
  } catch (err) {
    console.error(err);
    console.error(JSON.stringify(err, Object.getOwnPropertyNames(err)));
    return res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST /api/convert/compress-image
// @desc    Compress images
// @access  Public
router.post('/compress-image', upload.array('images'), async (req, res) => {
  try {
    const { files } = req;
    if (!files || files.length === 0) {
      return res.status(400).json({ msg: 'No image files uploaded for compression.' });
    }

    const { quality } = req.body;
    const parsedQuality = parseInt(quality, 10);

    if (Number.isNaN(parsedQuality) || parsedQuality < 0 || parsedQuality > 100) {
      return res.status(400).json({ msg: 'Invalid quality provided. Must be a number between 0 and 100.' });
    }

    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    const archiveBuffer = await new Promise((resolve, reject) => {
      const buffers = [];
      archive.on('data', (data) => buffers.push(data));
      archive.on('end', () => resolve(Buffer.concat(buffers)));
      archive.on('error', (err) => reject(err));

      const compressionPromises = files.map(async (file) => {
        const imageBuffer = file.buffer;
        const { originalname } = file;
        const nameWithoutExt = originalname.split('.').slice(0, -1).join('.');

        const compressedBuffer = await sharp(imageBuffer)
          .jpeg({ quality: parsedQuality })
          .toBuffer();

        archive.append(compressedBuffer, { name: `${nameWithoutExt}_compressed.jpg` });
      });

      Promise.all(compressionPromises)
        .then(() => archive.finalize())
        .catch((err) => reject(err));
    });

    const zipFileName = `compressed_images_${Date.now()}.zip`;
    const { error: uploadError } = await supabase.storage
      .from('utilityhub')
      .upload(zipFileName, archiveBuffer, {
        contentType: 'application/zip',
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage
      .from('utilityhub')
      .getPublicUrl(zipFileName);

    return res.json({ path: publicUrlData.publicUrl, originalname: zipFileName });
  } catch (err) {
    console.error(err);
    console.error(JSON.stringify(err, Object.getOwnPropertyNames(err)));
    return res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST /api/convert/convert-image-format
// @desc    Convert image format
// @access  Public
router.post('/convert-image-format', upload.array('images'), async (req, res) => {
  try {
    const { files } = req;
    if (!files || files.length === 0) {
      return res.status(400).json({ msg: 'No image files uploaded.' });
    }

    const { format } = req.body;
    const allowedFormats = ['jpeg', 'png', 'webp', 'tiff', 'gif', 'avif']; // Add more if sharp supports them and they are desired
    if (!format || !allowedFormats.includes(format.toLowerCase())) {
      return res.status(400).json({ msg: `Invalid format provided. Allowed formats are: ${allowedFormats.join(', ')}` });
    }

    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    const archiveBuffer = await new Promise((resolve, reject) => {
      const buffers = [];
      archive.on('data', (data) => buffers.push(data));
      archive.on('end', () => resolve(Buffer.concat(buffers)));
      archive.on('error', (err) => reject(err));

      const conversionPromises = files.map(async (file) => {
        const imageBuffer = file.buffer;
        const { originalname } = file;
        const nameWithoutExt = originalname.split('.').slice(0, -1).join('.');

        const convertedBuffer = await sharp(imageBuffer)
          .toFormat(format)
          .toBuffer();

        archive.append(convertedBuffer, { name: `${nameWithoutExt}_converted.${format}` });
      });

      Promise.all(conversionPromises)
        .then(() => archive.finalize())
        .catch((err) => reject(err));
    });

    const zipFileName = `converted_images_${Date.now()}.zip`;
    const { error: uploadError } = await supabase.storage
      .from('utilityhub')
      .upload(zipFileName, archiveBuffer, {
        contentType: 'application/zip',
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage
      .from('utilityhub')
      .getPublicUrl(zipFileName);

    return res.json({ path: publicUrlData.publicUrl, originalname: zipFileName });
  } catch (err) {
    console.error(err);
    console.error(JSON.stringify(err, Object.getOwnPropertyNames(err)));
    return res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST /api/convert/base64-image
// @desc    Encode/Decode image to/from Base64
// @access  Public
router.post('/base64-image', upload.single('image'), async (req, res) => {
  try {
    const { type, base64String } = req.body;

    if (type === 'encode') {
      if (!req.file) {
        return res.status(400).json({ msg: 'No image file uploaded for encoding.' });
      }
      const imageBuffer = req.file.buffer;
      const base64 = imageBuffer.toString('base64');
      return res.json({ base64 });
    }

    if (type === 'decode') {
      if (!base64String) {
        return res.status(400).json({ msg: 'No base64 string provided for decoding.' });
      }
      const buffer = Buffer.from(base64String, 'base64');
      const outputFileName = `decoded-${Date.now()}.png`;

      const archive = archiver('zip', {
        zlib: { level: 9 },
      });

      const archiveBuffer = await new Promise((resolve, reject) => {
        const buffers = [];
        archive.on('data', (data) => buffers.push(data));
        archive.on('end', () => resolve(Buffer.concat(buffers)));
        archive.on('error', (err) => reject(err));

        archive.append(buffer, { name: outputFileName });
        archive.finalize();
      });

      const zipFileName = `decoded_image_${Date.now()}.zip`;
      const { error: uploadError } = await supabase.storage
        .from('utilityhub')
        .upload(zipFileName, archiveBuffer, {
          contentType: 'application/zip',
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('utilityhub')
        .getPublicUrl(zipFileName);

      return res.json({ path: publicUrlData.publicUrl, originalname: zipFileName });
    }
    return res.status(400).json({ msg: 'Invalid request type. Must be "encode" or "decode".' });
  } catch (err) {
    console.error(err);
    console.error(JSON.stringify(err, Object.getOwnPropertyNames(err)));
    return res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST /api/convert/image-flip
// @desc    Flip an image horizontally or vertically
// @access  Public
router.post('/image-flip', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No image file uploaded.' });
    }

    const imageBuffer = req.file.buffer;
    const { originalname } = req.file;
    const { direction } = req.body;

    let flippedBuffer;
    if (direction === 'horizontal') {
      flippedBuffer = await sharp(imageBuffer).flop().jpeg().toBuffer();
    } else if (direction === 'vertical') {
      flippedBuffer = await sharp(imageBuffer).flip().jpeg().toBuffer();
    } else {
      return res.status(400).json({ msg: "Invalid flip direction. Must be 'horizontal' or 'vertical'." });
    }

    const nameWithoutExt = originalname.split('.').slice(0, -1).join('.');
    const outputFileName = `flipped-${nameWithoutExt}.jpg`;

    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    const archiveBuffer = await new Promise((resolve, reject) => {
      const buffers = [];
      archive.on('data', (data) => buffers.push(data));
      archive.on('end', () => resolve(Buffer.concat(buffers)));
      archive.on('error', (err) => reject(err));

      archive.append(flippedBuffer, { name: outputFileName });
      archive.finalize();
    });

    const zipFileName = `flipped_image_${Date.now()}.zip`;
    const { error: uploadError } = await supabase.storage
      .from('utilityhub')
      .upload(zipFileName, archiveBuffer, {
        contentType: 'application/zip',
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage
      .from('utilityhub')
      .getPublicUrl(zipFileName);

    return res.json({ path: publicUrlData.publicUrl, originalname: zipFileName });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST /api/convert/image-to-base64
// @desc    Convert image to Base64 string
// @access  Public
router.post('/image-to-base64', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No image file uploaded.' });
    }

    const imageBuffer = req.file.buffer;
    const base64 = imageBuffer.toString('base64');
    return res.json({ base64 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST /api/convert/image-grayscale
// @desc    Convert image to grayscale
// @access  Public
router.post('/image-grayscale', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No image file uploaded.' });
    }

    const imageBuffer = req.file.buffer;
    const { originalname } = req.file;

    const grayscaleBuffer = await sharp(imageBuffer).grayscale().jpeg().toBuffer();

    const nameWithoutExt = originalname.split('.').slice(0, -1).join('.');
    const outputFileName = `grayscale-${nameWithoutExt}.jpg`;

    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    const archiveBuffer = await new Promise((resolve, reject) => {
      const buffers = [];
      archive.on('data', (data) => buffers.push(data));
      archive.on('end', () => resolve(Buffer.concat(buffers)));
      archive.on('error', (err) => reject(err));

      archive.append(grayscaleBuffer, { name: outputFileName });
      archive.finalize();
    });

    const zipFileName = `grayscale_image_${Date.now()}.zip`;
    const { error: uploadError } = await supabase.storage
      .from('utilityhub')
      .upload(zipFileName, archiveBuffer, {
        contentType: 'application/zip',
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage
      .from('utilityhub')
      .getPublicUrl(zipFileName);

    return res.json({ path: publicUrlData.publicUrl, originalname: zipFileName });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
