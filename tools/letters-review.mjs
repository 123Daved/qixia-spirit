// 本机审核：node tools/letters-review.mjs list | approve <id> | reject <id>
import {db} from './letters-db.mjs';import {mkdirSync,writeFileSync,rmSync} from 'node:fs';import path from 'node:path';
const [action,id]=process.argv.slice(2);
if(action==='list'){
 const rows=db.prepare("SELECT id,spot,name,note,photo,created_at FROM letters WHERE status='pending' ORDER BY created_at").all();
 const folder=path.resolve('.data/review');mkdirSync(folder,{recursive:true,mode:0o700});
 for(const r of rows){console.log(`${r.id}\n景点: ${r.spot}  昵称: ${r.name}  时间: ${r.created_at}\n${r.note}`);if(r.photo){const file=path.join(folder,`${r.id}.jpg`);writeFileSync(file,Buffer.from(r.photo.split(',')[1],'base64'),{mode:0o600});console.log(`照片: ${file}`)}console.log('')}
 console.log(`待审核 ${rows.length} 条。请检查文字与照片，再运行 approve <id> 或 reject <id>。`);
}else if(['approve','reject'].includes(action)&&id){const status=action==='approve'?'approved':'rejected';const result=db.prepare("UPDATE letters SET status=? WHERE id=? AND status='pending'").run(status,id);if(result.changes)rmSync(path.resolve('.data/review',`${id}.jpg`),{force:true});console.log(result.changes?'已更新审核状态。':'未找到待审核来信。');if(!result.changes)process.exitCode=1}
else{console.log('用法: node tools/letters-review.mjs list | approve <id> | reject <id>');process.exitCode=1}
