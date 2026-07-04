<script>
  import { onMount } from "svelte";
  import Back from "~icons/material-symbols/arrow-back";
  import {Switch} from "svelte-libyou";
  import { appState } from "$lib/state.svelte";
  import { browser } from "$app/environment";
  let isLoaded = $state(false);

    $effect(() => {
      if (!isLoaded) return;
    localStorage.setItem("settings", JSON.stringify(appState.settings));
  });


  onMount(() => {
    if (!browser) return;
    const savedSettings = localStorage.getItem("settings");
if (savedSettings) {
      try {
        appState.settings = JSON.parse(savedSettings);
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
    isLoaded = true;
  });
</script>

<main class="m-4 h-dvh bg-bg z-100 fixed inset-0 md:w-3/4 md:mx-auto">
<div class="p-2 m-1 mb-7 transition active:rounded-3xl bg-surface-container-high rounded-full w-fit">
<a href="/settings"><Back /></a>
</div>
<div
  class="flex bg-surface-container-high rounded-2xl rounded-b-sm m-1 mb-0 justify-between p-2"
>
  <div class="flex flex-col p-2 gap-1">
    <p class="font-medium text-base">Disable Markdown</p>
    <p class="font-normal text-on-surface-variant/80 text-xs">
      Disable markdown in notes
    </p>
  </div>
  <Switch bind:checked={appState.settings.markdown} />
</div>
<div class="flex bg-surface-container-high m-1 justify-between p-2">
  <div class="flex flex-col p-2 gap-1">
    <p class="font-medium text-base">Disable Toolbar</p>
    <p class="font-normal text-on-surface-variant/80 text-xs">
      Disable Toolbar in notes.
    </p>
  </div>
  <Switch bind:checked={appState.settings.toolBar} />
</div>

<div
  class="flex bg-surface-container-high m-1 justify-between p-2"
>
  <div class="flex flex-col p-2 gap-1">
    <p class="font-medium text-base">Edit Mode</p>
    <p class="font-normal text-on-surface-variant/80 text-xs">
      Start in edit mode when opening note.
    </p>
  </div>
  <Switch bind:checked={appState.settings.defaultEdit} />
</div>
<div
  class="flex bg-surface-container-high rounded-2xl rounded-t-sm mx-1 justify-between p-2"
>
  <div class="flex flex-col p-2 gap-1">
    <p class="font-medium text-base">Show files</p>
    <p class="font-normal text-on-surface-variant/80 text-xs">
      Always show files in note instead of only in view mode.
    </p>
  </div>
  <Switch bind:checked={appState.settings.showFiles} />
</div>

</main>
