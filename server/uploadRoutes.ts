import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { parseExcel, parseCSV, validateParsedData, convertToSalesRecords, ParsedData } from './utils/documentParser';
import { getDb } from './db';
import { salesRecords, importBatches } from '../drizzle/schema';
import { sdk } from './_core/sdk';
import type { User } from '../drizzle/schema';

const router = Router();

// Extend Express Request to include authenticated user
interface AuthenticatedRequest extends Request {
  user: User;
}

// Rate limiting state (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute

/**
 * Rate limiting middleware to prevent abuse
 */
function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const clientId = req.headers.cookie || req.ip || 'unknown';
  const now = Date.now();

  const clientData = rateLimitMap.get(clientId);

  if (!clientData || now > clientData.resetTime) {
    rateLimitMap.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Слишком много запросов. Попробуйте позже.',
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
    });
  }

  clientData.count++;
  next();
}

/**
 * Authentication middleware - verifies user is logged in
 */
async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await sdk.authenticateRequest(req);
    (req as AuthenticatedRequest).user = user;
    next();
  } catch (error) {
    console.error('[Upload] Authentication failed:', error);
    return res.status(401).json({ error: 'Необходима авторизация' });
  }
}

/**
 * Admin authorization middleware - verifies user has admin or employee role
 */
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as AuthenticatedRequest).user;

  if (!user) {
    return res.status(401).json({ error: 'Необходима авторизация' });
  }

  // Allow admin and employee roles to access upload functionality
  if (user.role !== 'admin' && user.role !== 'employee') {
    console.warn(`[Upload] Unauthorized access attempt by user ${user.id} with role ${user.role}`);
    return res.status(403).json({ error: 'Недостаточно прав для выполнения операции' });
  }

  next();
}

// Apply rate limiting and authentication to all routes
router.use(rateLimiter);
router.use(requireAuth);
router.use(requireAdmin);

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
    console.error('[Upload] Error parsing file:', error);
    // Don't expose internal error details in production
    const isProduction = process.env.NODE_ENV === 'production';
    res.status(500).json({
      error: isProduction ? 'Ошибка при парсинге файла' : (error.message || 'Ошибка при парсинге файла')
    });
  }
});

// Import parsed data to database
router.post('/import', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;

    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    // Safely parse column mapping with validation
    let columnMapping: Record<string, string> = {};
    try {
      const mappingInput = req.body.columnMapping || '{}';
      columnMapping = JSON.parse(mappingInput);

      // Validate that all values are strings (prevent injection)
      for (const [key, value] of Object.entries(columnMapping)) {
        if (typeof key !== 'string' || typeof value !== 'string') {
          throw new Error('Invalid mapping format');
        }
      }
    } catch (parseError) {
      return res.status(400).json({ error: 'Неверный формат маппинга колонок' });
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

    // Convert to sales records format
    const records = convertToSalesRecords(parsedData, columnMapping);

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: 'Ошибка подключения к базе данных' });
    }

    // Create import batch record - use authenticated user ID
    const batchId = `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const [batch] = await db.insert(importBatches).values({
      batchId,
      fileName,
      fileType: parsedData.fileType,
      recordCount: records.length,
      successCount: 0,
      errorCount: 0,
      status: 'processing',
      importedBy: authReq.user.id, // Use authenticated user ID instead of untrusted input
    }).$returningId();

    console.log(`[Upload] User ${authReq.user.id} (${authReq.user.name}) started import of ${fileName}`);

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
        status: failCount === 0 ? 'completed' : 'failed',
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
    console.error('[Upload] Error importing file:', error);
    const isProduction = process.env.NODE_ENV === 'production';
    res.status(500).json({
      error: isProduction ? 'Ошибка при импорте данных' : (error.message || 'Ошибка при импорте данных')
    });
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
    console.error('[Upload] Error fetching import history:', error);
    const isProduction = process.env.NODE_ENV === 'production';
    res.status(500).json({
      error: isProduction ? 'Ошибка при получении истории импорта' : (error.message || 'Ошибка при получении истории импорта')
    });
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

    // Validate and sanitize pagination parameters
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(500, Math.max(1, parseInt(limit as string) || 50)); // Max 500 records
    const offset = (pageNum - 1) * limitNum;

    // Validate search parameter length
    const searchQuery = typeof search === 'string' ? search.slice(0, 100) : undefined;

    // Validate date formats
    const validDateFrom = dateFrom && typeof dateFrom === 'string' && !isNaN(Date.parse(dateFrom)) ? dateFrom : undefined;
    const validDateTo = dateTo && typeof dateTo === 'string' && !isNaN(Date.parse(dateTo)) ? dateTo : undefined;

    // Validate payment type against allowed values
    const allowedPaymentTypes = ['all', 'cash', 'qr', 'vip', 'card'];
    const validPaymentType = typeof paymentType === 'string' && allowedPaymentTypes.includes(paymentType) ? paymentType : undefined;

    // Build query with filters
    let query = db.select().from(salesRecords);

    // For now, get all and filter in memory (can be optimized with proper where clauses)
    const allRecords = await query.orderBy((await import('drizzle-orm')).desc(salesRecords.createdAt));

    let filtered = allRecords;

    if (validPaymentType && validPaymentType !== 'all') {
      filtered = filtered.filter(r => r.orderResource === validPaymentType);
    }

    if (validDateFrom) {
      const from = new Date(validDateFrom);
      filtered = filtered.filter(r => r.createdAt && new Date(r.createdAt) >= from);
    }

    if (validDateTo) {
      const to = new Date(validDateTo);
      filtered = filtered.filter(r => r.createdAt && new Date(r.createdAt) <= to);
    }

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
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
    console.error('[Upload] Error fetching sales:', error);
    const isProduction = process.env.NODE_ENV === 'production';
    res.status(500).json({
      error: isProduction ? 'Ошибка при получении данных о продажах' : (error.message || 'Ошибка при получении данных о продажах')
    });
  }
});

export default router;
