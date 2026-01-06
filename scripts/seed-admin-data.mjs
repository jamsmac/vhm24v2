import mysql from 'mysql2/promise';
import 'dotenv/config';

const connection = await mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
});

console.log('Connected to database');

// Sample ingredients data
const ingredients = [
  { name: 'Arabica Coffee Beans', category: 'coffee', unit: 'g', costPerUnit: 50, minStockLevel: 5000 },
  { name: 'Robusta Coffee Beans', category: 'coffee', unit: 'g', costPerUnit: 35, minStockLevel: 3000 },
  { name: 'Whole Milk', category: 'milk', unit: 'ml', costPerUnit: 8, minStockLevel: 10000 },
  { name: 'Skim Milk', category: 'milk', unit: 'ml', costPerUnit: 7, minStockLevel: 5000 },
  { name: 'Oat Milk', category: 'milk', unit: 'ml', costPerUnit: 12, minStockLevel: 3000 },
  { name: 'White Sugar', category: 'sugar', unit: 'g', costPerUnit: 3, minStockLevel: 8000 },
  { name: 'Brown Sugar', category: 'sugar', unit: 'g', costPerUnit: 4, minStockLevel: 3000 },
  { name: 'Vanilla Syrup', category: 'syrup', unit: 'ml', costPerUnit: 15, minStockLevel: 2000 },
  { name: 'Caramel Syrup', category: 'syrup', unit: 'ml', costPerUnit: 15, minStockLevel: 2000 },
  { name: 'Hazelnut Syrup', category: 'syrup', unit: 'ml', costPerUnit: 16, minStockLevel: 1500 },
  { name: 'Chocolate Powder', category: 'powder', unit: 'g', costPerUnit: 20, minStockLevel: 2000 },
  { name: 'Cocoa Powder', category: 'powder', unit: 'g', costPerUnit: 25, minStockLevel: 1500 },
  { name: 'Cinnamon Powder', category: 'powder', unit: 'g', costPerUnit: 30, minStockLevel: 500 },
  { name: 'Filtered Water', category: 'water', unit: 'ml', costPerUnit: 1, minStockLevel: 50000 },
  { name: 'Whipped Cream', category: 'other', unit: 'ml', costPerUnit: 18, minStockLevel: 2000 },
];

console.log('Seeding ingredients...');
for (const ingredient of ingredients) {
  await connection.execute(
    `INSERT INTO ingredients (name, ingredientCategory, unit, costPerUnit, minStockLevel, isActive) 
     VALUES (?, ?, ?, ?, ?, true)
     ON DUPLICATE KEY UPDATE name=name`,
    [ingredient.name, ingredient.category, ingredient.unit, ingredient.costPerUnit, ingredient.minStockLevel]
  );
}
console.log(`✓ Seeded ${ingredients.length} ingredients`);

// Get machine IDs
const [machines] = await connection.execute('SELECT id FROM machines LIMIT 5');
if (machines.length === 0) {
  console.log('No machines found. Creating sample machines...');
  
  const sampleMachines = [
    { machineCode: 'VM001', name: 'Tashkent Central', address: 'Amir Temur Square, Tashkent', latitude: '41.3111', longitude: '69.2797', status: 'operational' },
    { machineCode: 'VM002', name: 'Chilanzar District', address: 'Chilanzar 10, Tashkent', latitude: '41.2753', longitude: '69.2036', status: 'operational' },
    { machineCode: 'VM003', name: 'Yunusabad Mall', address: 'Yunusabad 4, Tashkent', latitude: '41.3472', longitude: '69.2892', status: 'operational' },
    { machineCode: 'VM004', name: 'Sergeli Market', address: 'Sergeli District, Tashkent', latitude: '41.2186', longitude: '69.2231', status: 'maintenance' },
    { machineCode: 'VM005', name: 'Mirzo Ulugbek University', address: 'Universitet 4, Tashkent', latitude: '41.3378', longitude: '69.3364', status: 'operational' },
  ];
  
  for (const machine of sampleMachines) {
    await connection.execute(
      `INSERT INTO machines (machineCode, name, address, latitude, longitude, status, installationDate) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [machine.machineCode, machine.name, machine.address, machine.latitude, machine.longitude, machine.status]
    );
  }
  
  // Refresh machine list
  const [newMachines] = await connection.execute('SELECT id FROM machines LIMIT 5');
  machines.push(...newMachines);
  console.log(`✓ Created ${sampleMachines.length} sample machines`);
}

// Get ingredient IDs
const [ingredientRows] = await connection.execute('SELECT id, name, ingredientCategory FROM ingredients');
const ingredientMap = {};
ingredientRows.forEach(row => {
  ingredientMap[row.name] = row.id;
});

// Sample bunkers data (link to machines and ingredients)
console.log('Seeding bunkers...');
let bunkerCount = 0;

for (const machine of machines) {
  // Each machine gets bunkers for main ingredients
  const bunkerConfigs = [
    { ingredientName: 'Arabica Coffee Beans', capacity: 5000, currentLevel: 3500 },
    { ingredientName: 'Whole Milk', capacity: 10000, currentLevel: 7200 },
    { ingredientName: 'White Sugar', capacity: 3000, currentLevel: 1800 },
    { ingredientName: 'Filtered Water', capacity: 20000, currentLevel: 15000 },
    { ingredientName: 'Chocolate Powder', capacity: 2000, currentLevel: 800 },
  ];
  
  for (const config of bunkerConfigs) {
    const ingredientId = ingredientMap[config.ingredientName];
    if (ingredientId) {
      await connection.execute(
        `INSERT INTO bunkers (machineId, ingredientId, capacity, currentLevel, lowLevelThreshold, lastRefillDate) 
         VALUES (?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE machineId=machineId`,
        [machine.id, ingredientId, config.capacity, config.currentLevel, Math.floor(config.capacity * 0.2)]
      );
      bunkerCount++;
    }
  }
}
console.log(`✓ Seeded ${bunkerCount} bunkers`);

// Sample mixers data (link to machines)
console.log('Seeding mixers...');
let mixerCount = 0;

const mixerTypes = ['main', 'secondary', 'whisk', 'grinder'];
const mixerStatuses = ['operational', 'operational', 'operational', 'needs_cleaning'];

for (const machine of machines) {
  // Each machine gets 2-4 mixers
  const numMixers = Math.floor(Math.random() * 3) + 2; // 2-4 mixers
  
  for (let i = 0; i < numMixers; i++) {
    const mixerType = mixerTypes[i % mixerTypes.length];
    const status = mixerStatuses[Math.floor(Math.random() * mixerStatuses.length)];
    const totalCycles = Math.floor(Math.random() * 8000) + 1000;
    const maxCycles = 10000;
    
    await connection.execute(
      `INSERT INTO mixers (machineId, mixerNumber, mixerType, status, totalCycles, maxCyclesBeforeMaintenance, lastMaintenanceDate) 
       VALUES (?, ?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY))`,
      [machine.id, i + 1, mixerType, status, totalCycles, maxCycles, Math.floor(Math.random() * 60)]
    );
    mixerCount++;
  }
}
console.log(`✓ Seeded ${mixerCount} mixers`);

await connection.end();
console.log('\n✅ All sample data seeded successfully!');
console.log(`
Summary:
- ${ingredients.length} ingredients
- ${machines.length} machines
- ${bunkerCount} bunkers
- ${mixerCount} mixers
`);
