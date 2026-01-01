import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { db, auth } from '$lib/firebase'; 
import { db as localDB } from '$lib/db';

import { 
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';
import { 
  collection, query, onSnapshot, orderBy, 
  doc, serverTimestamp, writeBatch, 
  addDoc, updateDoc, deleteDoc
} from 'firebase/firestore';

const normalizeData = (doc) => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
    title: data.title || ""
  };
};

class AppState {
  user = $state(null);
  tasks = $state([]);
  notes = $state([]);

  loading = $state(true); 
  authLoading = $state(true); 
  showModal = $state(false);
  searchQuery = $state("");

  initialized = false;
  unsubs = [];

  constructor() {
    this.init();
  }


  async init() {
    if (this.initialized || !browser) return;
    this.initialized = true;

    await this.loadLocalData();

    onAuthStateChanged(auth, async (u) => {
      this.user = u;
      this.authLoading = false;

      if (u) {
        this.loading = true; 
        await this.syncLocalToCloud(u.uid);
        this.listenToCloud(u.uid);
      } else {
        this.loading = false;
      }
    });
  }

  async restoreBackup(data) {
    this.loading = true;
    const { tasks = [], notes = [] } = data;

    this.tasks = tasks;
    this.notes = notes;

    try {
      if (this.user) {
        const { db } = await import('$lib/firebase'); // Ensure we have the instance
        const batch = writeBatch(db);

        tasks.forEach(task => {
          const ref = doc(db, 'users', this.user.uid, 'tasks', task.id);
          batch.set(ref, task, { merge: true });
        });

        notes.forEach(note => {
          const ref = doc(db, 'users', this.user.uid, 'notes', note.id);
          batch.set(ref, note, { merge: true });
        });

        await batch.commit();
        console.log("Restored to Cloud");

      } else {
        await localDB.transaction('rw', localDB.tasks, localDB.notes, async () => {
          if (tasks.length) await localDB.tasks.bulkPut(tasks);
          if (notes.length) await localDB.notes.bulkPut(notes);
        });

        console.log("Restored to Local Dexie DB");
      }
    } catch (err) {
      console.error("Import failed:", err);
      alert("Failed to save backup to database.");
    } finally {
      this.loading = false;
    }
  }

  async logout() {
    this.cleanupListeners();

    await signOut(auth);

    this.tasks = [];
    this.notes = [];
    this.user = null;

    await this.loadLocalData();

    window.location.reload(); 
    goto('/'); 
  }

  cleanupListeners() {
    this.unsubs.forEach(unsub => unsub());
    this.unsubs = [];
  }


  async loadLocalData() {
    try {
      const [localTasks, localNotes] = await Promise.all([
        localDB.tasks.orderBy('createdAt').reverse().toArray(),
        localDB.notes.orderBy('createdAt').reverse().toArray()
      ]);

      if (!this.user) {
        this.tasks = localTasks;
        this.notes = localNotes;
      }
    } catch (err) {
      console.error("Local load failed", err);
    } finally {
      this.loading = false;
    }
  }

  listenToCloud(uid) {
    this.cleanupListeners();

    const qTasks = query(collection(db, 'users', uid, 'tasks'), orderBy('createdAt', 'desc'));
    const unsubTasks = onSnapshot(qTasks, (snap) => {
      this.tasks = snap.docs.map(normalizeData);
    });

    const qNotes = query(collection(db, 'users', uid, 'notes'), orderBy('createdAt', 'desc'));
    const unsubNotes = onSnapshot(qNotes, (snap) => {
      this.notes = snap.docs.map(normalizeData);
      this.loading = false; 
    });

    this.unsubs.push(unsubTasks, unsubNotes);
  }


  async syncLocalToCloud(uid) {
    const localTasks = await localDB.tasks.toArray();
    const localNotes = await localDB.notes.toArray();

    if (localTasks.length === 0 && localNotes.length === 0) return;

    const batch = writeBatch(db);

    localTasks.forEach(task => {
      const { id, ...data } = task; 
      const ref = doc(collection(db, 'users', uid, 'tasks')); 
      batch.set(ref, { 
        ...data, 
        createdAt: data.createdAt ? new Date(data.createdAt) : serverTimestamp() 
      });
    });

    localNotes.forEach(note => {
      const { id, ...data } = note;
      const ref = doc(collection(db, 'users', uid, 'notes'));
      batch.set(ref, { 
        ...data, 
        createdAt: data.createdAt ? new Date(data.createdAt) : serverTimestamp() 
      });
    });

    try {
      await batch.commit();
      await Promise.all([localDB.tasks.clear(), localDB.notes.clear()]);
      console.log("Sync successful");
    } catch (error) {
      console.error("Sync failed:", error);
    }
  }


