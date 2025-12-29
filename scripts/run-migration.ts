import mysql from 'mysql2/promise';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  
  const sqlContent = fs.readFileSync('./drizzle/0002_optimal_menace.sql', 'utf8');
  const statements = sqlContent.split('--> statement-breakpoint').map(s => s.trim()).filter(s => s);
  
  for (const statement of statements) {
    try {
      console.log('Executing:', statement.substring(0, 50) + '...');
      await connection.execute(statement);
      console.log('✓ Success');
    } catch (err: any) {
      if (err.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log('⚠ Table already exists, skipping');
      } else {
        console.error('✗ Error:', err.message);
      }
    }
  }
  
  await connection.end();
  console.log('Migration completed');
}

runMigration().catch(console.error);
