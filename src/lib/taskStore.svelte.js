import { browser } from '$app/environment';
import {user} from '$lib/userStore.js';
import { get } from 'svelte/store';
import { getFirebase } from "$lib/firebase.js";
import { searchQuery } from "$lib/index.svelte.js";


let tasks = $state([]);
let pendingDeletions = [];


export const filteredTasks = () => {
  let filtered = tasks;
  const query = searchQuery.query.trim().toLowerCase();

  if (query) {
    if (query.startsWith('#')) {
      const tagQuery = query.substring(1);
      if (tagQuery) {
        filtered = filtered.filter(t =>
          (t.tags ?? []).some(tag => tag.toLowerCase().includes(tagQuery))
        );
      }
    } else {
      filtered = filtered.filter(t =>
        (t.task?.toLowerCase() ?? '').includes(query) ||
          (t.description?.toLowerCase() ?? '').includes(query) ||
          (t.tags ?? []).some(tag => tag.toLowerCase().includes(query))        ||  (t.subtasks ?? []).some(s => s.task.toLowerCase().includes(query))
      );
    }
  }

  return [...filtered].sort((a, b) => {
    const priorityOrder = { High: 0, Medium: 1, Low: 2 };
    const aPriority = priorityOrder[a.priority] ?? 999;
    const bPriority = priorityOrder[b.priority] ?? 999;
    return aPriority - bPriority;
  });
};

export const completedTasks = () => {
  return filteredTasks().filter(task => task.completed);
};

export const ongoingTasks = () => {
  return filteredTasks().filter(task => !task.completed);
};

export function updateTask(updatedTask) {
  const taskIndex = tasks.findIndex(t => t.id === updatedTask.id);
  if (taskIndex !== -1) {
    tasks[taskIndex] = { ...updatedTask };
  }
  saveToLocalStorage();
}

let localSaveTimeout;
export function saveToLocalStorage(delay = 250) {
  if (!browser) return;
  clearTimeout(localSaveTimeout);
  localSaveTimeout = setTimeout(() => {
    let currentTasks = tasks;
    const data = localStorage.setItem("tasks", JSON.stringify(currentTasks));
  }, delay);
}

export function loadTasks() {
  if (!browser) return;

  const localTasks = JSON.parse(localStorage.getItem("tasks") || "[]");
  tasks = localTasks;

  const localDeletions = JSON.parse(localStorage.getItem("pendingDeletions") || "[]");
  pendingDeletions = localDeletions;
}

function savePendingDeletions() {
  localStorage.setItem('pendingDeletions', JSON.stringify(pendingDeletions));
}

export async function deleteTask(task) {
  if (!browser) return;
  const taskIndex = tasks.findIndex(t => t.id === task.id);
  if (taskIndex !== -1) {
    tasks.splice(taskIndex, 1);
  }
  if (!pendingDeletions.includes(task.id)) {
    pendingDeletions.push(task.id);
    savePendingDeletions();
  }
  saveToLocalStorage();
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

  tasks.push(task);

  saveToLocalStorage();
  const currentUser = get(user)
  if (currentUser) {
    const userId = currentUser.uid 
    await setDoc(doc(db, 'users', userId, 'tasks', task.id), task)
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

export async function completedTask(itemToToggle) {
  const mainTaskIndex = tasks.findIndex(t => t.id === itemToToggle.id);
  if (mainTaskIndex !== -1) {
    const updatedTask = { ...itemToToggle, completed: !itemToToggle.completed };
    await updateTask(updatedTask);
    return;
  }

  const parentTask = tasks.find(task => task.subtasks?.includes(itemToToggle));
  if (parentTask) {
    itemToToggle.completed = !itemToToggle.completed;

    const allDone =
      parentTask.subtasks.length > 0 &&
        parentTask.subtasks.every(st => st.completed);

    parentTask.completed = allDone;

    await updateTask(parentTask);
    return;
  }

  console.warn(
    "completedTask was called with an item that is neither a task nor a known subtask:",
    itemToToggle
  );
}

export async function syncTasksWithDb() {
  const currentUser = get(user);
  const { db } = await getFirebase();
  const { doc,writeBatch,getDocs,collection } = await import('firebase/firestore');

  if (!browser || !currentUser) {
    return;
  }

  try {
    const localTasks = tasks;
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
      if (hasPendingDeletions) {
        pendingDeletions = [];
        localStorage.removeItem('pendingDeletions');
      }

    }

    const querySnapshot = await getDocs(collection(db, 'users', currentUser.uid, 'tasks'));
    const remoteTasks = querySnapshot.docs.map(doc => ({ ...doc.data() })); 
    const currentTasks = tasks;
    if (JSON.stringify(currentTasks) !== JSON.stringify(remoteTasks)) {
      tasks = remoteTasks;
      saveToLocalStorage();
    } else {
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
    tasks = [];
    localStorage.removeItem('tasks');
  }
}

