<script>
import {
  notes,
  deleteMultipleNotes,
  addNote,
  updateNote,
  deleteNote,
  filteredNotes,
  loadNotes,
  searchQuery,
} from "$lib/noteStore.svelte.js";
import Modal from "$lib/components/Modal.svelte";
import { fade,slide } from "svelte/transition";
import { browser } from '$app/environment';
import { onMount } from "svelte";

let showModal = $state(false);
let renderedHtml = $state('<p>Loading note...</p>');
let editingNote = $state(null);
let noteTitle = $state("");
let noteContent = $state("");
let originalNoteState = $state({ title: "", content: "" });
let selected = $state([]);
let isSelectionMode = $derived(selected.length > 0);
let readMode = $state(false);
let displayedNotes = $derived(filteredNotes());
let markdownInitialized = $state(false);

let holdTimer = null;
const HOLD_DURATION = 800;

function handleHoldStart(noteId) {
  holdTimer = setTimeout(() => {
    selected = [noteId]; 
  }, HOLD_DURATION);
}

function handleHoldEnd() {
  clearTimeout(holdTimer);
}
function handleNoteClick(note) {
  if (isSelectionMode) {
    if (selected.includes(note.id)) {
      selected = selected.filter(id => id !== note.id);
    } else {
      selected = [...selected, note.id];
    }
  } else {
    openModal(note);
  }
}
function deleteSelectedNotes() {
  if (confirm(`Delete ${selected.length} selected notes?`)) {
    deleteMultipleNotes(selected);
    selected = []; 
  }
}
function cancelSelection() {
  selected = [];
}

$effect(() => {
  if (!browser) return;
  const renderMarkdown = async () => {
    try {
      if (!markdownInitialized) {
        const [{ marked }, DOMPurify] = await Promise.all([
          import('marked'),
          import('dompurify').then(m => m.default)
        ]);
        marked.setOptions({ gfm: true });
        window.marked = marked;
        window.DOMPurify = DOMPurify; 
        markdownInitialized = true;
      }
      const dirtyHtml = window.marked.parse(noteContent || '');
      renderedHtml = window.DOMPurify.sanitize(dirtyHtml);
    } catch (error) {
      console.error("Markdown error:", error);
      renderedHtml = '<p>Error rendering note</p>';
    }
  };
  renderMarkdown();
});

function openModal(note = null) {
  if (note) {
    editingNote = note;
    noteTitle = note.title;
    noteContent = note.content;
    originalNoteState = { title: note.title, content: note.content };
  } else {
    editingNote = null;
    noteTitle = "";
    noteContent = "";
    originalNoteState = { title: "", content: "" };
  }
  readMode = false;
  showModal = true;
}

function handleSubmit() {
  const isTitleEmpty = !noteTitle.trim();
  const isContentEmpty = !noteContent.trim();

  if (isTitleEmpty && isContentEmpty) {
    showModal = false;
    return;
  }
  if (isTitleEmpty) {
    alert("Title cannot be empty.");
    return;
  }
  if (editingNote) {
    const hasChanged =
      noteTitle !== originalNoteState.title ||
        noteContent !== originalNoteState.content;

    if (hasChanged) {
      updateNote(editingNote.id, noteTitle, noteContent);
    } else {
    }
  } else {
    addNote(noteTitle, noteContent);
  }
  showModal = false;
}
onMount(() => {
  loadNotes();
});
</script>

<div class="header">
  <md-fab
  class="plus"
  onclick={() => openModal()}
  variant="primary"
  role="button"
  label="New Note"
>
  <md-icon class="material-symbols-rounded" slot="icon">edit</md-icon>
</md-fab>

  <input
    class="search"
    type="text"
    placeholder="Search"
    bind:value={searchQuery.query}
    oninput={(event) => event.currentTarget.value}
  />
</div>