  async handleAction(path) {
    if(path === '/') {
      this.showModal = !this.showModal;
    } else if(path.startsWith('/notes')) {
      const newId = await this.addNote(null);
      goto(`/notes/${newId}`);
    } 
  }

  async addTask(taskData) {
    const tempId = crypto.randomUUID();
    const payload = {
      ...taskData,
      id: tempId, 
      createdAt: new Date().toISOString(),
      completed: false
    };

    this.tasks = [payload, ...this.tasks];

    try {
      if (this.user) {
        const { id, ...cleanPayload } = payload;
        await addDoc(collection(db, 'users', this.user.uid, 'tasks'), {
          ...cleanPayload,
          createdAt: serverTimestamp() 
        });
      } else {
        const id = await localDB.tasks.add(payload);
        this.tasks[0].id = id; 
      }
    } catch (err) {
      console.error("Add Task Failed", err);
      this.tasks = this.tasks.filter(t => t.id !== tempId);
    }
  }

  async toggleTask(task) {
    const originalStatus = task.completed;
    task.completed = !task.completed; 

    try {
      if (this.user) {
        const ref = doc(db, 'users', this.user.uid, 'tasks', task.id);
        await updateDoc(ref, { completed: task.completed });
      } else {
        await localDB.tasks.update(task.id, { completed: task.completed });
      }
    } catch (err) {
      console.error("Toggle failed", err);
      task.completed = originalStatus; 
    }
  }

  async deleteTask(id) {
    const previousTasks = this.tasks;
    this.tasks = this.tasks.filter(t => t.id !== id);

    try {
      if (this.user) {
        await deleteDoc(doc(db, 'users', this.user.uid, 'tasks', id));
      } else {
        await localDB.tasks.delete(id);
      }
    } catch (err) {
      console.error("Delete failed", err);
      this.tasks = previousTasks; // Revert
    }
  }

  async updateTask(task) {
    const { id, ...updates } = task;

    const idx = this.tasks.findIndex(t => t.id === id);
    if (idx === -1) return;
    const oldData = { ...this.tasks[idx] };

    Object.assign(this.tasks[idx], updates);

    try {
      if (this.user) {
        const ref = doc(db, 'users', this.user.uid, 'tasks', id);
        await updateDoc(ref, updates);
      } else {
        await localDB.tasks.update(id, updates);
      }
    } catch (err) {
      Object.assign(this.tasks[idx], oldData); 
    }
  }

  async addNote(parentId = null) {
    const tempId = crypto.randomUUID();
    const payload = {
      id: tempId,
      title: "", 
      content: "",
      tags: [],
      parentId, 
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.notes = [payload, ...this.notes];

    try {
      if (this.user) {
        const { id, ...cleanData } = payload;
        const ref = await addDoc(collection(db, 'users', this.user.uid, 'notes'), {
          ...cleanData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        return ref.id; 
      } else {
        await localDB.notes.add(payload);
        return tempId;
      }
    } catch (err) {
      console.error("Add Note Failed", err);
      this.notes = this.notes.filter(n => n.id !== tempId);
      return null;
    }
  }

  async updateNote(id, data) {
    const idx = this.notes.findIndex(n => n.id === id);
    if (idx === -1) return;

    const oldNote = { ...this.notes[idx] };

    const updates = { 
      ...data, 
      updatedAt: new Date().toISOString() 
    };

    Object.assign(this.notes[idx], updates);

    try {
      if (this.user) {
        const noteRef = doc(db, 'users', this.user.uid, 'notes', id);
        await updateDoc(noteRef, { 
          ...data, 
          updatedAt: serverTimestamp() 
        });
      } else {
        await localDB.notes.update(id, updates);
      }
    } catch (err) {
      console.error("Update Note Failed", err);
      Object.assign(this.notes[idx], oldNote);
    }
  }

  async deleteNote(id) {
    const previousNotes = this.notes;

    this.notes = this.notes.filter(n => n.id !== id);

    try {
      if (this.user) {
        const noteRef = doc(db, 'users', this.user.uid, 'notes', id);
        await deleteDoc(noteRef);
      } else {
        await localDB.notes.delete(id);
      }
    } catch (err) {
      console.error("Delete Note Failed", err);
      this.notes = previousNotes;
    }
  }
}

export const appState = new AppState();
