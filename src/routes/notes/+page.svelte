<script>
import { appState } from '$lib/state.svelte.js';
import { goto } from '$app/navigation';
import Close from "~icons/material-symbols/close";
import Select from "~icons/material-symbols/select";
import Add from "~icons/material-symbols/add";
import Check from "~icons/material-symbols/check";
import NoteRow from '$lib/components/NoteRow.svelte';
import Button from '$lib/components/Button.svelte';
import Loader from '$lib/components/Loader.svelte';

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


let loading = $state(false);
async function create() {
  loading = true;
  const id = await appState.addNote(null); 
  goto(`/notes/${id}`);
  loading = false;
}
</script>

{#if loading}
  <div class="fixed inset-0 backdrop-blur-sm z-100 flex items-center justify-center">
    <Loader size="sm" />
  </div>
{/if}

<div class="h-full p-4 md:px-5 mx-2 select-none">
  <header class="flex justify-between items-center mb-10">
    <h1 class="text-3xl md:mx-1 font-bold text-on-surface">
      Notebooks
    </h1>
    <div class="flex gap-1">
      {#if isSelecting}
        <button class="p-2 px-3 transition duration-300 active:scale-[0.99] active:opacity-95 active:rounded-full bg-error-container disabled:opacity-50 text-on-error-container rounded-xl" disabled={selected.length === 0} onclick={batchDelete}>Delete ({selected.length})</button>
        <Button 
          variant='normal'
          class="px-2.5"
          onclick={() => { isSelecting = false; selected = []; }}>
          <Close />
        </Button>
      {:else}
        {#if rootNotes.length > 0}
          <Button variant='normal' onclick={() => isSelecting = true} class="rounded-lg">
            <Select class="h-5 w-6" />
          </Button>
        {/if} 
        <Button class="md:hidden rounded-lg" onclick={create}>
          <Add class="h-6 w-6" />
        </Button>
      {/if}
    </div>
  </header>

  <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
    {#each filteredList as note (note.id)}
      {@const isSelected = selected.includes(note.id)}
      <div 
        class="
        relative rounded-2xl transition-all duration-200 border-2 cursor-pointer
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
      <div class="p-8 w-full col-span-full text-center text-on-surface-variant/60">
        No notebooks found
      </div>
    {/each}
  </div>
</div>
