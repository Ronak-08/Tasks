<script>
import { fade } from 'svelte/transition';

let { note } = $props();


</script>

<a 
  href="/notes/{note.id}" 
  class="
   flex gap-2 h-32 border border-outline-variant/90
  w-full p-3 rounded-2xl bg-surface-container-high
  "
  transition:fade={{ duration: 150 }}
>
  <div class="flex gap-3 min-w-0 flex-1">

    <div class="flex flex-col mx-1 min-w-0">
      <span class="font-normal text-lg text-on-surface/90 truncate">
        {note.title || 'Untitled'}
      </span>

      {#if note.content}
        <span class="text-[0.85rem] mt-2 text-on-surface-variant opacity-80 line-clamp-3 leading-normal">
          {note.content.slice(0, 150).replace(/[#*`]/g, '')} 
        </span> 
        {:else}
        <span class="text-[0.85rem] text-center text-on-surface-variant/70 m-auto">no content</span>
      {/if}

    </div>
  </div>
</a>
