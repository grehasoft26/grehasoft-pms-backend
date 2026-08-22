import * as fs from 'fs';
import * as path from 'path';

const controllerPath = path.resolve(__dirname, '../../auth/auth.controller.ts');
const content = fs.readFileSync(controllerPath, 'utf8');
console.log(content.substring(0, 10000));
