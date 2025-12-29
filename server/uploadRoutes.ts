import { Router, Request, Response } from 'express';
import multer from 'multer';
import { parseExcel, parseCSV, validateParsedData, convertToSalesRecords, ParsedData } from './utils/documentParser';
import { getDb } from './db';
import { salesRecords, importBatches } from '../drizzle/schema';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'application/vnd.ms-excel', // xls
      'text/csv',
      'application/csv',
    ];
    const allowedExtensions = ['.xlsx', '.xls', '.csv'];
    
    const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Неподдерживаемый формат файла. Используйте Excel (.xlsx, .xls) или CSV (.csv)'));
    }
  }
});

// Parse uploaded file and return structure preview
router.post('/parse', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    const fileName = req.file.originalname;
    const ext = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));
    
    let parsedData: ParsedData;
    
    if (ext === '.csv') {
      const content = req.file.buffer.toString('utf-8');
      parsedData = parseCSV(content, fileName);
    } else {
      parsedData = parseExcel(req.file.buffer, fileName);
    }

    const validation = validateParsedData(parsedData);
    
    // Return preview with first 10 rows
    res.json({
      success: true,
      data: {
        columns: parsedData.columns,
        preview: parsedData.rows.slice(0, 10),
        totalRows: parsedData.totalRows,
        fileName: parsedData.fileName,
        fileType: parsedData.fileType,
        validation
      }
    });
  } catch (error: any) {
    console.error('Error parsing file:', error);
    res.status(500).json({ error: error.message || 'Ошибка при парсинге файла' });
  }
});

