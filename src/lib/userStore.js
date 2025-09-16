import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { getFirebase } from '$lib/firebase.js';

import { syncTasksWithDb } from '$lib/taskStore.svelte.js';
import { syncNotes as syncNotesWithDb } from '$lib/noteStore.svelte.js';

export const user = writable(null);

let initialized = false;

export async function initializeAuth() {
  if (!browser || initialized) return;
  initialized = true;


  try {
    const { auth } = await getFirebase();
    const { onAuthStateChanged } = await import('firebase/auth');

    onAuthStateChanged(auth, async (firebaseUser) => {
      user.set(firebaseUser);

      if (firebaseUser) {
        await syncTasksWithDb();
        await syncNotesWithDb();
      } else {
      }
    });
  } catch (error) {
    console.error("Failed to initialize Firebase Auth listener:", error);
  }
}
