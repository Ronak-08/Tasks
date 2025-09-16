<script>
  import { browser } from "$app/environment";
  import { fade,scale } from "svelte/transition";
  import { quintOut } from "svelte/easing";

  export let modalClass = "";
  export let open = false;
</script>

{#if open}
  <div
    in:scale={{ duration: 350 }}
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
    z-index: 100;
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
