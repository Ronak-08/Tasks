<script>
import "../app.css";
import { onMount } from "svelte";
import { appState } from "$lib/state.svelte.js";
import { fade } from "svelte/transition";
import Button from "$lib/components/Button.svelte";
import Tabbar from "$lib/components/Tabbar.svelte";
import Logout from "~icons/material-symbols/logout";
import Account from "~icons/material-symbols/person-add";


let { children } = $props();
let showMenu = $state(false);

onMount(async() => {
  await appState.init();
});
</script>

<main class="flex h-dvh w-full overflow-hidden bg-bg text-on-bg flex-col md:flex-row-reverse">
  <div class="flex flex-1 flex-col min-w-0 relative">
    <header class="flex-none z-10 m-2 shadow-md">
      <div class="flex items-center justify-between p-1 gap-3">
        <div class="flex-1 flex justify-center">
          <input 
            placeholder="Search..." 
            class="w-full max-w-2xl p-3 leading-relaxed pl-4 bg-surface-container-high border-none rounded-full placeholder-on-surface-variant outline-none focus:ring-2 focus:ring-primary/20 transition-all" 
            bind:value={appState.searchQuery} 
            type="text"
          >
        </div>
        <div class="flex-none md:hidden">
          {#if appState.authLoading}
            <div class="h-9 w-9 mx-auto rounded-full animate-pulse bg-surface-container-high"></div>
          {:else if appState.user}
            <!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
            <div 
              onclick={() => showMenu = !showMenu} 
              onkeyup={() => {}} 
              tabindex="0" 
              role="button" 
              class="size-10 rounded-full border border-outline-variant cursor-pointer"
            >
              <img class="rounded-full object-cover size-full" src={appState.user.photoURL} alt="User" />
            </div>
  
            {#if showMenu}
              <div
                class="fixed inset-0 bg-black/70 z-40 transition-opacity"
                onclick={() => showMenu = false}
                aria-hidden="true"
                role="button"
                tabindex="-1"
                onkeyup={() => {}} 
              ></div>
  
              <div 
                class="absolute z-50 right-3 top-16 min-w-[200px] bg-surface-container rounded-xl shadow-xl overflow-hidden flex flex-col justify-center p-4 border border-outline-variant/20"
                transition:fade={{duration: 150}}
              >
                <img class="rounded-full mx-auto mb-3 size-13" src={appState.user.photoURL} alt="User" />
                <p class="text-on-surface mb-5 text-lg text-center truncate max-w-[180px]">
                  Hi, {appState.user.displayName}
                </p>
                <Button 
                  variant="tonal"
                  class="flex text-sm justify-center items-center gap-2 w-fit mx-auto"
                  onclick={() => { appState.logout() }}
                >
                  <Logout />
                  Sign Out
                </Button>
              </div>
            {/if}
  
          {:else}
            <a href="/login" class="flex items-center justify-center size-10 border border-outline-variant rounded-full hover:bg-surface-container-high transition">
              <Account class="text-xl" />
            </a>
          {/if}
        </div>
      </div>
    </header>
  
    <div class="flex-1 overflow-y-auto">
      {@render children()}
    </div>
  </div>
  
  <Tabbar />

</main>
