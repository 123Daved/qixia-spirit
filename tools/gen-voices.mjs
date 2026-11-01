// 预生成精灵配音：读取 assets/voices/scripts.js，调用 qwen3-tts-flash，转码为 m4a。
// 用法：node tools/gen-voices.mjs            （已存在的文件会跳过）
//      node tools/gen-voices.mjs --force    （全部重新生成）
//      node tools/gen-voices.mjs lake-intro （只生成指定条目，可写多个）
import {readFile, writeFile, mkdir, access, rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {loadEnv} from './env.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = await loadEnv(root);
const outDir = path.join(root, 'assets/voices');
const src = await readFile(path.join(outDir, 'scripts.js'), 'utf8');
const data = JSON.parse(src.slice(src.indexOf('{'), src.lastIndexOf('}') + 1));
const args = process.argv.slice(2), force = args.includes('--force'), only = args.filter(a => !a.startsWith('--'));

const guideSource = await readFile(path.join(root, 'assets/js/guides.js'), 'utf8');
const context = {window: {}};
vm.runInNewContext(guideSource, context, {timeout: 1000});
const jobs = [{id:'guide-welcome-v1',voice:'Cherry',text:data.guideWelcome},{id:'guide-greet',voice:'Cherry',text:'你好，我是小霞，栖霞山的旅行助手。想看红叶、逛古迹，还是先看看观光车？告诉我你的时间和同行的人，我陪你慢慢走。'},{id:'guide-plan',voice:'Cherry',text:'如果有半天，可以先在明镜湖看看倒影，再到明征君碑、栖霞寺和千佛岩，最后按体力选择红叶谷。观光车和开放情况请以现场为准。你更喜欢人文故事还是自然风景？'}];
jobs.push(...Object.entries(context.window.QIXIA_GUIDES).map(([spot, guide]) => ({id: `${spot}-full`, voice: data.voices[spot], text: guide.text})));
for (const [spot, {clips}] of Object.entries(data.spots))
  for (const [clip, text] of Object.entries(clips)) jobs.push({id: `${spot}-${clip}`, voice: data.voices[spot], text});
for (const s of data.stations) jobs.push({id: `bus-${s.id}`, voice: data.voices.bus, text: s.text});
// 地图介绍复用同一份文案，避免文字与录音不一致。
const mapSource = await readFile(path.join(root, 'assets/js/visitor-map.js'), 'utf8');
const mapBlock = mapSource.match(/const points=\[([\s\S]*?)\];\nconst card=/);
if (!mapBlock) throw Error('无法读取地图讲解文案');
const mapPoints = vm.runInNewContext('[' + mapBlock[1] + ']', {}, {timeout: 1000});
for (const p of mapPoints) if (!p.audio) jobs.push({id: `map-${p.id}`, voice:'Cherry', text:p.name + '。' + p.text});


// 接口返回的是流式 WAV，头部长度字段为占位值，转码前按实际长度修正
function fixWav(buf) {
  const dataAt = buf.indexOf('data', 12);
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || dataAt < 0) return buf;
  buf.writeUInt32LE(buf.length - 8, 4);
  buf.writeUInt32LE(buf.length - dataAt - 8, dataAt + 4);
  return buf;
}

async function tts(job, tries = 5) {
  for (let i = 0; i < tries; i++) {
    const r = await fetch(`${env.OPENAI_BASE_URL}/audio/speech`, {
      method: 'POST',
      signal: AbortSignal.timeout(30000),
      headers: {Authorization: `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({model: env.TTS_MODEL || 'qwen3-tts-flash', voice: job.voice, input: job.text, response_format: 'wav'})
    });
    if (r.ok) return Buffer.from(await r.arrayBuffer());
    if (r.status !== 429 && r.status < 500) throw Error(`${r.status} ${await r.text()}`);
    await new Promise(res => setTimeout(res, 2000 * (i + 1)));
  }
  throw Error('多次重试仍失败');
}

await mkdir(outDir, {recursive: true});
let made = 0, failed = 0;
for (const job of jobs) {
  if (only.length && !only.includes(job.id)) continue;
  const out = path.join(outDir, `${job.id}.m4a`);
  if (!force && !only.length && await access(out).then(() => true, () => false)) continue;
  const wav = path.join(tmpdir(), `qixia-${job.id}.wav`);
  try {
    await writeFile(wav, fixWav(await tts(job)));
    execFileSync('afconvert', ['-f', 'm4af', '-d', 'aac', '-b', '48000', '-c', '1', wav, out]);
    made++;
    console.log('✓', job.id, job.voice);
  } catch (e) {
    failed++; console.error('✗', job.id, e.message);
  } finally {
    await rm(wav, {force: true});
  }
}
console.log(`完成：本次生成 ${made} 条，共 ${jobs.length} 条脚本。`);

if (failed) process.exitCode = 1;
