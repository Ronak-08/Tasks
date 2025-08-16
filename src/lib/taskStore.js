import { writable, get, derived } from 'svelte/store';
import { browser } from '$app/environment';
import {user} from '$lib/userStore.js';
import { getFirebase } from "$lib/firebase.js";
export const tasks = writable([]);
let pendingDeletions = [];
export let searchQuery = writable("");

export const filteredTasks = derived(
  [tasks, searchQuery],
  ([$tasks, $search]) => {
    let filtered;
    if (!$search.trim()) {
      filtered = $tasks || [];
    } else {
      const searchTerm = $search.toLowerCase();
      if (!Array.isArray($tasks)) {
        filtered = [];
      } else {
        filtered = $tasks.filter(task => {
          return task && typeof task.task === 'string' && task.task.toLowerCase().includes(searchTerm);
        });
      }
    }
    return filtered.sort((a, b) => {
      const isAHigh = a.priority === 'High';
      const isBHigh = b.priority === 'High';
      return isBHigh - isAHigh;
    });
  }
);

export const filteredOngoing = derived(filteredTasks, $filtered =>
  $filtered.filter(t => !t.completed)
);

export const filteredCompleted = derived(filteredTasks, $filtered =>
  $filtered.filter(t => t.completed)
);

export function updateTask(updatedTask) {
  tasks.update(current => {
    return current.map(task =>
      task.id === updatedTask.id ? updatedTask : task
    );
  });
  saveToLocalStorage()
}

let localSaveTimeout;
export function saveToLocalStorage(delay = 250) {
  if (!browser) return;
  clearTimeout(localSaveTimeout);
  localSaveTimeout = setTimeout(() => {
    let currentTasks = get(tasks);
    const data = localStorage.setItem("tasks", JSON.stringify(currentTasks));
  }, delay);
}

export function loadTasks() {
  if (!browser) return;
  
  const localTasks = JSON.parse(localStorage.getItem("tasks") || "[]");
  tasks.set(localTasks);
  
  const localDeletions = JSON.parse(localStorage.getItem("pendingDeletions") || "[]");
  pendingDeletions = localDeletions;
}

function savePendingDeletions() {
  localStorage.setItem('pendingDeletions', JSON.stringify(pendingDeletions));
}

export async function deleteTask(task) {
  if (!browser) return;
  tasks.update(current => current.filter(t =>
    t.id !== task.id))
  if (!pendingDeletions.includes(task.id)) {
    pendingDeletions.push(task.id);
    savePendingDeletions();
  }
  saveToLocalStorage();
}

export async function processPendingDeletions() {
  const cUser = get(user);
  const { db } = await getFirebase();
    const { doc,writeBatch } = await import('firebase/firestore');
  if (!cUser || pendingDeletions.length < 10) return;

  let batchDeletions = [];

  try {
    let batch = writeBatch(db);
    const maxBatchSize = 500;

    while (pendingDeletions.length > 0) {
      batchDeletions = pendingDeletions.splice(0, maxBatchSize);

      batchDeletions.forEach(taskId => {
        const taskRef = doc(db, 'users', cUser.uid, 'tasks', taskId);
        batch.delete(taskRef);
      });

      await batch.commit();
      batch = writeBatch(db);
    }
    localStorage.removeItem('pendingDeletions');
    pendingDeletions = [];
    saveToLocalStorage();
  } catch (e) {
    console.error("Deletion batch failed:", e);
    pendingDeletions.push(...batchDeletions);
    savePendingDeletions();
  }
}
export async function addTask(taskData) {
  const { db } = await getFirebase();
  const { doc, setDoc } = await import('firebase/firestore');
const task = {
    id: crypto.randomUUID(), 
    completed: false,
    createdAt: new Date().toISOString(), 
    ...taskData,
  };

  tasks.update(current => [...current, task]);
  saveToLocalStorage();
  const currentUser = get(user)
  if (currentUser) {
    const userId = currentUser.uid
    setDoc(doc(db, 'users', userId, 'tasks', task.id), task)
  }
}

function debounce(func, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
}
const firestoreUpdate = debounce(async (task, userId) => {
  const { db } = await getFirebase();
  const { doc, setDoc } = await import('firebase/firestore');
  try {
    await setDoc(doc(db, 'users', userId, 'tasks', task.id), task);
  } catch (error) {
    console.log("Firestore error", error);
  }
}, 2000);

export async function completedTask(completedTask) {
  let updatedTask;
  tasks.update(current => {
    return current.map(t => {
      if (t.id === completedTask.id) {
        updatedTask = { ...t, completed: !t.completed };
        return updatedTask;
      }
      return t;
    });
  });
  saveToLocalStorage();
  const currentUser = get(user);
  if (currentUser?.uid && updatedTask) {
    firestoreUpdate(updatedTask, currentUser.uid);
  }
}

export async function syncTasksWithDb() {
  const currentUser = get(user);
  const { db } = await getFirebase();
  const { doc,writeBatch,getDocs,collection } = await import('firebase/firestore');
  
  if (!browser || !currentUser) {
    return;
  }
  
  try {
    const localTasks = get(tasks);
    const pendingDeletionIds = new Set(pendingDeletions);

    const hasLocalTasks = localTasks.length > 0;
    const hasPendingDeletions = pendingDeletionIds.size > 0;
    
    if (hasLocalTasks || hasPendingDeletions) {
      const batch = writeBatch(db);
      
      if (hasLocalTasks) {
        localTasks.forEach(task => {
          const taskRef = doc(db, 'users', currentUser.uid, 'tasks', task.id);
          batch.set(taskRef, task);
        });
      }
      if (hasPendingDeletions) {
        pendingDeletionIds.forEach(taskId => {
          const taskRef = doc(db, 'users', currentUser.uid, 'tasks', taskId);
          batch.delete(taskRef);
        });
      }
      await batch.commit();
    } else {
      console.log("No local changes to sync.");
    }

    const querySnapshot = await getDocs(collection(db, 'users', currentUser.uid, 'tasks'));
    const remoteTasks = querySnapshot.docs.map(doc => ({ ...doc.data() })); 
    const currentTasks = get(tasks);
    if (JSON.stringify(currentTasks) !== JSON.stringify(remoteTasks)) {
      tasks.set(remoteTasks);
      saveToLocalStorage();
    } else {
      console.log("No changes from Firestore.");
    }
    
    if (hasPendingDeletions) {
      pendingDeletions = [];
      localStorage.removeItem('pendingDeletions');
    }

  } catch (error) {
    console.error("Task sync failed:", error);
    if (error.code === 'permission-denied') {
      alert("Permission denied. Please check your account status.");
    } else if (error.code === 'unavailable') {
      alert("Network error. Please check your connection.");
    } else {
      alert("Could not sync your tasks. Please try again later.");
    }
  }
}
export function clearTasks() {
  if(browser) {
    tasks.set([]);
    localStorage.removeItem('tasks');
  }
}

