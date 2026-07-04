<script>
  import "../app.css";
  import { onMount } from "svelte";
  import { appState } from "$lib/state.svelte.js";
  import { fade } from "svelte/transition";
  import {Button, Tabbar} from "svelte-libyou";
  import Account from "~icons/material-symbols/person-add";
  import Search from "~icons/material-symbols/search";
  import Home from "~icons/material-symbols/home-outline";
  import HomeFilled from "~icons/material-symbols/home";
  import Note from "~icons/material-symbols/note-stack-outline";
  import NoteFilled from "~icons/material-symbols/note-stack";
  import Settings from "~icons/material-symbols/settings-outline";
  import SettingsFilled from "~icons/material-symbols/settings";
  import CommandPalette from "$lib/components/CommandPalette.svelte";
  import { page } from "$app/state";

  let { children } = $props();
  let showMenu = $state(false);
  let isOpen = $state(false);

  let links = [
  {label : "tasks", href: '/', icon: Home, activeIcon: HomeFilled},
  {label : "notes", href: '/notes', icon: Note, activeIcon: NoteFilled},
  {label : "settings", href: '/settings', icon: Settings, activeIcon: SettingsFilled},
  ]

  if (import.meta.env.MODE === "development") {
    onMount(async () => {
      const eruda = await import("eruda");
      eruda.default.init();
    });
  }

  onMount(async () => {
    await appState.init();
  });
</script>

<main
  class="flex h-dvh w-full overflow-y-auto overflow-hidden bg-bg text-on-bg flex-col md:flex-row-reverse"
>
  <div class="flex flex-1 flex-col min-w-0 relative">
    <CommandPalette {isOpen} />
    <header class="flex-none lg:hidden z-10 m-2">
      <div class="flex items-center justify-between p-1 gap-3">
        <button
          class="mx-1 transition-all active:rounded-2xl bg-surface-container-high rounded-full p-2 active:bg-primary-container active:text-on-primary-container active:px-3
        "
          onclick={() => {
            isOpen = !isOpen;
          }}><Search /></button
        >
        <h1 class="text-2xl font-medium md:mx-auto">
          {#if page.url.pathname === "/notes"}
            Notebooks
          {:else if page.url.pathname === "/"}
            Tasks
          {/if}
        </h1>
        <div class="flex-none">
          {#if appState.authLoading}
            <div
              class="h-9 w-9 mx-auto rounded-full animate-pulse bg-surface-container-high"
            ></div>
          {:else if appState.user}
            <!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
            <div
              onclick={() => (showMenu = !showMenu)}
              onkeyup={() => {}}
              tabindex="0"
              role="button"
              class="size-10 rounded-full transition-all active:rounded-2xl border border-outline-variant cursor-pointer"
            >
              <img
                class="rounded-full object-cover size-full"
                src={appState.user.photoURL}
                alt="User"
              />
            </div>

            {#if showMenu}
              <div
                class="fixed inset-0 bg-black/70 z-40 transition-opacity"
                onclick={() => (showMenu = false)}
                aria-hidden="true"
                role="button"
                tabindex="-1"
                onkeyup={() => {}}
              ></div>

              <div
                class="absolute z-50 right-3 top-16 min-w-52 bg-surface-container rounded-xl shadow-xl overflow-hidden flex flex-col justify-center p-4 border border-outline-variant/20"
                transition:fade={{ duration: 150 }}
              >
                <img
                  class="rounded-full mx-auto mb-4 size-13"
                  src={appState.user.photoURL}
                  alt="User"
                />
                <p
                  class="text-on-surface mb-5 font-semibold text-lg text-center truncate max-w-45"
                >
                  Hi, {appState.user.displayName}
                </p>
                <Button
                  variant="tonal"
                  class="flex text-sm justify-center items-center px-3 gap-2 w-fit mx-auto"
                  onclick={() => {
                    appState.logout();
                  }}
                >
                  Sign Out
                </Button>
              </div>
            {/if}
          {:else}
            <a
              href="/login"
              class="flex items-center active:rounded-2xl justify-center size-10 border border-outline-variant rounded-full hover:bg-surface-container-low transition"
            >
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

  <Tabbar {links} />
</main>
