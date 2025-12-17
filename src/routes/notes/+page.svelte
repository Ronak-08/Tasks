<script>
import { appState } from '$lib/state.svelte.js';
import { goto } from '$app/navigation';
import Close from "~icons/material-symbols/close";
import Select from "~icons/material-symbols/select";
import Add from "~icons/material-symbols/add";
import Check from "~icons/material-symbols/check";
import NoteRow from '$lib/components/NoteRow.svelte';
import { fade } from 'svelte/transition';

let rootNotes = $derived(appState.notes.filter(n => !n.parentId));
let filteredList = $derived(
  rootNotes.filter(t => {
    const q = appState.searchQuery.toLowerCase().trim();
    const matchesSearch = (
      t.title.toLowerCase().includes(q) || 
        (t.content && t.content.toLowerCase().includes(q))
    );
    return matchesSearch;
  })
);

let isSelecting = $state(false);
let selected = $state([]);

function toggleSelection(id) {
  if (selected.includes(id)) {
    selected = selected.filter(i => i !== id);
  } else {
    selected = [...selected, id];
  }
}

async function batchDelete() {
  if (!selected.length || !confirm(`Delete ${selected.length} notebooks?`)) return;
  await Promise.all(selected.map(id => appState.deleteNote(id)));
  selected = [];
  isSelecting = false;
}


async function create() {
  const id = await appState.addNote(null); 
  goto(`/notes/${id}`);
}
</script>

<div class="h-full p-4 md:px-5 mx-2 select-none">
  <header class="flex justify-between items-center mb-8">
    <h1 class="text-xl font-medium text-on-surface">
      Notebooks
    </h1>
    <div class="flex gap-2">
      {#if isSelecting}
        <button class="p-1 px-2 bg-error-container disabled:opacity-50 text-on-error-container rounded-lg" disabled={selected.length === 0} onclick={batchDelete}>Delete ({selected.length})</button>
        <button 
          class="bg-surface-container p-2 rounded-xl" 
          onclick={() => { isSelecting = false; selected = []; }}>
          <Close />
        </button>
      {:else}
        {#if rootNotes.length > 0}
          <button onclick={() => isSelecting = true} class="p-2 rounded-lg bg-surface-container">
            <Select class="h-6 w-6" />
          </button>
        {/if} 
        <button class="p-2 rounded-lg bg-primary text-on-primary" onclick={create}>
          <Add class="h-6 w-6" />
        </button>
      {/if}
    </div>
  </header>

  <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
    {#each filteredList as note (note.id)}
      {@const isSelected = selected.includes(note.id)}
      <div 
        class="
        relative rounded-xl transition-all duration-200 border-2 cursor-pointer
        {isSelected 
          ? 'border-primary bg-primary-container/10' 
          : 'border-transparent hover:bg-surface-container-low'}
        "
        onclick={() => isSelecting && toggleSelection(note.id)}
        role="button" 
        tabindex="0" 
        onkeydown={() => {}}
      >
        <div class={isSelecting ? 'pointer-events-none' : ''}>
          <NoteRow 
            {note} 
            hasChildren={appState.notes.some(n => n.parentId == note.id)} 
          />
        </div>
        {#if isSelecting}
          <div class="absolute top-2 right-2 z-10">
            <div class="
              size-5 rounded-full border-2 flex items-center justify-center transition-all
              {isSelected ? 'bg-primary border-primary' : 'border-outline/50 bg-surface/50'}
              ">
              {#if isSelected}
                <Check class="text-on-primary text-xs" />
              {/if}
            </div>
          </div>
        {/if}

      </div>
    {:else}
      <div class="p-8 w-full col-span-full text-center text-on-surface-variant/60 italic">
        No notebooks found.
      </div>
    {/each}
  </div>
</div>
