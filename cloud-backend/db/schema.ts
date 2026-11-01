import {sqliteTable,text,integer,index} from 'drizzle-orm/sqlite-core';
export const letters=sqliteTable('letters',{
 id:text('id').primaryKey(),ownerHash:text('owner_hash').notNull(),spot:text('spot').notNull(),name:text('name').notNull(),note:text('note').notNull(),photo:text('photo'),visibility:text('visibility').notNull(),status:text('status').notNull(),createdAt:text('created_at').notNull()
},t=>[index('letters_owner').on(t.ownerHash),index('letters_public').on(t.status,t.spot)]);
export const posterJobs=sqliteTable('poster_jobs',{
 id:text('id').primaryKey(),spot:text('spot').notNull(),status:text('status').notNull(),created:integer('created').notNull(),reference:text('reference'),error:text('error')
},t=>[index('poster_expiry').on(t.created)]);
export const quotas=sqliteTable('quotas',{key:text('key').primaryKey(),count:integer('count').notNull(),expires:integer('expires').notNull()});
