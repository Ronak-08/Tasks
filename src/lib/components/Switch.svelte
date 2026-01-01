<script>
let {
  checked = $bindable(false),
  disabled = false,
  label = "",
  onchange,
  ...rest
} = $props();

function toggle() {
  if (disabled) return;
  checked = !checked;
  onchange?.(checked);
}
</script>

<button
  role="switch"
  aria-checked={checked}
  aria-disabled={disabled}
  onclick={toggle}
  class="group inline-flex items-center gap-3 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
  {disabled}
  {...rest}
>
  <div 
    class="relative w-13 h-8 rounded-full transition-colors duration-200
    {checked ? 'bg-primary' : 'bg-surface-variant'}
    {disabled ? 'opacity-50' : ''}"
  >
    <div 
      class="absolute inset-0 rounded-full border-2 border-transparent transition-opacity duration-200
      {checked ? 'opacity-0 border-outline-variant/80' : 'opacity-100'}"
    ></div>

    <div 
      class="absolute top-1 transition-all duration-200 rounded-full bg-surface shadow-md
      {checked 
        ? 'left-[calc(100%-28px)] w-6 h-6' 
        : 'left-1 top-1.5 size-5 bg-on-primary'}"
    >
    </div>
  </div>

  {#if label}
    <span class="text-sm select-none {disabled ? 'opacity-50' : ''}">
      {label}
    </span>
  {/if}
</button>

<style>
button:active:not(:disabled) > div:first-child {
  transform: scale(0.95);
}
</style>