// Import parsed data to database
router.post('/import', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    const columnMapping = JSON.parse(req.body.columnMapping || '{}');
    console.log('Column mapping received:', columnMapping);
    const fileName = req.file.originalname;
    const ext = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));
    
    let parsedData: ParsedData;
    
    if (ext === '.csv') {
      const content = req.file.buffer.toString('utf-8');
      parsedData = parseCSV(content, fileName);
    } else {
      parsedData = parseExcel(req.file.buffer, fileName);
    }

    // Convert to sales records format
    const records = convertToSalesRecords(parsedData, columnMapping);
    
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: 'Ошибка подключения к базе данных' });
    }

    // Create import batch record
    const batchId = `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const [batch] = await db.insert(importBatches).values({
      batchId,
      fileName,
      fileType: parsedData.fileType,
      recordCount: records.length,
      successCount: 0,
      errorCount: 0,
      importStatus: 'processing',
      importedBy: req.body.uploadedBy ? parseInt(req.body.uploadedBy) : null,
    }).$returningId();

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    // Insert records one by one to handle duplicates
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      try {
        // Map record fields to database schema columns
        const orderPrice = typeof record.price === 'string' 
          ? parseInt(record.price.replace(/[^\d]/g, '')) || 0 
          : (record.price || 0);
        
        await db.insert(salesRecords).values({
          importBatchId: String(batch.id),
          orderNumber: record.orderNumber || `ORD-${Date.now()}-${i}`,
          operatorNumber: record.operator || null,
          productName: record.productName || 'Unknown',
          flavorName: record.flavor || null,
          orderResource: record.paymentType || null, // Payment resource type
          orderType: null,
          paymentStatus: record.paymentStatus || 'paid',
          cupType: null,
          machineCode: record.machineCode || null,
          address: record.address || null,
          orderPrice: orderPrice,
          brewingStatus: null,
          createdTime: record.createdAt ? new Date(record.createdAt) : null,
          paymentTime: record.paidAt ? new Date(record.paidAt) : null,
          brewingTime: null,
          deliveryTime: record.deliveredAt ? new Date(record.deliveredAt) : null,
          refundTime: null,
          paymentCard: null,
          reason: record.refundReason || null,
          notes: record.notes || null,
        });
        successCount++;
      } catch (err: any) {
        failCount++;
        if (errors.length < 10) {
          errors.push(`Строка ${i + 2}: ${err.message}`);
        }
      }
    }

    // Update batch status
    await db.update(importBatches)
      .set({
        successCount: successCount,
        errorCount: failCount,
        importStatus: failCount === 0 ? 'completed' : 'failed',
        errors: errors.length > 0 ? errors : null,
        completedAt: new Date(),
      })
      .where((await import('drizzle-orm')).eq(importBatches.id, batch.id));

    res.json({
      success: true,
      data: {
        batchId: batch.id,
        totalRecords: records.length,
        successfulRecords: successCount,
        failedRecords: failCount,
        errors: errors.slice(0, 10)
      }
    });
  } catch (error: any) {
    console.error('Error importing file:', error);
    res.status(500).json({ error: error.message || 'Ошибка при импорте данных' });
  }
});

// Get import history
router.get('/history', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: 'Ошибка подключения к базе данных' });
    }

    const batches = await db.select().from(importBatches)
      .orderBy((await import('drizzle-orm')).desc(importBatches.createdAt))
      .limit(50);

    res.json({ success: true, data: batches });
  } catch (error: any) {
    console.error('Error fetching import history:', error);
    res.status(500).json({ error: error.message || 'Ошибка при получении истории импорта' });
  }
});

// Get sales records with filtering
router.get('/sales', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: 'Ошибка подключения к базе данных' });
    }

    const { paymentType, dateFrom, dateTo, search, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build query with filters
    let query = db.select().from(salesRecords);
    
    // For now, get all and filter in memory (can be optimized with proper where clauses)
    const allRecords = await query.orderBy((await import('drizzle-orm')).desc(salesRecords.createdAt));
    
    let filtered = allRecords;
    
    if (paymentType && paymentType !== 'all') {
      filtered = filtered.filter(r => r.orderResource === paymentType);
    }
    
    if (dateFrom) {
      const from = new Date(dateFrom as string);
      filtered = filtered.filter(r => r.createdAt && new Date(r.createdAt) >= from);
    }
    
    if (dateTo) {
      const to = new Date(dateTo as string);
      filtered = filtered.filter(r => r.createdAt && new Date(r.createdAt) <= to);
    }
    
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filtered = filtered.filter(r => 
        r.productName?.toLowerCase().includes(searchLower) ||
        r.orderNumber?.toLowerCase().includes(searchLower) ||
        r.machineCode?.toLowerCase().includes(searchLower)
      );
    }

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limitNum);

    // Calculate totals using correct column names
    const totals = {
      total: filtered.reduce((sum, r) => sum + (r.orderPrice || 0), 0),
      cash: filtered.filter(r => r.orderResource?.toLowerCase().includes('налич')).reduce((sum, r) => sum + (r.orderPrice || 0), 0),
      qr: filtered.filter(r => r.orderResource?.toLowerCase().includes('qr') || r.orderResource?.toLowerCase().includes('таможен')).reduce((sum, r) => sum + (r.orderPrice || 0), 0),
      vip: filtered.filter(r => r.orderResource?.toLowerCase().includes('vip')).reduce((sum, r) => sum + (r.orderPrice || 0), 0),
      card: filtered.filter(r => r.orderResource?.toLowerCase().includes('карт')).reduce((sum, r) => sum + (r.orderPrice || 0), 0),
    };

    // Map records to expected frontend format
    const mappedRecords = paginated.map(r => ({
      id: r.id,
      orderNumber: r.orderNumber,
      productName: r.flavorName || r.productName,
      flavor: r.flavorName,
      paymentType: r.orderResource || 'cash',
      paymentStatus: r.paymentStatus || 'paid',
      machineCode: r.machineCode,
      address: r.address,
      price: r.orderPrice,
      createdAt: r.createdTime || r.createdAt,
      paidAt: r.paymentTime,
      deliveredAt: r.deliveryTime,
      operator: r.operatorNumber,
      refundReason: r.reason,
      notes: r.notes,
    }));

    res.json({
      success: true,
      data: {
        records: mappedRecords,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        totals
      }
    });
  } catch (error: any) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: error.message || 'Ошибка при получении данных о продажах' });
  }
});

export default router;
