<script>
import { fade, fly } from "svelte/transition";
import Close from "~icons/material-symbols/close";
import {Checkbox, Button} from "svelte-libyou";
import Delete from "~icons/material-symbols/delete";
  import Check from "~icons/material-symbols/check";
  import Add from "~icons/material-symbols/add";
import { appState } from "$lib/state.svelte";


let {task = $bindable() ,onShow} = $props();


function toggleSubtask(task, subTaskId) {
  const rawSubtasks = $state.snapshot(task.subtasks);
  const updatedSubtasks = rawSubtasks.map(s => 
    s.id === subTaskId ? { ...s, completed: !s.completed } : s
  );
  appState.updateTask({ 
    id: task.id, 
    subtasks: updatedSubtasks 
  });
}
let showTask = $state(false);
let taskTitle = $state("");
let taskDes = $state("");
let priority = $state("medium");
let subtaskInput = $state("");
let tempSubTasks = $state();
let allAvailableTags = $state(task.tags || null);
let completed = $state(false);

function handleSubtaskKeydown(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    if (!subtaskInput.trim()) return;

    tempSubTasks.push({
      id: crypto.randomUUID(),
      title: subtaskInput.trim(),
      completed: false
    });

    subtaskInput = "";
  }
}
function removeTag(tagToRemove) {
  allAvailableTags = allAvailableTags.filter(t => t !== tagToRemove);
} 


function deleteSubtask(id) {
  let index = tempSubTasks.findIndex(s => s.id === id)
  if (index !== -1) {
    tempSubTasks.splice(index, 1);
  }
}


function showTaskModal() {
  showTask = true;
  taskTitle = task.title;
  taskDes = task.desc;
  tempSubTasks = task.subtasks;
}
function close() {
 showTask = false; 
 appState.updateTask({
   id: task.id,
   title: taskTitle,
   desc: taskDes,
   priority: priority,
   tags: $state.snapshot(allAvailableTags),
   })
}

function getDateColor(dateStr) {
  if (!dateStr) return '';
  const today = new Date().toISOString().split('T')[0];
  if (dateStr < today) return 'text-error';
  if (dateStr === today) return 'text-primary'; 
  return 'text-surface-400'; 
}
</script>


