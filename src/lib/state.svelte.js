import { browser } from '$app/environment';
import { getFirebase } from '$lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, query, onSnapshot, orderBy, 
  addDoc, deleteDoc, doc, setDoc, serverTimestamp, updateDoc
} from 'firebase/firestore';
import { db as localDB } from '$lib/db';

class AppState {
  user = $state(null);
  tasks = $state([]);
  notes = $state([]);
  loading = $state(true);
  authLoading = $state(true);
  searchQuery = $state("");
  initialized = false;

  unsubs = [];

  async init() {
    if (this.initialized) return;
    this.initialized = true;

    await this.loadLocalData();

    const { auth, db } = await getFirebase();

    onAuthStateChanged(auth, async (u) => {
      this.user = u;
      this.authLoading = false;

      if (u) {
        await this.mergeLocalToCloud(db, u.uid);
        this.listenToCloud(db, u.uid);
      } else {
        this.loading = false;
      }
    });
  }

  async logout() {
    const { auth } = await getFirebase();
    this.unsubs.forEach(unsub => unsub());
    this.unsubs = [];

    await auth.signOut();
    this.tasks = [];
    this.notes = [];
    await this.loadLocalData();
    window.location.reload();
  }


  async loadLocalData() {
    if (!browser) return;
    const tasks = await localDB.tasks.orderBy('createdAt').reverse().toArray();
    const notes = await localDB.notes.orderBy('createdAt').reverse().toArray();

    if (!this.user) {
      this.tasks = tasks;
      this.notes = notes;
    }
    this.loading = false;
  }

  listenToCloud(db, uid) {
    this.unsubs.forEach(unsub => unsub());
    this.unsubs = [];

    const qTasks = query(collection(db, 'users', uid, 'tasks'), orderBy('createdAt', 'desc'));
    const unsubTasks = onSnapshot(qTasks, (snap) => {
      this.tasks = snap.docs.map(d => {
        const data = d.data();
        return { id: d.id, ...data, title: data.title || "" }; 
      });
      this.loading = false;
    });

    const qNotes = query(collection(db, 'users', uid, 'notes'), orderBy('createdAt', 'desc'));
    const unsubNotes = onSnapshot(qNotes, (snap) => {
      this.notes = snap.docs.map(d => {
        const data = d.data();
        return { id: d.id, ...data, title: data.title || "" }; 
      });
      this.loading = false;
    });

    this.unsubs.push(unsubTasks, unsubNotes);
  }

  async mergeLocalToCloud(db, uid) {
    const localTasks = await localDB.tasks.toArray();
    const localNotes = await localDB.notes.toArray();

    if (localTasks.length === 0 && localNotes.length === 0) return;


    const batchPromises = [];
    for (const task of localTasks) {
      const { id, ...data } = task; 
      const docId = String(id); 
      const taskRef = doc(db, 'users', uid, 'tasks', docId);
      batchPromises.push(setDoc(taskRef, {
        ...data,
        createdAt: data.createdAt || serverTimestamp() 
      }, { merge: true })); // <--- PREVENTS ERRORS
    }
    for (const note of localNotes) {
      const { id, ...data } = note;
      const docId = String(id); // Important!

      const noteRef = doc(db, 'users', uid, 'notes', docId);
      batchPromises.push(setDoc(noteRef, {
        ...data,
        createdAt: data.createdAt || serverTimestamp()
      }, { merge: true }));
    }

    try {
      await Promise.all(batchPromises);
      await localDB.tasks.clear();
      await localDB.notes.clear();
    } catch (error) {
      console.error("Sync failed:", error);
    }
  }


  async addTask(taskData) {
    const payload = {
      ...taskData,
      createdAt: new Date(), 
      completed: false
    };

    if (this.user) {
      const { db } = await getFirebase();
      await addDoc(collection(db, 'users', this.user.uid, 'tasks'), {
        ...payload,
        createdAt: serverTimestamp()
      });
    } else {
      const id = await localDB.tasks.add(payload);
      this.tasks = [{ ...payload, id }, ...this.tasks];
    }
  }

  async updateTask(task) {
    const { id, ...updates } = task;

    if (this.user) {
      const { db } = await getFirebase();
      const taskRef = doc(db, 'users', this.user.uid, 'tasks', id);
      await updateDoc(taskRef, updates);
    } else {
      await localDB.tasks.update(id,updates);
      this.tasks = this.tasks.map(t => 
        t.id === id ? { ...t, ...updates } : t
      );
    }
  }

  async toggleTask(task) {
    if (this.user) {
      const { db } = await getFirebase();
      const ref = doc(db, 'users', this.user.uid, 'tasks', task.id);
      await updateDoc(ref, { completed: !task.completed });
    } else {
      await localDB.tasks.update(task.id, { completed: !task.completed });
      const index = this.tasks.findIndex(t => t.id === task.id);
      if (index !== -1) {
        this.tasks[index].completed = !this.tasks[index].completed;
      }
    }
  }

  async deleteTask(id) {
    if (this.user) {
      const { db } = await getFirebase();
      await deleteDoc(doc(db, 'users', this.user.uid, 'tasks', id));
    } else {
      await localDB.tasks.delete(id);
      this.tasks = this.tasks.filter(t => t.id !== id);
    }
  }

  async addNote(parentId = null) {
    const payload = {
      title: "", 
      content: "",
      tags: [],
      parentId, 
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (this.user) {
      const { db } = await getFirebase();
      const docRef = await addDoc(collection(db, 'users', this.user.uid, 'notes'), {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } else {
      const id = crypto.randomUUID();
      await localDB.notes.add({ ...payload, id });
      this.notes = [{ ...payload, id }, ...this.notes];
      return id;
    }
  }

  async updateNote(id, data) {
    if (this.user) {
      const { db } = await getFirebase();
      await updateDoc(doc(db, 'users', this.user.uid, 'notes', id), { 
        ...data, 
        updatedAt: serverTimestamp() 
      });
    } else {
      await localDB.notes.update(id, { ...data, updatedAt: new Date().toISOString() });
      this.notes = this.notes.map(n => n.id === id ? { ...n, ...data } : n);
    }
  }

  async deleteNote(id) {
    if (this.user) {
      const { db } = await getFirebase();
      await deleteDoc(doc(db, 'users', this.user.uid, 'notes', id));
    } else {
      await localDB.notes.delete(id);
      this.notes = this.notes.filter(n => n.id !== id);
    }
  }

}
export const appState = new AppState();
