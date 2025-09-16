<script>
import {
  notes,
  filteredNotes,
  loadNotes,
  sortBy,
  selectedTags,
  allTags,
  exportAllNotes,
  saveAndsetNotes,
  deleteMultipleNotes,
  deleteNote,
} from "$lib/noteStore.svelte.js";
import { onMount } from "svelte";
import { fade,fly } from "svelte/transition";
import NotePad from "$lib/components/notePad.svelte";
import Modal from "$lib/components/Modal.svelte";

const displayedNotes = $derived(filteredNotes());
let open = $state(false);
let selectedNotes = $state([]);
let noteTitle = $state("");
let noteContent = $state("");
let selectionMode = $state(false);
let selectedNoteIds = $state([]);
let tags = $state([]);
let noteId = $state(null);
let show = $state(false);
let showSettings = $state(false);
let fileInput;

async function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) {
    alert("No file selected.");
    return;
  }

  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const { notes } = JSON.parse(e.target.result);
      if (!notes || typeof notes !== "object")
        throw new Error("Invalid backup: missing 'notes'");

      const notesArray = Object.values(notes);
      saveAndsetNotes(notesArray);
      alert(`Imported ${notesArray.length} notes!`);
    } catch (error) {
      console.error("Import failed:", error);
      alert(`Import failed: ${error.message}`);
    } finally {
      fileInput.value = "";
    }
  };
  reader.onerror = () => {
    alert("Error reading file");
    fileInput.value = "";
  };

  reader.readAsText(file);
}

function handleNewNote() {
  noteTitle = "";
  noteContent = "";
  tags = [];
  noteId = null;
  open = true;
}

function handleNote(note) {
  noteTitle = note.title;
  noteContent = note.content;
  tags = note.tags ?? [];
  noteId = note.id;
  open = true;
}

function handleDelete(noteId,event) {
  event.stopPropagation();
  if (confirm('Are you sure you want to delete this note?')) {
    deleteNote(noteId);
  }
}

function toggleNoteSelection(noteId) {
  const index = selectedNoteIds.indexOf(noteId);
  if (index > -1) {
    selectedNoteIds.splice(index, 1);
  } else {
    selectedNoteIds.push(noteId);
  }
}

function handleNoteClick(note) {
  if(selectionMode) {
    toggleNoteSelection(note.id)
  } else {
    handleNote(note);
  }
}

let pressTimer = null;

function handlePressStart(note) {
  pressTimer = setTimeout(() => {
    selectionMode = true;
    toggleNoteSelection(note.id);
  }, 500);
}

function handlePressEnd() {
  clearTimeout(pressTimer);
}

function handleDeleteSelected() {
  if (confirm(`Are you sure you want to delete ${selectedNoteIds.length} notes?`)) {
    deleteMultipleNotes(selectedNoteIds);
    selectionMode = false;
    selectedNoteIds = [];
  }
}

function toggleSelectAll() {
  if (selectedNoteIds.length === displayedNotes.length) {
    selectedNoteIds = [];
  } else {
    selectedNoteIds = displayedNotes.map(note => note.id);
  }
}

$effect(() => {
  if (selectedNoteIds.length === 0 && selectionMode) {
    cancelSelection();
  }
});

function cancelSelection() {
  selectionMode = false;
  selectedNoteIds = [];
}

onMount(() => {
  loadNotes();
});
</script>

<!-- ------------------- -->

<div class="notesHeader">
  <md-fab
    role="button"
    onclick={handleNewNote}
    class="fab"
    variant="primary"
    label="New Note"
    aria-label="Edit"
  >
    <md-icon style="margin-right: 6px;" class="material-symbols-rounded" slot="icon">edit</md-icon>
  </md-fab>

<div class="wrap2">
  <md-filled-tonal-icon-button onclick={() => {showSettings = !showSettings}}>
    <span class="material-symbols-rounded">
      settings
    </span>
  </md-filled-tonal-icon-button>
  <md-filled-tonal-icon-button onclick={() => {show = !show}}>
    <span class="material-symbols-rounded">
      filter_alt
    </span>
  </md-filled-tonal-icon-button>
  </div>
</div>

