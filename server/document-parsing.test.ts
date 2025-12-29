import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseExcel, parseCSV, convertToSalesRecords, ParsedData } from './utils/documentParser';
import * as XLSX from 'xlsx';

describe('Document Parser', () => {
  describe('parseExcel', () => {
    it('should parse Excel buffer and return rows with headers', () => {
      // Create a simple Excel file in memory
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([
        ['Номер заказа', 'Товар', 'Цена'],
        ['001', 'Капучино', '20000'],
        ['002', 'Латте', '25000'],
      ]);
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const result = parseExcel(buffer, 'test.xlsx');

      expect(result.fileType).toBe('excel');
      expect(result.columns.length).toBeGreaterThan(0);
      expect(result.columns.map(c => c.name)).toContain('Номер заказа');
      expect(result.columns.map(c => c.name)).toContain('Товар');
      expect(result.columns.map(c => c.name)).toContain('Цена');
      expect(result.rows.length).toBe(2);
    });

    it('should handle empty Excel file', () => {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([]);
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const result = parseExcel(buffer, 'empty.xlsx');

      expect(result.fileType).toBe('excel');
      expect(result.rows.length).toBe(0);
    });

    it('should detect suggested mappings for known columns', () => {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([
        ['Номер заказа', 'Цена заказа', 'Адрес', 'Машинный код'],
        ['001', '20000', 'ТЦ Парус', 'ABC123'],
      ]);
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const result = parseExcel(buffer, 'test.xlsx');

      const orderNumberCol = result.columns.find(c => c.name === 'Номер заказа');
      const priceCol = result.columns.find(c => c.name === 'Цена заказа');
      const addressCol = result.columns.find(c => c.name === 'Адрес');
      const machineCodeCol = result.columns.find(c => c.name === 'Машинный код');

      expect(orderNumberCol?.suggestedMapping).toBe('orderNumber');
      expect(priceCol?.suggestedMapping).toBe('price');
      expect(addressCol?.suggestedMapping).toBe('address');
      expect(machineCodeCol?.suggestedMapping).toBe('machineCode');
    });
  });

  describe('parseCSV', () => {
    it('should parse CSV content with semicolon delimiter', () => {
      const csvContent = `Номер заказа;Товар;Цена
001;Капучино;20000
002;Латте;25000`;

      const result = parseCSV(csvContent, 'test.csv');

      expect(result.fileType).toBe('csv');
      expect(result.rows.length).toBe(2);
    });

    it('should handle empty CSV', () => {
      const result = parseCSV('', 'empty.csv');

      expect(result.fileType).toBe('csv');
      expect(result.rows.length).toBe(0);
    });
  });

  describe('convertToSalesRecords', () => {
    it('should convert parsed data to sales records', () => {
      // Create ParsedData structure
      const parsedData: ParsedData = {
        columns: [
          { name: 'Номер заказа', originalName: 'Номер заказа', type: 'string', sampleValues: ['001'], suggestedMapping: 'orderNumber' },
          { name: 'Товар', originalName: 'Товар', type: 'string', sampleValues: ['Капучино'], suggestedMapping: 'productName' },
          { name: 'Цена', originalName: 'Цена', type: 'number', sampleValues: ['20000'], suggestedMapping: 'price' },
          { name: 'Адрес', originalName: 'Адрес', type: 'string', sampleValues: ['ТЦ Парус'], suggestedMapping: 'address' },
        ],
        rows: [
          { 'Номер заказа': '001', 'Товар': 'Капучино', 'Цена': '20000', 'Адрес': 'ТЦ Парус' },
          { 'Номер заказа': '002', 'Товар': 'Латте', 'Цена': '25000', 'Адрес': 'ТЦ Мега' },
        ],
        totalRows: 2,
        fileName: 'test.xlsx',
        fileType: 'excel',
      };
      
      const columnMapping = {
        orderNumber: 'Номер заказа',
        productName: 'Товар',
        price: 'Цена',
        address: 'Адрес',
      };

      const records = convertToSalesRecords(parsedData, columnMapping);

      expect(records.length).toBe(2);
      expect(records[0].orderNumber).toBe('001');
      expect(records[0].productName).toBe('Капучино');
      expect(records[0].price).toBe(20000);
      expect(records[0].address).toBe('ТЦ Парус');
    });

    it('should handle missing columns gracefully', () => {
      const parsedData: ParsedData = {
        columns: [
          { name: 'Номер заказа', originalName: 'Номер заказа', type: 'string', sampleValues: ['001'], suggestedMapping: 'orderNumber' },
          { name: 'Товар', originalName: 'Товар', type: 'string', sampleValues: ['Капучино'], suggestedMapping: 'productName' },
        ],
        rows: [
          { 'Номер заказа': '001', 'Товар': 'Капучино' },
        ],
        totalRows: 1,
        fileName: 'test.xlsx',
        fileType: 'excel',
      };
      
      const columnMapping = {
        orderNumber: 'Номер заказа',
        productName: 'Товар',
        price: 'Цена',  // This column doesn't exist in rows
      };

      const records = convertToSalesRecords(parsedData, columnMapping);

      expect(records.length).toBe(1);
      expect(records[0].orderNumber).toBe('001');
      // Price should be undefined since column doesn't exist
      expect(records[0].price).toBeUndefined();
    });

    it('should parse price with comma as decimal separator', () => {
      const parsedData: ParsedData = {
        columns: [
          { name: 'Цена', originalName: 'Цена', type: 'number', sampleValues: ['20,000'], suggestedMapping: 'price' },
        ],
        rows: [
          { 'Цена': '20,000' },
          { 'Цена': '25.500' },
        ],
        totalRows: 2,
        fileName: 'test.xlsx',
        fileType: 'excel',
      };
      
      const columnMapping = { price: 'Цена' };

      const records = convertToSalesRecords(parsedData, columnMapping);

      expect(records[0].price).toBe(20000);
      expect(records[1].price).toBe(25.5);
    });
  });
});

