<script>
import { page } from '$app/stores';
import { goto } from '$app/navigation';
import { appState } from '$lib/state.svelte.js';

import Add from "~icons/material-symbols/add";
import Preview from "~icons/material-symbols/preview";
import Back from "~icons/material-symbols/arrow-back";
import Right from "~icons/material-symbols/chevron-right";
import Edit from "~icons/material-symbols/edit-square-outline";
import Delete from "~icons/material-symbols/delete";
import Note from "~icons/material-symbols/note-outline";
import NoteRow from '$lib/components/NoteRow.svelte';
import MarkdownEditor from '$lib/components/MarkdownEditor.svelte';
import ButtonGroup from '$lib/components/ButtonGroup.svelte';
import Button from '$lib/components/Button.svelte';
    import Loader from '$lib/components/Loader.svelte';

const id = $derived($page.params.slug);
const note = $derived(appState.notes.find(n => n.id == id));
let edit = $state(true);
let Icon = $derived(edit ? Edit : Preview );
let children = $derived(appState.notes.filter(n => n.parentId === id))
let headerButton = [
  {icon: Add, action: () => createChild(), style: "bg-primary px-3 text-on-primary"},
  {icon: Delete, action: () => deleteNote(), style: "border transition-all duration-300 border-outline-variant hover:bg-error-container hover:text-on-error-container"},
]

$effect(() => {
  return () => {
    const target = appState.notes.find(n => n.id == id);
    const hasKids = appState.notes.some(n => n.parentId == id);
    if (target && !target.title?.trim() && !target.content?.trim() && !hasKids) {
      appState.deleteNote(id);
    }
  };
});
function handleKeydown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      edit = !edit;
    }
  }

const getBreadcrumbs = (currentNote, allNotes) => {
  if (!currentNote || allNotes.length === 0) {
    return [];
  }
  let item = currentNote;
  let path = [];

  while (item) {
    path.push(item);
    if (item.parentId) {
      item = allNotes.find(n => n.id == item.parentId);
    } else {
      item = null;
    }
  }  
  return path.reverse();
}
let breadcrumbs = $derived(getBreadcrumbs(note, appState.notes));

async function createChild() {
  const newId = await appState.addNote(id); 
  goto(`/notes/${newId}`); 
}
async function deleteNote() {
  if(!confirm("Delete this page?")) return;
  const parent = note.parentId;
  await appState.deleteNote(id);
  goto(parent ? `/notes/${parent}` : '/notes');
}
</script>
    <svelte:window onkeydown={handleKeydown} />

{#if !note || appState.authLoading || appState.loading}
  <div class="fixed inset-0 bg-surface/50 backdrop-blur-sm z-[100] flex items-center justify-center">
    <Loader size="sm" />
  </div>

{:else}

  <div class="flex flex-col w-full h-full min-h-dvh overflow-auto absolute top-0 p-3 z-100 bg-surface-container gap-2" >
    <header class="flex items-center mb-1 max-w-full  justify-between">
      <a href={note.parentId ? note.parentId : "/notes"} class="rounded-full p-1 mr-2 transition active:rounded-lg border border-outline-variant" ><Back /></a>
      <input bind:value={note.title} class="p-2 text-xl w-full font-medium" defaultvalue="Untitled" placeholder="Title" type="text">
      <ButtonGroup items={headerButton} />
    </header>
    <hr class="opacity-20" />
     

    <div class="flex justify-between items-center my-2 gap-1  text-on-surface-variant text-sm m-2">
      <div class="flex gap-0.5 max-w-fit mr-4 overflow-x-auto">
      <a href='/notes'>Home</a>
    {#each breadcrumbs as breadcrumb }
        <Right class='opacity-50' />
        <a href={breadcrumb.id} class="text-nowrap hover:text-primary transition-all">{breadcrumb.title}</a>
    {/each}
      </div>
      <button 
        aria-label="mode"
        class="p-2 bg-secondary text-on-secondary text-sm rounded-lg active:opacity-90 hover:rounded-xl  transition-all duration-200 font-medium"
        onclick={() => {edit = !edit}}
      >
     <Icon />
      </button>
  </div>
     <MarkdownEditor {note} {children} {edit} />
</div>

{/if}



