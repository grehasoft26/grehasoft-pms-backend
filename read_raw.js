const mysql = require('mysql2/promise');
async function main() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'grehasoft_dev'
  });
  const [res] = await connection.execute("SELECT startTime, updatedAt, @@global.time_zone, @@session.time_zone FROM work_sessions WHERE userId = '557b9ee5-6fdc-4ad2-a661-0f53f92e79f5' ORDER BY startTime DESC LIMIT 1");
  console.log('Raw Database values:', res);
  await connection.end();
}
main().catch(console.error);
