<script>
import { fade } from 'svelte/transition';

let { note, hasChildren } = $props();


</script>

<a 
  href="/notes/{note.id}" 
  class="
   flex gap-2 h-20 border border-outline-variant
  w-full p-3 rounded-xl bg-surface-container-high
  "
  transition:fade={{ duration: 150 }}
>
  <div class="flex gap-3 min-w-0 flex-1">

    <div class="flex flex-col mx-1 min-w-0">
      <span class="font-medium text-base text-on-surface truncate">
        {note.title || 'Untitled'}
      </span>

      {#if note.content}
        <span class="text-xs text-on-surface-variant opacity-60 line-clamp-1 md:line-clamp-2 leading-normal">
          {note.content.slice(0, 150).replace(/[#*`]/g, '')} 
        </span> 
      {/if}

    </div>
  </div>
</a>
