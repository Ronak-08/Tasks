<script>
import { appState } from '$lib/state.svelte';
import { fade, fly, slide } from 'svelte/transition';
import { flip } from 'svelte/animate';

import Filter from "~icons/material-symbols/filter-alt-outline";
import CalenderClock from "~icons/material-symbols/calendar-clock";
import Chevron from "~icons/material-symbols/chevron-right";
import Delete from "~icons/material-symbols/delete";
import Close from "~icons/material-symbols/close";
import Add from "~icons/material-symbols/add"
import Label from "~icons/material-symbols/label-outline"

import Button from '$lib/components/Button.svelte';
import Checkbox from '$lib/components/Checkbox.svelte';
import FAB from '$lib/components/FAB.svelte';
import TaskRow from '$lib/components/TaskRow.svelte';
    import { tick } from 'svelte';

let taskInput = $state();
let newTaskTitle = $state("");
let showAccordion = $state(false);
let editingId = $state(null);
let newTaskDesc = $state("");
let isUpdating = $state(false);
let priority = $state("medium");
let dueDate = $state(null);
let subTaskInput = $state("");
let tempSubtasks = $state([]);
let selectedTag = $state("all"); 
let showTagInput = $state(false);
let allAvailableTags = $derived(
  [...new Set(appState.tasks.flatMap(t => t.tags || []))].sort()
);
let tempTags = $state([]);
let tagInput = $state("");
let filteredList = $derived(
  appState.tasks.filter(t => {
    const q = appState.searchQuery.toLowerCase().trim();
    const matchesSearch = (
      t.title.toLowerCase().includes(q) || 
        (t.desc && t.desc.toLowerCase().includes(q))
    );
    const matchesTag = selectedTag === "all" || (t.tags && t.tags.includes(selectedTag));
    return matchesSearch && matchesTag;
  })
);

let activeTasks = $derived(filteredList.filter(t => !t.completed));
let completedTasks = $derived(filteredList.filter(t => t.completed));

let totalTasks = $derived(appState.tasks.length);
let totalDone = $derived(appState.tasks.filter(t => t.completed).length);
let active = $derived(appState.tasks.filter(t => !t.completed));
let percent = $derived(totalTasks === 0 ? 0 : Math.round((totalDone / totalTasks) * 100));


function addTag(e) {
  if(e.key === "Enter") {
    e.preventDefault();
    const val = tagInput.trim().replace(/^#/, '');

    if (val && !tempTags.includes(val)) {
      tempTags.push(val); 
    }
    tagInput = ""; 
  }
}
function removeTag(tagToRemove) {
  tempTags = tempTags.filter(t => t !== tagToRemove);
}

function handleSubtaskKeydown(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    if (!subTaskInput.trim()) return;

    tempSubtasks.push({
      id: crypto.randomUUID(),
      title: subTaskInput.trim(),
      completed: false
    });

    subTaskInput = "";
  }
}


async function show(task) {
  appState.showModal = true;
  await tick();
  if(taskInput) taskInput.focus();
  isUpdating = true;
  newTaskTitle = task.title || "";
  newTaskDesc = task.desc || "";
  editingId = task.id;
  priority = task.priority || "medium";
  dueDate = task.dueDate || null;
  tempTags = task.tags ? [...task.tags] : [];
  tempSubtasks = task.subtasks ? JSON.parse(JSON.stringify(task.subtasks)) : [];
}
function close() {
  appState.showModal = false;
  isUpdating = false;
  newTaskTitle = "";
  tempTags = [];
  newTaskDesc = "";
  editingId = null;
  priority = "medium";
  dueDate = null;
  tempSubtasks = [];
}

