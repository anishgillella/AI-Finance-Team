import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { saveUploadedFile } from '../utils/fileHandler.js';
import { saveUploadedFile as saveToDb, updateFileStatus } from '../db/supabase.js';
import { UploadedFile } from '../types/index.js';
import { csvUploadTool } from '../tools/mcp-tools.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    console.log('📥 Upload request received');
    
    if (!req.file) {
      console.log('❌ No file in request');
      res.status(400).json({ success: false, error: 'No file provided' });
      return;
    }

    console.log(`📄 File received: ${req.file.originalname}, size: ${req.file.size}`);

    if (!req.file.mimetype.includes('csv') && !req.file.originalname.endsWith('.csv')) {
      console.log(`❌ Invalid file type: ${req.file.mimetype}`);
      res.status(400).json({ success: false, error: 'File must be CSV format' });
      return;
    }

    console.log('💾 Saving file to disk...');
    // Save file to disk
    const { fileId, filePath } = saveUploadedFile(req.file.originalname, req.file.buffer);
    console.log(`✅ File saved: ${filePath}, ID: ${fileId}`);

    console.log('🔍 Parsing CSV...');
    // Parse CSV to get metadata
    const uploadResult = JSON.parse(await csvUploadTool.func(filePath));
    console.log(`CSV Parse result:`, uploadResult);

    if (!uploadResult.success) {
      console.log(`❌ CSV parsing failed: ${uploadResult.error}`);
      await updateFileStatus(fileId, 'failed', uploadResult.error);
      res.status(400).json({ success: false, error: 'Failed to parse CSV: ' + uploadResult.error });
      return;
    }

    console.log(`✅ CSV parsed successfully: ${uploadResult.record_count} records`);

    console.log('💾 Saving to database...');
    // Save file metadata to database
    const uploadedFile: UploadedFile = {
      id: fileId,
      filename: req.file.originalname,
      file_path: filePath,
      file_size: req.file.size,
      upload_date: new Date(),
      record_count: uploadResult.record_count,
      date_range_start: new Date(uploadResult.date_range.start),
      date_range_end: new Date(uploadResult.date_range.end),
      status: 'completed'
    };

    await saveToDb(uploadedFile);
    console.log('✅ File metadata saved to database');

    res.json({
      success: true,
      file_id: fileId,
      filename: req.file.originalname,
      record_count: uploadResult.record_count,
      message: 'File uploaded successfully'
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    console.error('Error type:', typeof error);
    console.error('Error keys:', Object.keys(error || {}));
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : JSON.stringify(error)
    });
  }
});

export default router;
