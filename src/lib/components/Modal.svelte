<script>
  import { browser } from "$app/environment";
  import { fade } from "svelte/transition";
  import { quintOut } from "svelte/easing";

  export let origin = {
    x: browser ? window.innerWidth / 2 : 400,
    y: browser ? window.innerHeight / 2 : 300,
  };
  export let modalClass = "";
  export let open = false;

  function scaleFromOrigin(node, params) {
    const { duration = 300, easing = quintOut } = params;
    return {
      duration,
      easing,
      css: (t) => `
transform-origin: ${origin.x}px ${origin.y}px;
transform: scale(${t});
opacity: ${t};
`,
    };
  }
</script>

{#if open}
  <div
    in:scaleFromOrigin={{ duration: 350 }}
    out:fade={{ duration: 200 }}
    class="modal {modalClass}"
    role="presentation"
  >
    <slot></slot>
  </div>
{/if}

<style>
  .modal {
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    background: var(--md-sys-color-surface);
    overflow-y: auto;
    color: var(--md-sys-color-on-surface);
    border-radius: 13px;
    z-index: 20;
    width: 100dvw;
    transform-origin: 50% 50%;
  }
    @media (min-width: 1024px) {
   .modal {
      width: 30vw;
      margin-left: auto;
      right: 0;
      box-shadow: -4px 0px 8px rgba(0, 0, 0, 0.2);}
  }
</style>
