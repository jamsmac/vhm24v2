import * as XLSX from 'xlsx';

export interface ParsedColumn {
  name: string;
  originalName: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  sampleValues: any[];
  suggestedMapping: string | null;
}

export interface ParsedData {
  columns: ParsedColumn[];
  rows: Record<string, any>[];
  totalRows: number;
  fileName: string;
  fileType: 'excel' | 'csv';
}

// Known column mappings for sales data
const SALES_COLUMN_MAPPINGS: Record<string, string[]> = {
  orderNumber: ['номер заказа', 'order number', 'order_number', 'ordernumber', '№', 'номер', 'id'],
  productName: ['товар', 'product', 'product_name', 'productname', 'название', 'name', 'наименование'],
  flavor: ['вкус', 'flavor', 'taste', 'variant'],
  paymentType: ['тип оплаты', 'payment type', 'payment_type', 'paymenttype', 'оплата', 'payment'],
  paymentStatus: ['статус платежа', 'payment status', 'payment_status', 'статус оплаты', 'status'],
  machineCode: ['машинный код', 'machine code', 'machine_code', 'machinecode', 'код автомата', 'автомат'],
  address: ['адрес', 'address', 'location', 'место'],
  price: ['цена', 'цена заказа', 'price', 'amount', 'сумма', 'стоимость', 'order price', 'total'],
  createdAt: ['время создания', 'created at', 'created_at', 'createdat', 'дата', 'date', 'время'],
  paidAt: ['время оплаты', 'paid at', 'paid_at', 'paidat', 'дата оплаты'],
  deliveredAt: ['время доставки', 'delivered at', 'delivered_at', 'deliveredat', 'дата выдачи'],
  operator: ['оператор', 'operator', 'сотрудник', 'employee'],
  refundReason: ['причина возврата', 'refund reason', 'refund_reason', 'возврат'],
  notes: ['замечания', 'notes', 'comments', 'комментарий', 'примечание'],
};

// Detect column type from sample values
function detectColumnType(values: any[]): 'string' | 'number' | 'date' | 'boolean' {
  const nonEmptyValues = values.filter(v => v !== null && v !== undefined && v !== '');
  if (nonEmptyValues.length === 0) return 'string';

  let numberCount = 0;
  let dateCount = 0;
  let booleanCount = 0;

  for (const value of nonEmptyValues) {
    // Check for boolean
    if (typeof value === 'boolean' || value === 'true' || value === 'false' || value === 'да' || value === 'нет') {
      booleanCount++;
      continue;
    }

    // Check for number
    if (typeof value === 'number' || (!isNaN(Number(value)) && value !== '')) {
      numberCount++;
      continue;
    }

    // Check for date
    if (value instanceof Date) {
      dateCount++;
      continue;
    }
    
    // Try to parse as date
    const dateStr = String(value);
    if (dateStr.match(/^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}/) || 
        dateStr.match(/^\d{4}[./-]\d{1,2}[./-]\d{1,2}/) ||
        !isNaN(Date.parse(dateStr))) {
      dateCount++;
    }
  }

  const total = nonEmptyValues.length;
  if (booleanCount / total > 0.8) return 'boolean';
  if (numberCount / total > 0.8) return 'number';
  if (dateCount / total > 0.8) return 'date';
  return 'string';
}

// Find suggested mapping for a column name
function findSuggestedMapping(columnName: string): string | null {
  const normalizedName = columnName.toLowerCase().trim();
  
  for (const [field, aliases] of Object.entries(SALES_COLUMN_MAPPINGS)) {
    for (const alias of aliases) {
      if (normalizedName === alias || normalizedName.includes(alias) || alias.includes(normalizedName)) {
        return field;
      }
    }
  }
  
  return null;
}

