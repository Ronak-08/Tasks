<script>
let { size = "md", class: className } = $props();

const sizes = {
  sm: "size-8",
  md: "size-10",
  lg: "size-16",
  xl: "size-24"
};

let sizeClass = $derived(sizes[size] || sizes.md);
</script>

<div class="relative loader flex items-center justify-center {sizeClass} {className}" aria-label="Loading">
</div>

<style>
.loader {
  width: 30px;
  aspect-ratio: 1;
  --c1:linear-gradient(90deg,#0000 calc(100%/3),var(--color-primary) 0 calc(2*100%/3),#0000 0);
  --c2:linear-gradient( 0deg,#0000 calc(100%/3),var(--color-primary) 0 calc(2*100%/3),#0000 0);
  background: var(--c1),var(--c2),var(--c1),var(--c2);
  background-size: 300% 4px,4px 300%;
  background-repeat: no-repeat;
  animation: l3 1s infinite linear;
}
@keyframes l3 {
0%   {background-position: 50%  0,100% 100%,0    100%,0 0}
25%  {background-position: 0    0,100% 50% ,0    100%,0 0}
50%  {background-position: 0    0,100% 0   ,50%  100%,0 0}
75%  {background-position: 0    0,100% 0   ,100% 100%,0 50%}
75.01%{background-position: 100% 0,100% 0   ,100% 100%,0 50%}
100% {background-position: 50%  0,100% 0   ,100% 100%,0 100%}
}
</style>