function handleAdd(e) {
  e.preventDefault();
  if (!newTaskTitle.trim()) return;
  if(isUpdating) {
    let taskToUpdate = {
      id: editingId,
      title: newTaskTitle, 
      desc: newTaskDesc,
      priority: priority,
      dueDate: dueDate,
      tags: $state.snapshot(tempTags),
      subtasks: $state.snapshot(tempSubtasks)
    };
    appState.updateTask(taskToUpdate)
    close();
  } else {
    appState.addTask({ title: newTaskTitle, desc: newTaskDesc, priority: priority, dueDate: dueDate, tags: $state.snapshot(tempTags), subtasks: $state.snapshot(tempSubtasks) });
    newTaskTitle = "";
    newTaskDesc = "";
    appState.showModal = false;
    tempTags = [];
    tempSubtasks = [];
  }
}

</script>

<main class="mx-auto p-4 md:px-5 h-full">
  <div class="grid grid-cols-1 md:grid-cols-2 lg:max-w-5xl lg:mx-auto gap-4 md:gap-9 items-start">
    <div class="flex flex-col space-y-2 h-full overflow-y-auto">

      <div class="flex justify-between md:bg-surface-container md:px-2 rounded-xl mb-4 items-center flex-row">
        <p class="p-3 text-[0.9rem] font-medium text-primary">Tasks</p>
        <div class="relative px-2 py-1 bg-surface-container-high rounded-2xl flex items-center">
          <Filter class="text-base" />
          <select class="outline-none font-medium max-w-10 text-sm bg-transparent" name="filter tags" bind:value={selectedTag} id="filterTags">
            <option value="all">All</option>
            {#each allAvailableTags as tag }
              <option value={tag}>{tag}</option>
            {/each}
          </select>
        </div>
      </div>

      {#if appState.tasks.length === 0}
        <div class="text-center text-on-surface-variant/80 py-10">
          No tasks yet. Add one!
        </div>
      {:else if active.length === 0}
        <div class="text-center p-2 text-on-surface-variant/80 py-10">
          <p>All Tasks Completed</p>
        </div>
      {:else if filteredList.length === 0} 
        <div class="text-center justify-center items-center flex gap-3 p-2 text-on-surface-variant/80 py-10">
          <p>Not found</p>
        </div>
      {/if}

      <div class="space-y-2">
        {#each activeTasks as task (task.id)}
          <TaskRow {task} onShow={show} />
        {/each}
      </div>
    </div>


    <div class="mt-1 md:mt-0 ">

      <button 
        onclick={() => {showAccordion = !showAccordion; isUpdating = false}}
        aria-expanded={showAccordion}
        aria-controls="accordion-content"
        class="p-3 md:bg-surface-container rounded-xl w-full flex justify-between active:opacity-80 transition-opacity items-center mb-2"
      >
        <span class="text-[0.90rem] font-medium text-primary">Completed ({completedTasks.length})</span>
        <span 
          class="transition-transform duration-200 {showAccordion ? 'rotate-90' : ''}"
          aria-hidden="true"
        >
          <Chevron />
        </span>
      </button>

      {#if showAccordion}
        <div 
          id="accordion-content"
          class="space-y-2 bg-surface-container-low overflow-y-auto max-h-[20vh] pb-3 md:max-h-full p-2 rounded-xl"
          transition:slide={{ duration: 200 }}
        >
          {#each completedTasks as task (task.id)}
            <div 
              animate:flip={{ duration: 200 }} 
              class="flex items-center opacity-70 hover:scale-[1.02] transition-all justify-between p-2 mx-1 rounded-2xl bg-surface-container-low">
              <Checkbox 
                class="mr-4" 
                checked={task.completed}
                onchange={() => {event.preventDefault(); appState.toggleTask(task)}}
              />
              <div class="flex-1 min-w-0">
                <span class="line-through text-on-surface-variant truncate block">
                  {task.title}
                </span>
                {#if task.desc}
                  <p class="text-xs text-on-surface-variant/80 truncate">{task.desc}</p>
                {/if}
              </div>
              <button onclick={() => appState.deleteTask(task.id)} class="transition-all active:scale-98 rounded-full text-error p-1 opacity-40 hover:opacity-100">
                <Delete class=" text-base" />
              </button>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</main>

<FAB 
  onclick={() => appState.showModal = !appState.showModal}
  variant="filled"
  class="bottom-5 md:hidden size-16 right-4"
>
  <Add class="size-6" />
</FAB>

{#if appState.showModal}
  <div
    class="fixed inset-0 bg-black/70 z-40 transition-opacity"
    onclick={close}
    transition:fade={{ duration: 150 }}
    aria-hidden="true"
  ></div>

  <div 
    class="fixed bottom-0 md:w-full md:max-w-[60%] lg:max-w-[40%] md:left-[20%] left-0 right-0 z-60 bg-surface-container rounded-t-3xl shadow-2xl overflow-hidden"
    role="dialog"
    aria-modal="true"
    transition:slide={{ axis: 'y', duration: 250 }}
  >
    <form onsubmit={handleAdd} class="flex flex-col p-5 gap-3 pb-safe-area">
      <div class="flex items-center justify-between mb-2">
        {#if isUpdating}
          <button 
            type="button" 
            class="border border-outline-variant p-1 hover:opacity-90 rounded-full text-error"
            onclick={() => { if(confirm("Delete task?")) { appState.deleteTask(editingId); close(); }}}
          >
            <Delete class="text-base"/>
          </button>
        {:else}
          <div></div>
        {/if}

        <Button type="submit" class='px-3' variant="filled">
          {isUpdating ? 'Save' : 'Create'}
        </Button>
      </div>

      <div class="flex flex-col items-center">
        <input 
          type="text" 
          bind:value={newTaskTitle}
          bind:this={taskInput}
          placeholder="What needs to be done?" 
          class="w-full bg-transparent border-0 p-0 mb-4 text-xl font-semibold placeholder-on-surface-variant focus:ring-0 text-on-surface"
          required
        />
        <textarea 
          bind:value={newTaskDesc}
          rows="2"
          placeholder="Add details, notes, or links..." 
          class="w-full mt-1 bg-transparent border-0 p-0 text-sm text-on-surface-variant placeholder-on-surface-variant/80 outline-none resize-none"
        ></textarea>

        {#if isUpdating}
          <input 
            type="text" 
            bind:value={subTaskInput}
            onkeydown={handleSubtaskKeydown}
            placeholder="Add subtask" 
            class="w-full mb-2 bg-transparent border-0 p-0 text-sm text-on-surface-variant placeholder-on-surface-variant focus:ring-0"
          />
        {/if}
        {#if showTagInput}
          <input 
            transition:fade={{duration: 100}}
            type="text" 
            bind:value={tagInput}
            onkeydown={addTag}
            placeholder="Add tags (Press Enter)" 
            class="w-full bg-transparent border-0 mb-4 p-0 text-sm text-on-surface-variant placeholder-on-surface-variant/70 focus:ring-0"
          />
        {/if}
      </div>

      <div class="flex justify-between items-center">
        <div class="flex justify-center bg-surface-container-high gap-2 rounded-full p-1">
          {#each ['low', 'medium', 'high'] as level}
            <button
              type="button"
              class="transition-all! rounded-full p-1 px-2 {priority === level ? 'bg-tertiary text-on-tertiary' : 'bg-surface-container-high opacity-50 hover:opacity-100'}"
              onclick={() => priority = level}
            >
              <span class="capitalize text-sm">{level}</span>
            </button>
          {/each}
        </div>

        <div class="flex gap-2">
          <button type="button" class="p-2 rounded-full w-fit btn-sm bg-surface-container-high text-on-surface" onclick={() => showTagInput = !showTagInput}>
            <Label />
          </button>
          <label class="p-2 rounded-full w-fit btn-sm bg-surface-container-high text-on-surface has-checked:text-primary">
            <CalenderClock class="text-sm" />
            <input 
              type="date" 
              bind:value={dueDate} 
              class="bg-transparent border-none w-px h-px p-0 overflow-hidden absolute"
            />
          </label>
        </div>
      </div>
    </form>
  </div>
{/if}
