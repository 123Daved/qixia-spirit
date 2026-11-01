import {DatabaseSync} from 'node:sqlite';
import {mkdirSync} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),dir=path.join(root,'.data');mkdirSync(dir,{recursive:true,mode:0o700});
export const db=new DatabaseSync(process.env.QIXIA_LETTERS_DB || path.join(dir,'letters.sqlite'));
db.exec(`PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS letters (id TEXT PRIMARY KEY, owner_hash TEXT NOT NULL, spot TEXT NOT NULL, name TEXT NOT NULL, note TEXT NOT NULL, photo TEXT, visibility TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL); CREATE INDEX IF NOT EXISTS letters_public ON letters(status,spot,created_at);`);
const spots=new Set(['lake','stele','palace','tea','cave','stone','maple','spring']);
const hash=x=>createHash('sha256').update(x).digest('hex');
function ownerToken(value){if(typeof value!=='string'||!/^[a-f0-9]{64}$/.test(value))throw Error('无效的个人凭证');return hash(value)}
const item=r=>({id:r.id,spot:r.spot,name:r.name,note:r.note,photo:r.photo,visibility:r.visibility,status:r.status,createdAt:r.created_at});
export function createLetter(body){
 const owner=ownerToken(body.owner),spot=body.spot,name=String(body.name||'').trim(),note=String(body.note||'').trim(),photo=body.photo||null,visibility=body.visibility;
 if(!spots.has(spot)||!['private','public'].includes(visibility)||!note||note.length>240||name.length>24)throw Error('请填写有效的景点和留言');
 if(photo){if(typeof photo!=='string'||photo.length>1200000||!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(photo))throw Error('照片格式或大小不符合要求');const bytes=Buffer.from(photo.split(',')[1],'base64');if(bytes[0]!==255||bytes[1]!==216||bytes[2]!==255)throw Error('照片格式不符合要求')}
 const id=randomUUID(),createdAt=new Date().toISOString(),status=visibility==='public'?'pending':'private';
 db.prepare('INSERT INTO letters VALUES (?,?,?,?,?,?,?,?,?)').run(id,owner,spot,name||'一位旅人',note,photo,visibility,status,createdAt);return {id,status,createdAt};
}
export function publicLetters(spot){if(spot&&!spots.has(spot))throw Error('景点不存在');return (spot?db.prepare("SELECT * FROM letters WHERE status='approved' AND spot=? ORDER BY created_at DESC LIMIT 200").all(spot):db.prepare("SELECT * FROM letters WHERE status='approved' ORDER BY created_at DESC LIMIT 200").all()).map(item)}
export function myLetters(owner){return db.prepare('SELECT * FROM letters WHERE owner_hash=? ORDER BY created_at DESC LIMIT 200').all(ownerToken(owner)).map(item)}
export function deleteLetter(id,owner){return db.prepare('DELETE FROM letters WHERE id=? AND owner_hash=?').run(id,ownerToken(owner)).changes>0}
export function reportLetter(id){return db.prepare("UPDATE letters SET status='pending' WHERE id=? AND status='approved'").run(id).changes>0}

export function pendingLetters(){return db.prepare("SELECT * FROM letters WHERE status='pending' ORDER BY created_at LIMIT 200").all().map(item)}
export function reviewLetter(id,decision){if(!['approve','reject'].includes(decision))throw Error('审核操作无效');return db.prepare("UPDATE letters SET status=? WHERE id=? AND status='pending'").run(decision==='approve'?'approved':'rejected',id).changes>0}

// Publish only a private letter owned by this browser; never bypass moderation.
export function publishLetter(id,owner){return db.prepare("UPDATE letters SET visibility='public', status='pending' WHERE id=? AND owner_hash=? AND status='private'").run(id,ownerToken(owner)).changes>0}
