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
      rounded-2xl shadow-2xl overflow-hidden
      border border-outline-variant/50
      "
    >

      <div class="flex items-center gap-3 px-6 py-4 border-b border-outline-variant/50">
        <input 
          bind:this={inputRef} 
          bind:value={query} 
          placeholder="Search notes..." 
          class="flex-1 bg-transparent border-none outline-none text-lg text-on-surface placeholder:text-on-surface-variant/50 h-full"
          type="text"
        >
        <div class="text-[10px] font-bold text-on-surface-variant bg-surface-container-highest px-2 py-1 rounded">ESC</div>
      </div>

      <div class="max-h-[400px] overflow-y-auto p-3 scrollbar-hide">
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
              w-full flex items-center gap-4 px-4 py-2 rounded-xl transition-all text-left
              {i === selectedIndex 
                ? 'bg-secondary-container text-on-secondary-container' 
                : 'text-on-surface hover:bg-surface-container-high'}
              "
            >

              <div class="flex-1 min-w-0">
                <div class="font-medium text-sm truncate">{item.title}</div>
                {#if item.type !== 'Command'}
                  <div class="text-[10px] opacity-60 uppercase tracking-widest">{item.type}</div>
                {/if}
              </div>
            </button>
          {/each}
        {/if}
      </div>

    </div>
  </div>
{/if}
