<script>
    import { appState } from '$lib/state.svelte';
import { fade } from 'svelte/transition';

let { note } = $props();
let children = $derived(appState.notes.filter((n) => n.parentId === note.id));


</script>

<a 
  href="/notes/{note.id}" 
  class="
   flex gap-2 h-46 border border-outline-variant/90 active:border-outline
  w-full p-3 transition hover:rounded-xl active:scale-[1.02] hover:brightness-95 rounded-3xl bg-surface-container-high
  "
  transition:fade={{ duration: 150 }}
>
  <div class="flex gap-3 min-w-0 flex-1">

    <div class="flex flex-col mx-1 min-w-0">
      <span class="font-medium p-1 text-lg text-tertiary/90 truncate">
        {note.title || 'Untitled'}
      </span>

      {#if note.content}
        <span class="text-[0.85rem] mt-3 text-on-surface-variant opacity-90 line-clamp-5 leading-normal">
          {note.content.slice(0, 180).replace(/[#*`]/g, '')} 
        </span> 
        {:else}
<div class="flex overflow-hidden mt-2 gap-0.5 max-h-16 overflow-y-auto flex-wrap">
        {#if children.length > 0}
            {#each children as child}
              <p
                class="rounded-full px-3 truncate py-1 text-sm text-on-surface-variant w-fit transition  bg-surface-container-low">{child.title}</p
              >
            {/each}
        {/if}
        </div>
        <span class="text-[0.85rem] text-center text-on-surface-variant/70 m-auto">no content</span>
      {/if}



    </div>
  </div>
</a>