// Parse Excel file
export function parseExcel(buffer: Buffer, fileName: string): ParsedData {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON with header row
  const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { 
    raw: false,
    dateNF: 'yyyy-mm-dd hh:mm:ss'
  });
  
  if (jsonData.length === 0) {
    return {
      columns: [],
      rows: [],
      totalRows: 0,
      fileName,
      fileType: 'excel'
    };
  }

  // Get column names from first row
  const columnNames = Object.keys(jsonData[0]);
  
  // Analyze columns
  const columns: ParsedColumn[] = columnNames.map(name => {
    const sampleValues = jsonData.slice(0, 10).map(row => row[name]);
    return {
      name: name,
      originalName: name,
      type: detectColumnType(sampleValues),
      sampleValues: sampleValues.slice(0, 5),
      suggestedMapping: findSuggestedMapping(name)
    };
  });

  return {
    columns,
    rows: jsonData,
    totalRows: jsonData.length,
    fileName,
    fileType: 'excel'
  };
}

// Parse CSV file
export function parseCSV(content: string, fileName: string): ParsedData {
  // Detect delimiter
  const firstLine = content.split('\n')[0];
  const delimiters = [',', ';', '\t', '|'];
  let bestDelimiter = ',';
  let maxCount = 0;
  
  for (const delimiter of delimiters) {
    const count = (firstLine.match(new RegExp(delimiter, 'g')) || []).length;
    if (count > maxCount) {
      maxCount = count;
      bestDelimiter = delimiter;
    }
  }

  // Parse CSV manually for better control
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) {
    return {
      columns: [],
      rows: [],
      totalRows: 0,
      fileName,
      fileType: 'csv'
    };
  }

  // Parse header
  const headers = parseCSVLine(lines[0], bestDelimiter);
  
  // Parse data rows
  const rows: Record<string, any>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], bestDelimiter);
    const row: Record<string, any> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  // Analyze columns
  const columns: ParsedColumn[] = headers.map(name => {
    const sampleValues = rows.slice(0, 10).map(row => row[name]);
    return {
      name: name,
      originalName: name,
      type: detectColumnType(sampleValues),
      sampleValues: sampleValues.slice(0, 5),
      suggestedMapping: findSuggestedMapping(name)
    };
  });

  return {
    columns,
    rows,
    totalRows: rows.length,
    fileName,
    fileType: 'csv'
  };
}

// Helper to parse a single CSV line handling quotes
function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Convert parsed data to sales records format
export function convertToSalesRecords(
  data: ParsedData, 
  columnMapping: Record<string, string>
): any[] {
  console.log('Converting with mapping:', columnMapping);
  console.log('First row sample:', data.rows[0]);
  
  return data.rows.map((row, idx) => {
    const record: Record<string, any> = {};
    
    for (const [targetField, sourceColumn] of Object.entries(columnMapping)) {
      if (sourceColumn && row[sourceColumn] !== undefined) {
        let value = row[sourceColumn];
        if (idx === 0) console.log(`Field ${targetField}: sourceColumn=${sourceColumn}, value=${value}`);
        
        // Type conversion based on target field
        if (targetField === 'price' && typeof value === 'string') {
          value = parseFloat(value.replace(/[^\d.-]/g, '')) || 0;
        }
        if (['createdAt', 'paidAt', 'deliveredAt'].includes(targetField) && value) {
          value = new Date(value);
        }
        
        record[targetField] = value;
      }
    }
    
    return record;
  });
}

// Validate parsed data
export function validateParsedData(data: ParsedData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (data.rows.length === 0) {
    errors.push('Файл не содержит данных');
  }
  
  if (data.columns.length === 0) {
    errors.push('Не удалось определить структуру колонок');
  }
  
  // Check for required columns
  const hasOrderNumber = data.columns.some(c => c.suggestedMapping === 'orderNumber');
  const hasProductName = data.columns.some(c => c.suggestedMapping === 'productName');
  
  if (!hasOrderNumber && !hasProductName) {
    errors.push('Не найдены обязательные колонки (номер заказа или название товара)');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
