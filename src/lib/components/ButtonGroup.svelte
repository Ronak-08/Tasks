<script>
let {className = "", items = [], ...rest} = $props();
</script>

<div class="inline-flex gap-1 rounded-md p-1 {className}" role="group" {...rest}>
  {#each items as item, i}
    {@const Icon = item.icon || "" }
    <button onclick={item.action} class="flex gap-1 p-2 justify-center {item.style} items-center transition-all active:opacity-90 active:rounded-2xl {i === 0 ? 'rounded-l-lg' : ''} 
      {i === items.length - 1 ? 'rounded-r-lg' : ''}">
      <Icon /> {item.label}
    </button>
  {/each}
</div>