{#if isSelectionMode}
  <div class="selection-action-bar" transition:slide>
    <div class="selection-info">
      <button class="icon-button" onclick={cancelSelection} aria-label="Cancel selection">
        <md-icon class="material-symbols-rounded">close</md-icon>
      </button>
      <span>{selected.length} selected</span>
    </div>
    <div class="selection-actions">
      <button class="icon-button" onclick={deleteSelectedNotes} aria-label="Delete selected notes">
        <md-icon class="material-symbols-rounded">delete</md-icon>
      </button>
    </div>
  </div>
{/if}

<Modal open={showModal} onclose={() => (showModal = false)}>
  <form onsubmit={handleSubmit} onclick={(e) => e.stopPropagation()}>

    <div class="headNote">
      <md-outlined-icon-button
        type="button"
        onclick={handleSubmit}
        role="button"
      >
        <md-icon class="material-symbols-rounded">arrow_back</md-icon>
      </md-outlined-icon-button>
      <input
        type="text"
        bind:value={noteTitle}
        maxlength="300"
        required
        class="note-title"
        placeholder="Note Title"
      />
      <button
        class="ai"
        type="button"
        onclick={() => {
          readMode = !readMode;
        }}
      >
        <md-icon class="material-symbols-rounded">
          {readMode ? "edit_note" : "visibility"}
        </md-icon>
      </button>
    </div>
      {#if readMode}
        <div class="markdown-preview">
          {@html renderedHtml}
        </div>
      {:else}
        <textarea
          bind:value={noteContent}
          class="note-content"
          placeholder="Write your note here..."
        ></textarea>
      {/if}
    </form>
  </Modal>

<div class="notes-container" class:selection-active={isSelectionMode}>
  <div class="notes-grid">
    {#if displayedNotes.length > 0}
      {#each displayedNotes as note (note.id)}
        <div
          role="button"
          tabindex="0"
          class="note-card"
          class:selected={selected.includes(note.id)}
          onclick={() => handleNoteClick(note)}
          onmousedown={() => handleHoldStart(note.id)}
          onmouseup={handleHoldEnd}
          onmouseleave={handleHoldEnd}
          ontouchstart={() => handleHoldStart(note.id)}
          ontouchend={handleHoldEnd}
          transition:fade={{ duration: 200 }}
          title="Click to edit"
        >
          <md-ripple></md-ripple>
          <button
            class="delete-btn"
            onclick={(e) => { e.stopPropagation(); if (confirm("Delete this note?")) deleteNote(note.id);}}
            title="Delete note"
          >
            <md-icon class="material-symbols-rounded">delete</md-icon>
          </button>

          {#if selected.includes(note.id)}
            <div class="selection-checkbox" transition:fade>
              <md-icon class="material-symbols-rounded">check_circle</md-icon>
            </div>
          {/if}

          <h3>{note.title}</h3>
          <p>{note.content}</p>
        </div>
      {/each}
    {:else if searchQuery.query.trim() !== ""}
      <p class="warning">No matching Notes found.</p>
    {:else}
      <p class="warning">No notes yet. Add one!</p>
    {/if}
  </div>
</div>

<style>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 1.1rem var(--space-medium);
  position: sticky;
  top: 0;
  z-index:5;
  padding: var(--space-small);
  margin-bottom: var(--space-medium);
}
.notes-container {
  overflow: auto;
  height: 58vh;
}
.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 0.7rem;
  margin: var(--space-large);
  padding: var(--space-small);
}

.note-card {
  position: relative;
  border: 1.5px solid var(--md-sys-color-outline-variant);
  color: var(--md-sys-color-on-surface);
  background-color: var(--md-sys-color-surface-container-low);
  max-height: 230px;
  max-width: 100%;
  width: 100%;
  padding: var(--space-medium);
  border-radius: 13px;
  -webkit-user-select: none;
  -moz-user-select: none;    
  -ms-user-select: none;     
  user-select: none;      
  cursor: pointer;
  transition: all 0.3s ease;
}
.notes-container:not(.selection-active) .note-card:hover .delete-btn {
  opacity: 1;
  transform: scale(1);
  pointer-events: auto;
}
.note-card h3 {
  margin: 0 0 1.1rem;
  font-size: 1.1rem;
  font-weight: 500;
  max-width: 78%;
  flex-shrink: 0;
  overflow: hidden;
}
.note-card p {
  font-size: 0.90rem;
  font-weight: 400;
  color: var(--md-sys-color-on-surface-variant);
  margin: 0; 
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  line-clamp: 5;
  -webkit-box-orient: vertical;
  line-height: 1.3em; 
  word-break: break-word;
}
.delete-btn {
  position: absolute;
  top: 18px;
  opacity: 0;
  transform: scale(0.8);
  transition: opacity 0.2s ease, transform 0.2s ease;
  right: 21px;
  background: none;
  border: none;
  font-size: 0.8rem;
  color: var(--md-sys-color-secondary);
  cursor: pointer;
}
form {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  height: 100%;
}
input {
  outline: none;
}
.plus {
  position: fixed;
  z-index: 5;
  box-shadow: 0px 2px 8px var(--md-sys-color-shadow);
  bottom: 6rem;
  right: 1.5rem;
}
.plus md-icon {
  margin-right: 10px;
}
.headNote {
  display: flex;
  gap: 0.8rem;
  margin: var(--space-medium);
  align-items: center;
}
.note-title {
  font-size: 1.3rem;
  border: 1px solid var(--md-sys-color-outline-variant);
  transition: all 0.3s ease;
  background-color: var(--md-sys-color-surface-container-high);
  padding: var(--space-small);
  text-align: center;
  border-radius: 16px;
  min-width: 20%;
  font-weight: 600;
}
.note-title:focus {
  border-color: var(--md-sys-color-outline);
}
:global(textarea.note-content) {
  all: unset;
  font-family: inherit;
  font-size: 0.9rem;
}
textarea.note-content,.markdown-preview {
  height: 100%;
  padding: 2.0rem;
  outline: none;
  border: none;
  word-break: break-word;
  white-space: pre-wrap;
  overflow-y: auto;
  margin: 0.5rem;
  border-radius: 16px;
  background-color: var(--md-sys-color-surface-container);
}
.markdown-preview {
  font-size: 0.9rem;
}
.warning {
  position: absolute;
  top: 50%;
  left: 50%;
  font-weight: 500;
  transform: translate(-50%, -50%);
  font-size: 1.1rem;
  color: var(--md-sys-color-error);
}
.markdown-preview :global(h1),
.markdown-preview :global(h2) {
  padding-bottom: 1rem;
}
.markdown-preview :global(hr) {
  margin:1rem 0 1.2rem 0;
}
.ai {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 36px;
  margin-left: auto;
  background-color: var(--md-sys-color-secondary);
  color: var(--md-sys-color-on-secondary);
  padding: var(--space-small);
}

.note-card.selected {
  transform: scale(0.95);
  border: 2px solid var(--md-sys-color-primary);
  box-shadow: 0 0 0 2px var(--md-sys-color-primary);
}

.selection-checkbox {
  position: absolute;
  top: 8px;
  right: 8px;
  color: var(--md-sys-color-primary);
  background-color: var(--md-sys-color-surface);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.selection-action-bar {
  position: fixed;
  bottom: 10vh;
  left: 50%;
  transform: translateX(-50%);
  background: var(--md-sys-color-surface-container);
  color: var(--md-sys-color-primary);
  border-radius: 16px;
  padding: var(--space-medium);
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: calc(100% - 48px);
  max-width: 400px;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}
.selection-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.selection-info md-icon {
  vertical-align: middle;
}
.selection-actions md-icon {
  vertical-align: middle;
}

@media (min-width: 768px) and (max-width: 1024px) {
  .plus {
    bottom: 2rem;
  }
  .selection-action-bar {
    position: fixed;
    bottom: 2rem;
  }
  .notes-grid {
    justify-content: left;
    grid-template-columns: repeat(auto-fit, minmax(290px, 220px));
  }
  .notes-container {
    height: 70vh;
  }
}
  @media (min-width: 1024px) {
  textarea.note-content,.markdown-preview {
    font-size: 1rem;
  }
  .notes-grid {
    justify-content: left;
    grid-template-columns: repeat(auto-fit, minmax(250px,320px));
  }
  .selection-action-bar {
    bottom: 24px;
  }
  .search {
    width: 70%;
  }
  .plus {
    position: static;
  }
  .header {
    justify-content: left;
    gap: 2rem;
  }
}
</style>