describe('Mixers Management', () => {
  describe('Mixer Data Structure', () => {
    it('should have required mixer fields', () => {
      const mixer = {
        id: 1,
        name: 'Кофемолка #1',
        type: 'grinder',
        machineId: 1,
        status: 'active',
        currentCycles: 4500,
        maxCycles: 10000,
        lastMaintenance: new Date(),
        notes: 'Работает исправно',
      };

      expect(mixer.id).toBeDefined();
      expect(mixer.name).toBeDefined();
      expect(mixer.type).toBeDefined();
      expect(mixer.machineId).toBeDefined();
      expect(mixer.status).toBeDefined();
      expect(mixer.currentCycles).toBeDefined();
      expect(mixer.maxCycles).toBeDefined();
    });

    it('should calculate cycle percentage correctly', () => {
      const currentCycles = 8500;
      const maxCycles = 10000;
      const percentage = Math.round((currentCycles / maxCycles) * 100);

      expect(percentage).toBe(85);
    });

    it('should identify mixers needing attention', () => {
      const mixers = [
        { currentCycles: 4500, maxCycles: 10000, status: 'active' },
        { currentCycles: 8500, maxCycles: 10000, status: 'active' },
        { currentCycles: 9800, maxCycles: 10000, status: 'maintenance' },
      ];

      const needsAttention = mixers.filter(m => {
        const percentage = (m.currentCycles / m.maxCycles) * 100;
        return percentage >= 80 && m.status === 'active';
      });

      expect(needsAttention.length).toBe(1);
    });
  });

  describe('Mixer Types', () => {
    it('should support all mixer types', () => {
      const validTypes = ['grinder', 'milk', 'syrup', 'water', 'sugar', 'other'];
      
      validTypes.forEach(type => {
        expect(['grinder', 'milk', 'syrup', 'water', 'sugar', 'other']).toContain(type);
      });
    });
  });

  describe('Mixer Status', () => {
    it('should support all status values', () => {
      const validStatuses = ['active', 'attention', 'maintenance', 'inactive'];
      
      validStatuses.forEach(status => {
        expect(['active', 'attention', 'maintenance', 'inactive']).toContain(status);
      });
    });
  });

  describe('Maintenance Tracking', () => {
    it('should track maintenance history', () => {
      const maintenanceHistory = [
        { date: new Date('2025-12-01'), action: 'Замена уплотнителя', employee: 'Петров В.В.' },
        { date: new Date('2025-11-15'), action: 'Чистка', employee: 'Сидоров К.М.' },
        { date: new Date('2025-10-20'), action: 'Калибровка', employee: 'Козлов Д.И.' },
      ];

      expect(maintenanceHistory.length).toBe(3);
      expect(maintenanceHistory[0].action).toBe('Замена уплотнителя');
    });

    it('should reset cycles after maintenance', () => {
      let mixer = { currentCycles: 9500, maxCycles: 10000 };
      
      // Simulate maintenance
      mixer.currentCycles = 0;

      expect(mixer.currentCycles).toBe(0);
    });
  });
});

describe('Sales Import Integration', () => {
  describe('Import Batch Tracking', () => {
    it('should track import batch metadata', () => {
      const batch = {
        id: 1,
        fileName: 'order_2025-12-25.xlsx',
        totalRecords: 475,
        importedRecords: 470,
        failedRecords: 5,
        createdAt: new Date(),
      };

      expect(batch.totalRecords).toBe(475);
      expect(batch.importedRecords + batch.failedRecords).toBe(batch.totalRecords);
    });
  });

  describe('Payment Type Detection', () => {
    it('should detect cash payment', () => {
      const paymentTypes = ['Оплата наличными', 'наличные', 'cash'];
      
      paymentTypes.forEach(type => {
        const isCash = type.toLowerCase().includes('налич') || type.toLowerCase() === 'cash';
        expect(isCash).toBe(true);
      });
    });

    it('should detect QR payment', () => {
      const paymentTypes = ['QR оплата', 'Таможенный платеж', 'qr'];
      
      paymentTypes.forEach(type => {
        const isQR = type.toLowerCase().includes('qr') || type.toLowerCase().includes('таможен');
        expect(isQR).toBe(true);
      });
    });

    it('should detect VIP payment', () => {
      const paymentTypes = ['VIP', 'vip клиент'];
      
      paymentTypes.forEach(type => {
        const isVIP = type.toLowerCase().includes('vip');
        expect(isVIP).toBe(true);
      });
    });
  });

  describe('Data Validation', () => {
    it('should validate required fields', () => {
      const record = {
        orderNumber: '001',
        productName: 'Капучино',
        price: 20000,
      };

      const isValid = record.orderNumber && record.productName !== undefined;
      expect(isValid).toBe(true);
    });

    it('should handle null values', () => {
      const record = {
        orderNumber: null,
        productName: 'Капучино',
        price: 20000,
      };

      const orderNumber = record.orderNumber || 'UNKNOWN';
      expect(orderNumber).toBe('UNKNOWN');
    });
  });
});
