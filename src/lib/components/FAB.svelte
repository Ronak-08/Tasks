<script>
let { children, class: className, variant = "filled", size = 10, ...rest} = $props();

const styles = {
  filled: "bg-primary text-on-primary hover:bg-primary/90",
  tonal: "bg-primary-container text-on-primary-container hover:bg-primary-container/80",
  tertiary: "bg-tertiary text-on-tertiary hover:bg-tertiary/80"
};

let variantClass = $derived(styles[variant] || styles.filled);

</script>

<button class="absolute flex justify-center active:brightness-90 items-center shadow-lg rounded-lg p-2 {variantClass} {className}" 
  {...rest}
>
  {@render children()} 
</button>
