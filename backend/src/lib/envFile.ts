import fs from 'fs';
import path from 'path';

const ENV_PATH = path.resolve(__dirname, '../../.env');

// Updates a single variable in the .env file (adding it if missing) and
// applies it to the running process immediately — no restart needed.
export function setEnvVar(key: string, value: string) {
  let content = '';
  try {
    content = fs.readFileSync(ENV_PATH, 'utf-8');
  } catch {
    content = '';
  }

  const lines = content.length > 0 ? content.split('\n') : [];
  const pattern = new RegExp(`^${key}=`);
  let found = false;

  const updatedLines = lines.map((line) => {
    if (pattern.test(line)) {
      found = true;
      return `${key}=${value}`;
    }
    return line;
  });

  if (!found) {
    updatedLines.push(`${key}=${value}`);
  }

  fs.writeFileSync(ENV_PATH, updatedLines.join('\n').replace(/\n*$/, '\n'));
  process.env[key] = value;
}
