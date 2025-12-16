import Dexie from 'dexie';

export const db = new Dexie('MyBrainLocalDB');

db.version(1).stores({
  tasks: '++id, title, completed, createdAt', 
  notes: '++id, title, content, createdAt' 
});
