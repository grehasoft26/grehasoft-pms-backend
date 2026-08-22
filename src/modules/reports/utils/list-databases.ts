import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as fs from 'fs';
import * as path from 'path';
import * as mariadb from 'mariadb';

const envPath = path.resolve(__dirname, '../../../../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^\s*([^#\s=]+)\s*=\s*(.*)$/);
    if (match) {
      const key = match[1];
      let val = match[2].trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1);
      }
      process.env[key] = val;
    }
  }
}

function parseDatabaseUrl(url: string) {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port, 10) : 3306,
      user: parsed.username,
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace(/^\//, ''),
    };
  } catch (e) {
    const regex = /^mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/;
    const match = url.match(regex);
    if (!match) throw new Error('Invalid DATABASE_URL format');
    return {
      user: match[1],
      password: decodeURIComponent(match[2]),
      host: match[3],
      port: parseInt(match[4], 10),
      database: match[5],
    };
  }
}

const dbUrl = process.env.DATABASE_URL || '';
const dbConfig = parseDatabaseUrl(dbUrl);

async function main() {
  const conn = await mariadb.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
  });

  const databases = await conn.query('SHOW DATABASES');
  console.log('Databases on MySQL server:', databases);

  for (const dbRow of databases) {
    const dbName = dbRow.Database;
    if (
      dbName === 'information_schema' ||
      dbName === 'performance_schema' ||
      dbName === 'mysql' ||
      dbName === 'sys'
    ) {
      continue;
    }

    try {
      console.log(`\nChecking database: ${dbName}...`);
      await conn.query(`USE \`${dbName}\``);
      const tables = await conn.query('SHOW TABLES');
      const hasUserTable = tables.some((t: any) =>
        Object.values(t).some((val) => String(val).toLowerCase() === 'user'),
      );

      if (hasUserTable) {
        const users = await conn.query(
          'SELECT id, email, firstName, lastName FROM User',
        );
        console.log(`Users in ${dbName}:`, users);
      } else {
        console.log(`No User table found in ${dbName}`);
      }
    } catch (err: any) {
      console.log(`Error checking database ${dbName}: ${err.message}`);
    }
  }

  await conn.end();
}

main();
