import { browser } from "$app/environment";
import {user} from '$lib/userStore.js';
// import { setDoc,query,getDocs,doc,collection, updateDoc, writeBatch,deleteDoc } from "firebase/firestore";
import { get } from "svelte/store";
// import { db } from "./firebase";
import { getFirebase } from "$lib/firebase.js";


export const notes = $state([]);
export const searchQuery = $state({ query: "" });

const saveNotes = () => {
  if (!browser) return;
  localStorage.setItem("notes", JSON.stringify(notes));
}

export const loadNotes = () => {
  if (!browser) return;
  const savedNotes = JSON.parse(localStorage.getItem("notes") || "[]");

  notes.splice(0, notes.length, ...savedNotes);
};

export const clearNotes = () => {
  notes.length = 0;
  if (browser) {
    localStorage.removeItem('notes');
    localStorage.removeItem('lastSyncTimestamp');
  }
}

// --------------------------------

export function filteredNotes() {
  const term = searchQuery.query.trim().toLowerCase();
  if (!term) return notes;

  return notes.filter(note => {
    const title = (note.title || "").toLowerCase();
    const content = (note.content || "").toLowerCase();
    return title.includes(term) || content.includes(term);
  });
}

const savePendingChanges = (change) => {
  if (!browser) return;
  const pendingChanges = JSON.parse(localStorage.getItem("pending") || "[]");
  pendingChanges.push(change);
  localStorage.setItem("pending", JSON.stringify(pendingChanges));
  
};

// --------------------------------

export const addNote = async (title,content) => {
  const { db } = await getFirebase();
  const { doc,setDoc } = await import('firebase/firestore');

  const newNote = {
    title,
    content,
    id: crypto.randomUUID(),
    updatedAt: Date.now(),
  }
  notes.push(newNote);
  saveNotes();
  const currentUser = get(user);
  if(currentUser) {
    try {
      const noteRef = doc(db, 'users', currentUser.uid, 'notes', newNote.id);
      await setDoc(noteRef, newNote);
    } catch (error) {
      savePendingChanges({type: 'add', payload: newNote});
    }
  }   
}

// --------------------------------

export const updateNote = async (id, title, content) => {
  const index = notes.findIndex(note => note.id === id);
  if (index === -1) return;
  const updatedFields = {
    title,
    content,
    updatedAt: Date.now()
  };

  notes[index] = { ...notes[index], ...updatedFields };
  saveNotes();
  const { db } = await getFirebase();
  const { doc,updateDoc } = await import('firebase/firestore');

  
  const currentUser = get(user);
  if (currentUser) {
    try {
      const noteRef = doc(db, 'users', currentUser.uid, 'notes', id);
      await updateDoc(noteRef, updatedFields); 
    } catch (error) {
      console.error('Update failed, queueing:', error);
      savePendingChanges({
        type: "update",
        payload: { id, ...updatedFields }
      });
    }
  }
};

// --------------------------------

export const deleteNote = async (id) => {
  const index = notes.findIndex(note => note.id === id);
  if (index !== -1) {
    notes.splice(index, 1);
    saveNotes();
  }
  const currentUser = get(user);
  const { db } = await getFirebase();
  const { doc,deleteDoc } = await import('firebase/firestore');


  if (currentUser) {
    try { 
      const noteRef = doc(db, 'users', currentUser.uid, 'notes', id);
      deleteDoc(noteRef);
    } catch (err) {
      console.error("Server delete failed: ", err);
      savePendingChanges({type: 'delete', payload: {id: id}});
    };
  }
}

export const deleteMultipleNotes = async (idsToDelete) => {
  const newNotes = notes.filter(note => !idsToDelete.includes(note.id));
  notes.splice(0, notes.length, ...newNotes);
  saveNotes();

  const { db } = await getFirebase();
  const { doc,writeBatch } = await import('firebase/firestore');

  const currentUser = get(user);
  if (currentUser) {
    try {
      const batch = writeBatch(db);
      idsToDelete.forEach(id => {
        const noteRef = doc(db, 'users', currentUser.uid, 'notes', id);
        batch.delete(noteRef);
      });
      await batch.commit();
    } catch (e) {
        savePendingChanges({ type: 'deletes', payload: { id: idsToDelete } });
    }
  }
};


// --------------------------------


export const syncNotes = async () => {
  const currentUser = get(user);
  const { db } = await getFirebase();
  const { doc,writeBatch,getDocs,collection } = await import('firebase/firestore');

  if (!navigator.onLine || !currentUser) {
    return; 
  }
  const pendingChanges = JSON.parse(localStorage.getItem("pending") || "[]");
  if (pendingChanges.length > 0) {
    const batch = writeBatch(db);

    pendingChanges.forEach(change => {
      if (change.type === 'add' || change.type === 'update') {
        const noteRef = doc(db, 'users', currentUser.uid, 'notes', change.payload.id);
        batch.set(noteRef, change.payload, { merge: true });
      } else if (change.type === 'delete') {
        const noteRef = doc(db, 'users', currentUser.uid, 'notes', change.payload.id);
        batch.delete(noteRef);
      } else if (change.type === 'deletes') {
        change.payload.ids.forEach(id => {
          const noteRef = doc(db, 'users', currentUser.uid, 'notes', id);
          batch.delete(noteRef);
        });
      }
    });

    try {
      await batch.commit();
      localStorage.removeItem("pending");
    } catch (error) {
      console.error("Failed to push pending changes. Aborting sync.", error);
      return; 
    }
  }

try {
  const snap = await getDocs(collection(db, "users", currentUser.uid, "notes"));
  const remoteNotes = snap.docs.map(d => ({ ...d.data(), id: d.id })); 
  
  const remoteMap = new Map();
  remoteNotes.forEach(note => remoteMap.set(note.id, note));
  
  const localIds = new Set(notes.map(note => note.id));
  const mergedNotes = notes.map(note => 
    remoteMap.has(note.id) ? remoteMap.get(note.id) : note
  );
  remoteNotes.forEach(remoteNote => {
    if (!localIds.has(remoteNote.id)) {
      mergedNotes.push(remoteNote);
    }
  });
  notes.splice(0, notes.length, ...mergedNotes);
  saveNotes();
} catch (e) {
  console.error("Failed to sync notes:", e);
}};
