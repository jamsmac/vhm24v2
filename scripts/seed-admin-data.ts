import { drizzle } from 'drizzle-orm/mysql2';
import { ingredients, machines, bunkers, mixers } from '../drizzle/schema';

async function seedData() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const db = drizzle(process.env.DATABASE_URL);
  
  console.log('Starting data seeding...\n');

  // Sample ingredients data
  const ingredientsData = [
    { name: 'Arabica Coffee Beans', ingredientCategory: 'coffee' as const, unit: 'g', costPerUnit: 50, minStockLevel: 5000, isActive: true },
    { name: 'Robusta Coffee Beans', ingredientCategory: 'coffee' as const, unit: 'g', costPerUnit: 35, minStockLevel: 3000, isActive: true },
    { name: 'Whole Milk', ingredientCategory: 'milk' as const, unit: 'ml', costPerUnit: 8, minStockLevel: 10000, isActive: true },
    { name: 'Skim Milk', ingredientCategory: 'milk' as const, unit: 'ml', costPerUnit: 7, minStockLevel: 5000, isActive: true },
    { name: 'Oat Milk', ingredientCategory: 'milk' as const, unit: 'ml', costPerUnit: 12, minStockLevel: 3000, isActive: true },
    { name: 'White Sugar', ingredientCategory: 'sugar' as const, unit: 'g', costPerUnit: 3, minStockLevel: 8000, isActive: true },
    { name: 'Brown Sugar', ingredientCategory: 'sugar' as const, unit: 'g', costPerUnit: 4, minStockLevel: 3000, isActive: true },
    { name: 'Vanilla Syrup', ingredientCategory: 'syrup' as const, unit: 'ml', costPerUnit: 15, minStockLevel: 2000, isActive: true },
    { name: 'Caramel Syrup', ingredientCategory: 'syrup' as const, unit: 'ml', costPerUnit: 15, minStockLevel: 2000, isActive: true },
    { name: 'Hazelnut Syrup', ingredientCategory: 'syrup' as const, unit: 'ml', costPerUnit: 16, minStockLevel: 1500, isActive: true },
    { name: 'Chocolate Powder', ingredientCategory: 'powder' as const, unit: 'g', costPerUnit: 20, minStockLevel: 2000, isActive: true },
    { name: 'Cocoa Powder', ingredientCategory: 'powder' as const, unit: 'g', costPerUnit: 25, minStockLevel: 1500, isActive: true },
    { name: 'Cinnamon Powder', ingredientCategory: 'powder' as const, unit: 'g', costPerUnit: 30, minStockLevel: 500, isActive: true },
    { name: 'Filtered Water', ingredientCategory: 'water' as const, unit: 'ml', costPerUnit: 1, minStockLevel: 50000, isActive: true },
    { name: 'Whipped Cream', ingredientCategory: 'other' as const, unit: 'ml', costPerUnit: 18, minStockLevel: 2000, isActive: true },
  ];

  console.log('Seeding ingredients...');
  await db.insert(ingredients).values(ingredientsData);
  console.log(`✓ Seeded ${ingredientsData.length} ingredients\n`);

  // Get or create machines
  let machinesList = await db.select().from(machines).limit(5);
  
  if (machinesList.length === 0) {
    console.log('No machines found. Creating sample machines...');
    
    const sampleMachines = [
      { machineCode: 'VM001', name: 'Tashkent Central', address: 'Amir Temur Square, Tashkent', latitude: '41.3111', longitude: '69.2797', status: 'operational' as const, installationDate: new Date() },
      { machineCode: 'VM002', name: 'Chilanzar District', address: 'Chilanzar 10, Tashkent', latitude: '41.2753', longitude: '69.2036', status: 'operational' as const, installationDate: new Date() },
      { machineCode: 'VM003', name: 'Yunusabad Mall', address: 'Yunusabad 4, Tashkent', latitude: '41.3472', longitude: '69.2892', status: 'operational' as const, installationDate: new Date() },
      { machineCode: 'VM004', name: 'Sergeli Market', address: 'Sergeli District, Tashkent', latitude: '41.2186', longitude: '69.2231', status: 'maintenance' as const, installationDate: new Date() },
      { machineCode: 'VM005', name: 'Mirzo Ulugbek University', address: 'Universitet 4, Tashkent', latitude: '41.3378', longitude: '69.3364', status: 'operational' as const, installationDate: new Date() },
    ];
    
    await db.insert(machines).values(sampleMachines);
    machinesList = await db.select().from(machines).limit(5);
    console.log(`✓ Created ${sampleMachines.length} sample machines\n`);
  }

  // Get ingredient IDs
  const ingredientsList = await db.select().from(ingredients);
  const ingredientMap = new Map<string, number>();
  ingredientsList.forEach(ing => {
    ingredientMap.set(ing.name, ing.id);
  });

  // Sample bunkers data
  console.log('Seeding bunkers...');
  const bunkersData = [];
  
  for (const machine of machinesList) {
    const bunkerConfigs = [
      { ingredientName: 'Arabica Coffee Beans', capacity: 5000, currentLevel: 3500 },
      { ingredientName: 'Whole Milk', capacity: 10000, currentLevel: 7200 },
      { ingredientName: 'White Sugar', capacity: 3000, currentLevel: 1800 },
      { ingredientName: 'Filtered Water', capacity: 20000, currentLevel: 15000 },
      { ingredientName: 'Chocolate Powder', capacity: 2000, currentLevel: 800 },
    ];
    
    for (let i = 0; i < bunkerConfigs.length; i++) {
      const config = bunkerConfigs[i];
      const ingredientId = ingredientMap.get(config.ingredientName);
      if (ingredientId) {
        bunkersData.push({
          machineId: machine.id,
          ingredientId,
          bunkerNumber: i + 1,
          capacity: config.capacity,
          currentLevel: config.currentLevel,
          lowLevelThreshold: Math.floor(config.capacity * 0.2),
          lastRefillDate: new Date(),
        });
      }
    }
  }
  
  if (bunkersData.length > 0) {
    await db.insert(bunkers).values(bunkersData);
    console.log(`✓ Seeded ${bunkersData.length} bunkers\n`);
  }

  // Sample mixers data
  console.log('Seeding mixers...');
  const mixersData = [];
  
  const mixerTypes: Array<'main' | 'secondary' | 'whisk' | 'grinder'> = ['main', 'secondary', 'whisk', 'grinder'];
  const mixerStatuses: Array<'operational' | 'needs_cleaning' | 'needs_repair' | 'replaced'> = ['operational', 'operational', 'operational', 'needs_cleaning'];
  
  for (const machine of machinesList) {
    const numMixers = Math.floor(Math.random() * 3) + 2; // 2-4 mixers
    
    for (let i = 0; i < numMixers; i++) {
      const mixerType = mixerTypes[i % mixerTypes.length];
      const status = mixerStatuses[Math.floor(Math.random() * mixerStatuses.length)];
      const totalCycles = Math.floor(Math.random() * 8000) + 1000;
      const maxCycles = 10000;
      const daysAgo = Math.floor(Math.random() * 60);
      const lastMaintenanceDate = new Date();
      lastMaintenanceDate.setDate(lastMaintenanceDate.getDate() - daysAgo);
      
      mixersData.push({
        machineId: machine.id,
        mixerNumber: i + 1,
        mixerType,
        status,
        totalCycles,
        maxCyclesBeforeMaintenance: maxCycles,
        lastMaintenanceDate,
      });
    }
  }
  
  if (mixersData.length > 0) {
    await db.insert(mixers).values(mixersData);
    console.log(`✓ Seeded ${mixersData.length} mixers\n`);
  }

  console.log('✅ All sample data seeded successfully!\n');
  console.log('Summary:');
  console.log(`- ${ingredientsData.length} ingredients`);
  console.log(`- ${machinesList.length} machines`);
  console.log(`- ${bunkersData.length} bunkers`);
  console.log(`- ${mixersData.length} mixers`);
}

seedData()
  .then(() => {
    console.log('\n✅ Seeding completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
