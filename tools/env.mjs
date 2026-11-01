// 读取 .env.local（KEY=VALUE 每行一条），供本地服务与配音脚本共用。密钥只放在这里，不写进页面。
import {readFile} from 'node:fs/promises';
import path from 'node:path';

export async function loadEnv(root) {
  const env = {OPENAI_BASE_URL: 'https://api.openai-next.com/v1', ...process.env};
  try {
    for (const line of (await readFile(path.join(root, '.env.local'), 'utf8')).split('\n')) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
      if (m) env[m[1]] = m[2];
    }
  } catch {}
  if (!env.OPENAI_API_KEY) throw Error('缺少 OPENAI_API_KEY，请在 .env.local 中填写。');
  env.OPENAI_BASE_URL = env.OPENAI_BASE_URL.replace(/\/$/, '');
  return env;
}
