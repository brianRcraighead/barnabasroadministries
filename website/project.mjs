import fs from 'node:fs';
import path from 'node:path';
import {starterProject} from '../public/lib/site.js';
export function loadBuildProject(){const file=path.resolve(process.env.STUDIO_PROJECT_FILE||'website/project.json');return fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):starterProject();}
