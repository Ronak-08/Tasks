import { writable } from 'svelte/store';
import { auth } from '$lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { browser } from '$app/environment';

import { syncTasksWithDb } from '$lib/taskStore.js';
import { syncNotes as syncNotesWithDb } from '$lib/noteStore.svelte.js'; 

export const user = writable(null);

let initialized = false;
export function initializeAuth() {
  if (!browser || initialized) return;
  initialized = true;

  console.log("Auth Initialized!");

  onAuthStateChanged(auth, async (firebaseUser) => {
    user.set(firebaseUser);

    if (firebaseUser) {
      console.log("User detected, triggering all syncs.");
      await syncTasksWithDb();
      await syncNotesWithDb();
    } else {
      console.log("User logged out.");
    }
  });
}
