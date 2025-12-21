<script>
let { size = "md", class: className } = $props();

const sizes = {
  sm: "size-8",
  md: "size-16",
  lg: "size-24",
  xl: "size-32"
};

let sizeClass = $derived(sizes[size] || sizes.md);
</script>

<div class="relative flex items-center justify-center {sizeClass} {className}" aria-label="Loading">

  <div class="
    absolute inset-0 
    bg-primary-container 
    opacity-80
    animate-expressive-morph-slow
    "></div>

  <div class="
    absolute inset-2
    bg-primary 
    animate-expressive-morph-fast 
    shadow-sm
    "></div>

</div>

<style>
@keyframes morph {
0% { border-radius: 60% 40% 35% 70% / 60% 35% 70% 40%; }
50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
}

@keyframes rotate-blob {
0% { transform: rotate(0deg); }
100% { transform: rotate(360deg); }
}

.animate-expressive-morph-slow {
  animation: 
    morph 1s ease-in-out infinite, 
    rotate-blob 2s linear infinite;
}

.animate-expressive-morph-fast {
  animation: 
    morph 0.5s ease-in-out infinite alternate, 
    rotate-blob 2s linear infinite reverse;
}
</style>