<div class="flex flex-col mb-2">
  <div 
    role="cell"
    transition:fly={{ y: 20, duration: 200 }}
    class={`p-3 px-4 md:py-3 mx-1 rounded-2xl flex items-center justify-between group
${task.priority === 'high' ? 'bg-secondary-container/70' : task.priority === "low" ? "bg-surface-container-low" : 'bg-surface-container'}`}
    onclick={() => showTaskModal()}
    onkeyup={() => {}}
    tabindex="0"
  >
    <div class="flex flex-col">
      <span class={` font-normal ${task.priority === 'high' ? 'text-on-secondary-container' : 'text-on-surface'} `} >{task.title}</span>
      <div class="flex items-center gap-1 mt-1 text-xs">
        {#if task.dueDate}
          <span class="flex items-center font-thin gap-1 {getDateColor(task.dueDate)}">
            {new Date(task.dueDate).toLocaleDateString('en-US', {month:'short', day:'numeric'})}
          </span>
          {#if task.desc}
          <span class="text-on-surface/70">•</span>
          {/if}
        {/if}
        {#if task.desc}
          <span class="text-on-surface-variant truncate max-w-12.5">{task.desc}</span>
        {/if}
      </div>
    </div>
    <Checkbox 
      checked={task.completed}
      onchange={(e) => { appState.toggleTask(task)}}
    />
  </div>
</div>


{#if showTask}
  <div transition:fade={{duration: 150}} class="fixed inset-0 z-100 flex flex-col bg-bg text-on-surface antialiased">
    
    <!-- Top Bar -->
    <header class="flex my-2 items-center justify-between p-2">
      <button 
        onclick={close} 
        class="p-3 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant"
      >
        <Close/>
      </button>
      
      <button 
        onclick={() => { appState.deleteTask(task.id); showTask = false; }} 
        class="p-2 hover:bg-error-container hover:text-on-error-container text-on-surface-variant rounded-full transition-all hover:scale-[0.99]"
      >
        <Delete/>
      </button>
    </header>

    <main class="flex-1 flex flex-col overflow-y-auto px-6 space-y-8 max-w-3xl mx-auto w-full">
      
      <!-- Title and Description -->

      <section class="space-y-4">
        <input 
          bind:value={taskTitle} 
          placeholder="Task title"
          class="w-full bg-transparent border-none p-0 text-2xl font-medium focus:ring-0 placeholder-on-surface-variant/50"
        >
        <textarea 
          bind:value={taskDes} 
          placeholder="Add details"
          rows="1"
          class="w-full p-3 rounded-lg h-auto outline-none bg-surface-container resize-none text-on-surface-variant placeholder-on-surface-variant/50"
        ></textarea>
      </section>
    
       <!-- tags -->

   {#if allAvailableTags.length > 0}
       <section class="space-y-2">
        <p class="text-sm font-medium text-on-surface-variant mb-4">Tags</p>
        <div class="flex  p-1 gap-2">     
            {#each allAvailableTags as tag }
              <button onclick={() => removeTag(tag)} class="p-1 transition-all hover:opacity-90 opacity-95 text-sm text-on-secondary-container px-2 rounded-lg bg-secondary-container">{tag}</button>
            {/each}
            </div>
       </section>
     {/if}  

      <!-- Priority Chip Selector -->
      <section class="bg-surface-container-low p-2 rounded-lg">
        <p class="text-sm mx-1 font-medium text-on-surface-variant mb-4">Priority</p>
        <div class="flex my-1 gap-2">
          {#each ['low', 'medium', 'high'] as level}
            <button
              onclick={() => priority = level}
              class="px-4 py-1.5 rounded-xl text-sm capitalize transition-all border border-outline-variant
                {priority === level 
                  ? 'bg-tertiary-container text-on-tertiary-container border-transparent' 
                  : 'bg-transparent text-on-surface-variant hover:bg-surface-container-low'}"
            >
              {level}
            </button>
          {/each}
        </div>
      </section>

      <!-- Subtasks -->
      <section class="space-y-4 min-h-0 bg-surface-container-low p-2 rounded-lg overflow-x-hidden overflow-y-auto">
     <p class="text-sm mx-1 mt-1 font-medium text-on-surface-variant">Subtasks</p>
        
        <div class="space-y-2">
          {#if task.subtasks}
            {#each task.subtasks as sub (sub.id)}
              <div class="group m-1 transition-all hover:scale-[1.01] hover:opacity-90 rounded-xl bg-surface-container-high flex items-center gap-2 p-2">
              <Checkbox 
                class="mr-1" 
                checked={sub.completed}
                onchange={() => {event.preventDefault(); toggleSubtask(task, sub.id)}}
              />
                <span class="flex-1 text-sm {sub.completed ? 'line-through text-on-surface-variant/50 font-light' : 'text-on-surface'}">
                  {sub.title}
                </span>

                <button 
                  onclick={() => deleteSubtask(sub.id)}
                  class="opacity-0 group-hover:opacity-100 p-1 text-on-surface-variant hover:text-error transition-opacity"
                >
                  <Delete class="text-lg" />
                </button>
              </div>
            {/each}
          {/if}

          <!-- Add Subtask Input -->
          <div class="flex bg-surface-container-high rounded-xl items-center gap-2 m-1 py-3">
            <Add class="text-base ml-2 text-primary" />
            <input 
              type="text" 
              bind:value={subtaskInput}
              onkeydown={handleSubtaskKeydown}
              placeholder="Add subtask" 
              class="bg-transparent border-none p-0 text-sm placeholder-primary/80 text-primary"
            />
          </div>
        </div>
      </section>
    </main>

    <!-- Bottom Action -->
    <footer class="p-1 m-3 flex justify-end">
      <Button class="text-sm font-medium"
        onclick={() => task.completed = !task.completed}
    >
        Mark as completed
      </Button>
    </footer>

  </div>
{/if}
