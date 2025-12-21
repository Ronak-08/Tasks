<script>
import { fly } from "svelte/transition";
import Checkbox from "./Checkbox.svelte";
import { appState } from "$lib/state.svelte";

let {task,onShow} = $props();

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
    onclick={() => onShow(task)}
    onkeyup={() => {}}
    tabindex="0"
  >
    <div class="flex flex-col">
      <span class={` font-medium ${task.priority === 'high' ? 'text-on-secondary-container' : 'text-on-surface'} `} >{task.title}</span>
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
          <span class="text-on-surface-variant truncate max-w-[155px]">{task.desc}</span>
        {/if}
      </div>
    </div>
    <Checkbox 
      checked={task.completed}
      onchange={(e) => { appState.toggleTask(task)}}
    />
  </div>

  {#if task.subtasks && task.subtasks.length > 0}
    <div class="flex max-h-36 mt-3 mx-4 my-2 p-1 overflow-auto flex-col gap-1">
      {#each task.subtasks as sub (sub.id)}
        <div 
          role="button"
          class="flex items-center gap-2 hover:rounded-2xl p-2 rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-all hover:scale-[1.01] cursor-pointer"
          onclick={(e) => {
            e.stopPropagation(); 
            toggleSubtask(task, sub.id); 
          }}
        >

          <span class={`font-medium transition truncate ${sub.completed ? 'line-through font-thin text-on-surface/30' : 'text-on-surface-variant'}`}>
            {sub.title}
          </span>

        </div>
      {/each}
    </div>
  {/if}
</div>

