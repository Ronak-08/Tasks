<script>
import { page } from '$app/stores';
import { goto } from '$app/navigation';
import { appState } from '$lib/state.svelte.js';

import Add from "~icons/material-symbols/add";
import Delete from "~icons/material-symbols/delete";
import Note from "~icons/material-symbols/note-outline";
import NoteRow from '$lib/components/NoteRow.svelte';
import MarkdownEditor from '$lib/components/MarkdownEditor.svelte';
import Button from '$lib/components/Button.svelte';

const id = $derived($page.params.slug);
const note = $derived(appState.notes.find(n => n.id == id));
let children = $derived(appState.notes.filter(n => n.parentId === id))

$effect(() => {
  return () => {
    const target = appState.notes.find(n => n.id == id);
    const hasKids = appState.notes.some(n => n.parentId == id);
    if (target && !target.title?.trim() && !target.content?.trim() && !hasKids) {
      appState.deleteNote(id);
    }
  };
});


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

{#if !note}
  <div class="flex justify-center w-full h-full text-center flex-col animate-pulse text-on-surface-variant">
    Loading.....
  </div>
{:else}
  <div class="flex flex-col w-full h-full min-h-dvh overflow-auto absolute top-0 p-3 z-100 bg-surface-container gap-2" >
    <nav class="flex max-w-full items-center p-2 gap-2 text-sm text-on-surface-variant/90 mb-2">
      <a href="/notes">Home</a>
      {#each breadcrumbs as crumb}
        <span>/</span>
        <a href="/notes/{crumb.id}">
          {crumb.title || 'Untitled'}
        </a>
      {/each}
    </nav>


    <div class="flex p-3 mb-2 justify-between items-center">
      <input type="text" placeholder="untitled" class="text-2xl w-full font-semibold" value={note.title} oninput={(e) => {appState.updateNote(id, {title: e.target.value})}}>
      <div class="flex gap-2">
        <button class="bg-primary text-on-primary rounded-lg p-2" onclick={createChild}>
          <Add /> 
        </button>
        <button 
          onclick={() => { 
            confirm("Delete the note?") && (appState.deleteNote(note.id), goto("/notes"));
          }} 
          class="border border-outline-variant text-primary p-2 rounded-lg"
        >
          <Delete /> 
        </button>
      </div>

    </div>

    {#if children.length > 0}
      <div class="flex p-3 md:mx-5 md:grid md:grid-cols-3 md:gap-3 md:bg-transparent md:p-0 max-h-[15vh] overflow-auto snap-mandatory bg-surface-container-high my-2 rounded-xl flex-col gap-1 shrink-0">
        {#each children as child}
          <a 
            href="/notes/{child.id}" 
            class="flex text-on-surface items-center md:p-3 md:bg-secondary-container/70 md:rounded-lg gap-2 p-1"
          >
            <Note class="text-base text-on-surface-variant" />
            <span>{child.title || 'Untitled'}</span>
          </a>
        {/each}
      </div>
    {/if}


  <MarkdownEditor {note} />
  </div>
{/if}



