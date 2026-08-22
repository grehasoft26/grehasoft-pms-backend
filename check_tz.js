const mysql = require('mysql2/promise');
async function main() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'grehasoft_dev'
  });
  await connection.execute("SET @@session.time_zone = '+11:00'");
  const [res] = await connection.execute("SELECT NOW(), UTC_TIMESTAMP(), @@session.time_zone");
  console.log(res);
  await connection.end();
}
main().catch(console.error);