{#if displayedNotes.length}
<div class="notes-grid">
  {#each displayedNotes as note (note.id)}
    <div class="note-card" transition:fade={{duration: 200}} class:selected={selectedNoteIds.includes(note.id)} role="button" onclick={() => handleNoteClick(note)}
      onmousedown={() => handlePressStart(note)}
      onmouseup={handlePressEnd}
      onmouseleave={handlePressEnd}
      ontouchstart={() => handlePressStart(note)}
      ontouchend={handlePressEnd}>
      <md-ripple></md-ripple>
      <h4 class="note-title" >{note.title}</h4>

      {#if !selectionMode}
      <button class="deleteBtn" onclick={() => handleDelete(note.id,event)}>
        <span class="material-symbols-rounded">
          delete
        </span>
      </button>
      {/if}
      <p class="note-content">{note.content}</p>
    </div>
  {/each}
</div>
  {:else} 
  <div class="noNote">No Note Found.</div>
{/if}



<NotePad bind:noteTitle bind:noteContent bind:tags bind:noteId bind:open />

{#if show}
  <div class="overlay" onclick={() => {show = false}} ></div>
  <div in:fly={{ y: 100, duration: 200 }}
    out:fly={{ y: 100, duration: 200 }} class="hiddenContainer">

    <div class="head">
      <h2>Filter</h2>
      <md-outlined-icon-button onclick={() => {show = false}}>
       <md-icon  class="material-symbols-rounded">close</md-icon> 
      </md-outlined-icon-button>
    </div>

    <div class="sort-wrap">
    <label for="sort">Sort By</label>
    <select id="sort" bind:value={sortBy.recent}>
      <option value="recent">Recent first</option>
      <option value="oldest">Oldest first</option>
    </select>
  </div>

    <div class="filter-tag">
      <p>Filter by tags</p>
    <md-chip-set class="chip-set">
      {#each allTags() as ta}
        <md-filter-chip
          onclick={() =>
            (selectedTags.selected = selectedTags.selected.includes(ta)
              ? selectedTags.selected.filter((t) => t !== ta)
              : [...selectedTags.selected, ta])}
            selected={selectedTags.selected.includes(ta)}
          role="button"
          type="button"
        >
          {ta}
        </md-filter-chip>
      {/each}
    </md-chip-set>
  </div>
  </div>
{/if}

{#if selectionMode}
  <div class="selection-bar" transition:fly={{ y: 20, duration: 300 }}>
    <div class="selection-actions-left">
      <md-text-button onclick={cancelSelection}>
        Cancel
      </md-text-button>

      <md-filled-tonal-icon-button onclick={toggleSelectAll}>
        <md-icon class="material-symbols-rounded">
          {#if selectedNoteIds.length === displayedNotes.length}
            deselect
          {:else}
            select_all
          {/if}
        </md-icon>
      </md-filled-tonal-icon-button>
    </div>

    <span class="selection-count">
      {selectedNoteIds.length} selected
    </span>

    <button class="delete-selected-btn" onclick={handleDeleteSelected}>
      <md-icon class="material-symbols-rounded">delete</md-icon>
    </button>
  </div>
{/if}

<Modal open={showSettings}>
  <div class="wrap">
    <div class="head">
 <md-outlined-icon-button onclick={() => {showSettings = false}}>
    <md-icon class="material-symbols-rounded">close</md-icon>
  </md-outlined-icon-button>
      <h2>Settings</h2>
      </div>

  <div class="export-section" onclick={exportAllNotes} >
      <md-ripple></md-ripple>
      <md-icon class="material-symbols-rounded">export_notes</md-icon>
    <p>Export notes</p>
  </div>

<div class="import-section">
      <md-icon class="material-symbols-rounded">download</md-icon>
  <input
    type="file"
    accept="application/json,.json"
    bind:this={fileInput}
    onchange={handleFileSelect}
    style="display: none;"
  />
  <button type="button" onclick={() => fileInput.click()}>
    Import from Backup
  </button>
</div>
    </div>
</Modal>

<!-- ------------------- -->

<style>
.notesHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin: var(--space-small);
  margin-left: 1.5rem;
  padding: var(--space-small);
}


.hiddenContainer {
  position: fixed;
  bottom: 0;
  width: 100%;
  height: 35vh;
  z-index: 99;
  color: var(--md-sys-color-on-surface-container);
  background-color: var(--md-sys-color-surface-container-high);
  padding: var(--space-medium);
  box-shadow: 0 -3px 8px rgba(0, 0, 0, 0.1);
  border-radius: 12px 12px 0 0;
}
.hiddenContainer .head {
  display: flex;
  justify-content: space-between;
  margin: 16px 10px 30px 10px;
}
.hiddenContainer select {
  background-color: var(--md-sys-color-surface-container-lowest);
  border-radius: 12px;
  padding: var(--space-small);
}
.hiddenContainer .sort-wrap {
  display: flex;
  align-items: center;
  margin: 0.8rem;
  padding: 0.5rem;
  justify-content: space-between;
  background-color: var(--md-sys-color-surface-container-low);
  border-radius: 16px;
  font-size: 0.9rem;
}
.hiddenContainer .filter-tag {
  display: flex;
  font-size: 0.9rem;
  flex-direction: column;
  margin: 0.7rem;
  background-color: var(--md-sys-color-surface-container-low);
  border-radius: 16px;
  padding: 0.6rem;
}
.chip-set {
  margin: 1.2rem 0.6rem 0.6rem;
}
.filter-tag p {
  margin: 0.3rem 0.6rem 0.4rem;
}

.fab {
  position: fixed;
  bottom: 10vh;
  z-index: 9;
  right: 1rem;
}
.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  max-height: 60vh;
  gap: 0.5rem;
  overflow: auto;
  padding: 0.7rem;
  margin: var(--space-medium);
}
.note-card {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none; 
  user-select: none; 
  background-color: var(--md-sys-color-surface-container);
  padding: 1rem;
  border-radius: 16px;
  max-height: 200px;
  position:relative;
  border: 2px solid var(--md-sys-color-outline-variant);
  overflow: hidden;
  transition: 0.2s all ease;
}
.note-card .note-title {
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  font-weight: 500;
  margin-bottom: 1rem;
  max-width: 70%;
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.note-card .note-content {
  font-size: 0.9rem;
  font-weight: 400;
  color: var(--md-sys-color-on-surface-variant);
  display: -webkit-box;
  -webkit-line-clamp: 4;
  line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.note-card .deleteBtn {
  position: absolute;
  opacity: 0;
  transform: scale(0.7) translateY(-5px);
  top: 15px;
  right: 15px;
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.note-card:hover .deleteBtn {
  opacity: 1;
  transform: scale(1) translateY(0);
  transition-delay: 0.1s;
}


.note-card.selected {
  border: 2px solid var(--md-sys-color-primary);
  transform: scale(0.97);
}

.selection-bar {
  position: fixed;
  bottom: 2vh;
  left: 50%;
  width: clamp(300px, 80%, 500px);
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background-color: var(--md-sys-color-surface-container-low);
  padding: 12px 24px;
  border-radius: 28px;
  box-shadow: 4px 4px 8px rgba(0,0,0,0.2);
  z-index: 100;
}

.selection-count {
  font-weight: 500;
  color: var(--md-sys-color-on-surface);
}

.delete-selected-btn {
  background-color: var(--md-sys-color-error);
  color: var(--md-sys-color-on-error);
  border-radius: 18px;
  padding: 5px;
  display: flex;
  align-items: center;
}

.selection-actions-left {
    display: flex;
    align-items: center;
    gap: 16px; 
  }

.wrap {
  margin:12px;
}
.export-section,.import-section {
  display: flex;
  position: relative;
  border-radius: 16px;
  background-color: var(--md-sys-color-surface-container-high);
  gap: 12px;
  padding: var(--space-medium);
  margin: var(--space-small);
  margin-top: 3rem;
  width: 95%;
  align-items: center;
}
.import-section {
  margin-top: 1rem;
  background-color: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
}
.head {
  display: flex;
  gap: 12px;
  align-items: center;
}

.noNote {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%,-50%);
  color: var(--md-sys-color-on-surface-variant);
}
/* responsive styles */


@media (min-width: 768px) and (max-width: 1024px) {
 .fab {
   bottom: 2vh;
  } 
  .hiddenContainer {
    width: 50%;
    left: 30%;
    height: fit-content;
  }
  .export-section,.import-section {
    width: 70%;
    margin-left: 2rem;
  }
}
@media (min-width: 1024px) {
  .fab {
    position:static;
  }
  .hiddenContainer {
    width: 50%;
    left: 30%;
    height: fit-content;
  }
}
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backdrop-filter: blur(4px);
  background: rgba(0, 0, 0, 0.3);
  z-index: 98;
}
.wrap2 {
  display: flex;
  gap: 10px;
  background-color: var(--md-sys-color-surface-container-lowest);
  padding: 7px;
  border-radius: 32px;
}
</style>
