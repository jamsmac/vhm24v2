import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function createTables() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL as string);
  
  const tables = [
    `CREATE TABLE IF NOT EXISTS employees (
      id int AUTO_INCREMENT PRIMARY KEY,
      fullName varchar(128) NOT NULL,
      phone varchar(32),
      email varchar(320),
      username varchar(64),
      employeeRole enum('platform_owner','platform_admin','org_owner','org_admin','manager','supervisor','operator','technician','collector','warehouse_manager','warehouse_worker','accountant','investor') NOT NULL DEFAULT 'operator',
      employeeStatus enum('pending','active','inactive','suspended') NOT NULL DEFAULT 'pending',
      telegramUserId varchar(64),
      telegramUsername varchar(128),
      hireDate timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      salary int DEFAULT 0,
      notes text,
      createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS ingredients (
      id int AUTO_INCREMENT PRIMARY KEY,
      name varchar(128) NOT NULL,
      ingredientCategory enum('coffee','milk','sugar','syrup','powder','water','other') NOT NULL DEFAULT 'other',
      unit varchar(32) NOT NULL DEFAULT 'g',
      costPerUnit int NOT NULL DEFAULT 0,
      minStockLevel int NOT NULL DEFAULT 100,
      description text,
      isActive boolean NOT NULL DEFAULT true,
      createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS cleaning_supplies (
      id int AUTO_INCREMENT PRIMARY KEY,
      name varchar(128) NOT NULL,
      cleaningCategory enum('detergent','sanitizer','descaler','brush','cloth','other') NOT NULL DEFAULT 'other',
      unit varchar(32) NOT NULL DEFAULT 'pcs',
      costPerUnit int NOT NULL DEFAULT 0,
      minStockLevel int NOT NULL DEFAULT 10,
      usageFrequency varchar(64),
      description text,
      isActive boolean NOT NULL DEFAULT true,
      createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS spare_parts (
      id int AUTO_INCREMENT PRIMARY KEY,
      name varchar(128) NOT NULL,
      partNumber varchar(64) UNIQUE,
      partCategory enum('motor','pump','valve','sensor','display','board','heating','other') NOT NULL DEFAULT 'other',
      compatibleModels text,
      costPerUnit int NOT NULL DEFAULT 0,
      minStockLevel int NOT NULL DEFAULT 2,
      supplier varchar(128),
      warrantyMonths int DEFAULT 0,
      description text,
      isActive boolean NOT NULL DEFAULT true,
      createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS bunkers (
      id int AUTO_INCREMENT PRIMARY KEY,
      machineId int NOT NULL,
      ingredientId int,
      bunkerNumber int NOT NULL,
      capacity int NOT NULL,
      currentLevel int NOT NULL DEFAULT 0,
      lowLevelThreshold int NOT NULL DEFAULT 20,
      lastRefillDate timestamp,
      lastRefillBy int,
      notes text,
      createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS mixers (
      id int AUTO_INCREMENT PRIMARY KEY,
      machineId int NOT NULL,
      mixerNumber int NOT NULL,
      mixerType enum('main','secondary','whisk','grinder') NOT NULL DEFAULT 'main',
      mixerStatus enum('operational','needs_cleaning','needs_repair','replaced') NOT NULL DEFAULT 'operational',
      lastMaintenanceDate timestamp,
      lastMaintenanceBy int,
      totalCycles int NOT NULL DEFAULT 0,
      maxCyclesBeforeMaintenance int NOT NULL DEFAULT 10000,
      notes text,
      createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS warehouse_inventory (
      id int AUTO_INCREMENT PRIMARY KEY,
      itemType enum('ingredient','cleaning','spare_part','other') NOT NULL,
      itemId int NOT NULL,
      quantity int NOT NULL DEFAULT 0,
      location varchar(64),
      lastStockCheck timestamp,
      lastStockCheckBy int,
      createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS stock_movements (
      id int AUTO_INCREMENT PRIMARY KEY,
      movementItemType enum('ingredient','cleaning','spare_part') NOT NULL,
      itemId int NOT NULL,
      movementType enum('in','out','adjustment','transfer') NOT NULL,
      quantity int NOT NULL,
      reason varchar(256),
      machineId int,
      employeeId int,
      notes text,
      createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS contractors (
      id int AUTO_INCREMENT PRIMARY KEY,
      companyName varchar(256) NOT NULL,
      contactPerson varchar(128),
      phone varchar(32),
      email varchar(320),
      address text,
      serviceType enum('repair','supply','cleaning','installation','consulting','other') NOT NULL DEFAULT 'other',
      contractStart timestamp,
      contractEnd timestamp,
      paymentTerms varchar(128),
      rating int DEFAULT 0,
      notes text,
      isActive boolean NOT NULL DEFAULT true,
      createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS contractor_invoices (
      id int AUTO_INCREMENT PRIMARY KEY,
      contractorId int NOT NULL,
      invoiceNumber varchar(64) NOT NULL,
      amount int NOT NULL,
      invoiceStatus enum('pending','paid','overdue','cancelled') NOT NULL DEFAULT 'pending',
      issueDate timestamp NOT NULL,
      dueDate timestamp,
      paidDate timestamp,
      description text,
      createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS maintenance_history (
      id int AUTO_INCREMENT PRIMARY KEY,
      machineId int NOT NULL,
      employeeId int,
      contractorId int,
      maintenanceType enum('cleaning','repair','replacement','inspection','refill') NOT NULL,
      description text,
      partsUsed text,
      cost int DEFAULT 0,
      scheduledDate timestamp,
      completedDate timestamp,
      maintenanceStatus enum('scheduled','in_progress','completed','cancelled') NOT NULL DEFAULT 'scheduled',
      notes text,
      createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS employee_machine_assignments (
      id int AUTO_INCREMENT PRIMARY KEY,
      employeeId int NOT NULL,
      machineId int NOT NULL,
      assignmentType enum('primary','backup','temporary') NOT NULL DEFAULT 'primary',
      startDate timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      endDate timestamp,
      isActive boolean NOT NULL DEFAULT true,
      createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
  ];
  
  for (const sql of tables) {
    try {
      const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1];
      console.log('Creating table:', tableName);
      await connection.execute(sql);
      console.log('✓ Success');
    } catch (err: any) {
      console.error('✗ Error:', err.message);
    }
  }
  
  await connection.end();
  console.log('\\nAll tables created');
}

createTables().catch(console.error);
