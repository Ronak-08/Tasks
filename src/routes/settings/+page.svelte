<script>
import { browser } from "$app/environment";
import Switch from "$lib/components/Switch.svelte";
import Button from "$lib/components/Button.svelte";
import { appState } from "$lib/state.svelte";
import { onMount } from "svelte";
    import { fade } from "svelte/transition";

const defaultSettings = {
  defaultEdit: true,
  markdown: false,
};

let successMsg = $state(false);
let isLight = $state(false);

  function triggerSuccess() {
    successMsg = true;
    setTimeout(() => successMsg = false, 2000);
  }

function toggleTheme() {
  isLight = !isLight;
  if (isLight) {
    document.documentElement.classList.add('light');
    localStorage.setItem('theme', 'light');
  } else {
    document.documentElement.classList.remove('light');
    localStorage.setItem('theme', 'dark');
  }
}
onMount(() => {
 isLight = document.documentElement.classList.contains('light');
});

function exportBackup(tasks, notes) {
  const date = new Date().toISOString().split("T")[0];
  const filename = `${date}.json`;

  const data = {
    tasks: appState.tasks,
    notes: appState.notes
  };

  const jsonStr = JSON.stringify(data, null, 2);

  const blob = new Blob([jsonStr], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

async function importBackup(file, callback) {
  const reader = new FileReader();

  reader.onload = async () => {
    const data = JSON.parse(reader.result);
    if (!data || typeof data !== "object") return;

    await appState.restoreBackup(data);

    callback({ tasks:appState.tasks, notes:appState.notes });
  };

  reader.readAsText(file);
}


function importFile(e) {
  const file = e.target.files[0];
  if(!file) return;
  importBackup(file,({tasks,notes})=> {
  triggerSuccess();
  e.target.value = '';
})
}

let settings = $state(defaultSettings);

onMount(() => {
  if (!browser) return;

  try {
    const savedSettings = localStorage.getItem("settings");
    if (savedSettings) {
      settings = { ...defaultSettings, ...JSON.parse(savedSettings) };
    }
  } catch (error) {
    console.error("Error reading from localStorage:", error);
  }
});

$effect(() => {
  localStorage.setItem("settings", JSON.stringify(settings));
});
</script>

{#if successMsg}
  <div transition:fade={{duration: 300}} class="fixed top-6 left-0 right-0 mx-auto z-100 rounded-3xl w-9/12 bg-surface-container-highest shadow-md">
    <p class="text-center text-green-300 p-3">Imported Notes and Tasks.</p>
  </div>
{/if}

<main class="p-3 md:p-5">
  <h1 class=" transition-all hover:font-[650] text-4xl m-3 mb-8 font-bold">Settings</h1>

  <div class="flex flex-col m-2">
    <div class="flex mb-3 bg-surface-container-high items-center px-3 justify-between m-1 p-3 rounded-3xl">
      <p class="p-1 font-medium">Light Theme</p>
      <Switch checked={isLight} onchange={toggleTheme} /> 
    </div>
    <div class="flex bg-surface-container-high rounded-2xl rounded-b-sm m-1 justify-between p-2">
      <div class="flex flex-col p-2 gap-1">
        <p class="font-medium text-base">Disable Markdown</p>
        <p class="font-normal text-on-surface-variant/80 text-xs">Disable markdown in notes</p>
      </div>
      <Switch bind:checked={settings.markdown} />
    </div>

    <div class="flex bg-surface-container-high rounded-2xl rounded-t-sm mx-1 justify-between p-2">
      <div class="flex flex-col p-2 gap-1">
        <p class="font-medium text-base">Edit Mode</p>
        <p class="font-normal text-on-surface-variant/80 text-xs">Start in edit mode when opening note.</p>
      </div>
      <Switch bind:checked={settings.defaultEdit} />
    </div>

    <p class="text-base text-on-surface-variant p-3 mt-4 font-medium">Backup Data</p>

    <div class="flex bg-surface-container-high rounded-2xl m-1 justify-between items-center gap-1 p-3">
      <label class="transition font-normal active:opacity-80 border border-transparent hover:border-primary rounded-full p-1 px-3">Import Data
      <input class="hidden" onchange={importFile} type="file" id="jsonInput" accept=".json" />
      </label>
      <Button class="px-3 ml-3 font-normal" variant="tonal" onclick={exportBackup}>Export</Button>
    </div>
  </div>
</main>
