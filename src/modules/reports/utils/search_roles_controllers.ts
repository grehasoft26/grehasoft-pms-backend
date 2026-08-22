import * as fs from 'fs';
import * as path from 'path';

function searchDir(dir: string, target: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      searchDir(filePath, target);
    } else if (file.endsWith('.ts')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.toLowerCase().includes(target.toLowerCase())) {
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].toLowerCase().includes(target.toLowerCase())) {
            console.log(
              `File: ${path.relative(path.resolve(__dirname, '../../../'), filePath)}, Line ${i + 1}: ${lines[i].trim().substring(0, 200)}`,
            );
          }
        }
      }
    }
  }
}

const backendSrc = path.resolve(__dirname, '../../');
searchDir(backendSrc, 'Super Admin');
searchDir(backendSrc, 'RoleGuard');
searchDir(backendSrc, '@Roles(');
