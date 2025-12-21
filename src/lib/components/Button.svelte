<script>
let { children, variant = "filled", class: className, ...rest} = $props();

const styles = {
  normal: "bg-surface-container-high text-on-surface hover:bg-surface-container-high/90",
  filled: "bg-primary text-on-primary hover:bg-primary/90",
  tonal: "bg-primary-container text-on-primary-container hover:bg-primary-container/80",
  outline: "bg-transparent border border-outline-variant/90",
  text: "bg-transparent text-primary hover:bg-primary/10"
};

let variantClass = $derived(styles[variant] || styles.filled);
</script>

<button 
  class="p-2 rounded-full active:rounded-xl font-medium transition-all duration-300 active:opacity-95 flex items-center justify-center gap-2 {variantClass} {className}"
  {...rest}
>
  {@render children?.()}
</button>
