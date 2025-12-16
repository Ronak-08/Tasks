<script>
import { scale } from 'svelte/transition';

let { checked = $bindable(false), class: className, ...rest } = $props();
</script>

<label onclick={(e) => {
    e.stopPropagation();
  }} class="inline-flex items-center cursor-pointer group {className}">
  <input type="checkbox" bind:checked class="sr-only" {...rest} />

  <div class="
    w-[18px] h-[18px] rounded-xs border-2 flex items-center justify-center transition-colors duration-200
    {checked 
      ? 'bg-primary border-primary text-on-primary' 
      : 'border-outline group-hover:border-primary group-hover:bg-surface-container-highest'}
    ">
    {#if checked}
      <svg 
        transition:scale={{ duration: 150, start: 0.5 }}
        viewBox="0 0 24 24" 
        class="w-3.5 h-3.5 fill-none stroke-current stroke-3"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M20 6L9 17l-5-5" />
      </svg>
    {/if}
  </div>
</label>
