<script>
import { appState } from "$lib/state.svelte";
import { goto } from "$app/navigation";
import { fade, scale } from "svelte/transition";

let query = $state("");
let selectedIndex = $state(0);
let {isOpen = false} = $props();
let inputRef = $state();
const commands = [
  {
    type: "command",
    id: "cmd-new-task",
    title: "New Task",
    action: () => {goto("/"); appState.showModal = true},
  },
  {
    type: "command",
    id: "cmd-new-note",
    title: "New Note",
    action: async () => {
      const newId = await appState.addNote(null);
      goto(`/notes/${newId}`);
    }
  }
]

function focus(node) {
  node.focus();
}

let results = $derived.by(() => {
  const q = query.toLowerCase().trim();

  const matchedCommands = q 
    ? commands.filter(c => c.title.toLowerCase().includes(q))
    : commands;

  if (!q) return matchedCommands;

  const matchedNotes = appState.notes.filter(n => (n.title || "").toLowerCase().includes(q)).map(n => ({
    type: "Note",
    id: n.id,
    title: n.title || "Untitled",
    action: () => goto(`/notes/${n.id}`)
  }));

  return [...matchedCommands, ...matchedNotes].slice(0,10);
});

function handleKeydown(e) {
  if((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    isOpen = !isOpen;
    if (isOpen) setTimeout(() => inputRef?.focus(), 50);
  }
  if(!isOpen) return;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectedIndex = (selectedIndex + 1) % results.length;
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    selectedIndex = (selectedIndex - 1 + results.length) % results.length;
  } else if (e.key === 'Enter') {
    e.preventDefault();
    selectItem(results[selectedIndex]);
  } else if (e.key === 'Escape') {
    isOpen = false;
  }
}

function selectItem(item) {
  if (!item) return;
  item.action();
  isOpen = false;
  query = "";
  selectedIndex = 0;
}

</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <div 
    onclick={() => isOpen = false} 
    role="button" tabindex="0" onkeyup={() => {}}
    class="fixed inset-0 z-50 bg-scrim/40 backdrop-blur-xs flex items-start justify-center pt-24 px-4"
    transition:fade={{ duration: 100 }}
  >

    <div 
      onclick={(e) => e.stopPropagation()} 
      role="button" tabindex="0" onkeyup={() => {}}
      transition:scale={{ duration: 150, start: 0.95 }}
      class="
      w-full max-w-[600px] flex flex-col
      bg-surface-container-high 
      rounded-3xl shadow-2xl overflow-hidden
      "
    >

      <div class="flex items-center gap-4 px-3 py-3 border-b border-outline-variant/50">
        <input 
          bind:this={inputRef} 
          bind:value={query} 
          use:focus
          placeholder="Search notes..." 
          class="flex-1 bg-surface-container px-4 py-4 rounded-full border-none outline-none text-lg text-on-surface placeholder:text-on-surface-variant/50 h-full"
          type="text"
        >
      </div>

      <div class="max-h-[400px] flex flex-col gap-1 overflow-y-auto p-4 m-1 scrollbar-hide">
        {#if results.length === 0}
          <div class="py-12 text-center flex flex-col items-center opacity-50">
            <span class="text-sm">No results found for "{query}"</span>
          </div>
        {:else}
          {#each results as item, i}
            <button 
              onclick={() => selectItem(item)} 
              onmouseenter={() => selectedIndex = i} 
              class="
              w-full hover:rounded-lg flex items-center gap-4 px-4 py-2 rounded-2xl transition-all text-left
              {i === selectedIndex 
                ? 'bg-tertiary-container text-on-tertiary-container' 
                : 'text-on-surface hover:bg-surface-container'}
              "
            >

              <div class="flex-1 min-w-0">
                <div class="font-medium text-sm truncate">{item.title}</div>
                {#if item.type !== 'Command'}
                  <div class="text-[0.7rem] opacity-60 font-light">{item.type}</div>
                {/if}
              </div>
            </button>
          {/each}
        {/if}
      </div>

    </div>
  </div>
{/if}
