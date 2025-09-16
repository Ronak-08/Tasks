<script>
import { notes,addNote, updateNote } from "$lib/noteStore.svelte";
import { fly,scale } from "svelte/transition";
import { onMount } from "svelte";

let {
  open = $bindable(false),
  noteTitle = $bindable(""),
  noteContent = $bindable(""),
  tags = $bindable([]),
  noteId = null,
} = $props();
let tagInput = $state('');
let tagIn = $state();
let textarea = $state();
let markdownMode = $state(false);
let marked = $state(null);
let DOMPurify = $state(null);
let showTagContainer = $state(false);


onMount(async () => {
  const markedModule = await import('marked');
  marked = markedModule.marked;
  const DOMPurifyModule = await import('dompurify');
  DOMPurify = DOMPurifyModule.default;
})

let renderedHtml = $derived.by(() => {
  if (markdownMode && open && marked && DOMPurify) {
    return DOMPurify.sanitize(marked.parse(noteContent));
  }
  return ''; 
});

function handleSubmit(event) {
  event.preventDefault();

  if (!noteTitle.trim() && !noteContent.trim()) {
    open = false;
    return;
  }

  if (!noteTitle.trim()) {
    alert("Please add a title!");
    return;
  }

  if (noteId) {
    const originalNote = notes.find(n => n.id === noteId);
    const originalTags = [...(originalNote.tags ?? [])].sort();
    const currentTags = [...tags].sort();
    const hasChanged = originalNote.title !== noteTitle.trim() ||
      originalNote.content !== noteContent.trim() ||
      JSON.stringify(originalTags) !== JSON.stringify(currentTags);

    if (hasChanged) {
      updateNote(noteId, noteTitle, noteContent, tags);
    }
  } 
  else {
    addNote(noteTitle, noteContent, tags);
  }
  noteTitle = '';
  noteContent = '';
  tags = [];
  open = false;
}

function handleTagInput(event) {
  if (event.key === 'Enter' && tagInput.trim() !== '') {
    event.preventDefault();
    if (!tags.includes(tagInput.trim())) {
      tags = [...tags, tagInput.trim()];
    }
    tagInput = '';
  }
}

function removeTag(tagToRemove) {
  tags = tags.filter(tag => tag !== tagToRemove);
}

function insertFormatting(openWrapper, closeWrapper = openWrapper) {
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = noteContent.substring(start, end);
    
    const formattedText = `${openWrapper}${selectedText || ''}${closeWrapper}`;
    const newContent = noteContent.substring(0, start) + formattedText + noteContent.substring(end);
    
    noteContent = newContent;
    
    setTimeout(() => {
      const middlePos = start + openWrapper.length + (selectedText.length || 0);
      textarea.setSelectionRange(middlePos, middlePos);
      textarea.focus();
    }, 0);
  }

function toggleTagContainer() {
  showTagContainer = !showTagContainer;
  if (showTagContainer) {
    setTimeout(() => {
      if (tagIn) {
        tagIn.focus();
      }
    }, 0);
  }
}


</script>

<!-- ------------------- -->

{#if open}
  <form class="note-pad" transition:scale onsubmit={handleSubmit}>
    <div class="header">
      <md-outlined-icon-button class="back" type="submit">
        <md-icon class="material-symbols-rounded">arrow_back</md-icon>
      </md-outlined-icon-button>
      <input class="note-title" maxlength="100" placeholder="Note Title..." bind:value={noteTitle} type="text" />
<button class="edit" type="button" onclick={() => (markdownMode = !markdownMode)}>
        {#if markdownMode}
          <md-icon class="material-symbols-rounded">visibility</md-icon>
        {:else}
          <md-icon class="material-symbols-rounded">edit</md-icon>
        {/if}
      </button>
    </div>


    <div class="text-wrap">
      {#if markdownMode}
        <div class="rendered-content">
       {@html renderedHtml}
        </div>
      {:else}
      <textarea name="note-pad" bind:this={textarea} bind:value={noteContent}></textarea>
        {/if}
    </div>

    <div class="shortcut">
      <button type="button" class="showTag" onclick={toggleTagContainer}>
        <md-icon class="material-symbols-rounded">tag</md-icon>
      </button>

      <button type="button" onclick={() => insertFormatting('**')}>
        <md-icon class="material-symbols-rounded">format_bold</md-icon>
      </button>

      <button type="button" onclick={() => insertFormatting('*')}>
        <md-icon class="material-symbols-rounded">format_italic</md-icon>
      </button>

      <button type="button" onclick={() => insertFormatting('`')}>
        <md-icon class="material-symbols-rounded">code</md-icon>
      </button>

      <button type="button" onclick={() => insertFormatting('~~')}>
        <md-icon class="material-symbols-rounded">strikethrough_s</md-icon>
      </button>

      <button type="button" onclick={() => insertFormatting('# ', '\n')}>
        <md-icon class="material-symbols-rounded">title</md-icon>
      </button>

      <button type="button" onclick={() => insertFormatting('[', '](url)')}>
        <md-icon class="material-symbols-rounded">link</md-icon>
      </button>

      <button type="button" onclick={() => insertFormatting('- ', '\n')}>
        <md-icon class="material-symbols-rounded">format_list_bulleted</md-icon>
      </button>

      <button type="button" onclick={() => insertFormatting('1. ', '\n')}>
        <md-icon class="material-symbols-rounded">format_list_numbered</md-icon>
      </button>
    </div>


    {#if showTagContainer}
      <div onclick={() => showTagContainer = false} class="overlay"></div>
      <div class="tags-container" in:fly={{ y: 100, duration: 200 }}
        out:fly={{ y: 100, duration: 200 }} >
        <input
          class="tag-input"
          type="text"
          placeholder="Add a tag..."
          bind:this={tagIn}
          bind:value={tagInput}  
          onkeydown={handleTagInput}
        />
        <div class="tags">
          {#each tags as tag (tag)}
            <button transition:scale={{duration: 100}} type="button" class="tag" onclick={() => removeTag(tag)} >
              {tag}
            </button>
          {/each}
        </div>
      </div>
    {/if}

  </form>
{/if}

<!-- ------------------- -->


<style>
.note-pad {
  position: fixed;
  background-color: var(--md-sys-color-surface-container);
  z-index: 999;
  top: 50%;
  left: 50%;
  transform: translate(-50%,-50%);
  padding: var(--space-small);
  height: 100dvh;
  width: 100vw;
  display: flex;
  flex-direction: column;
}
.header {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: var(--space-small);
}
.note-title {
  background-color: var(--md-sys-color-surface-container-high);
  border-radius: 16px;
  padding: var(--space-small);
  font-size: 1.4rem;
  font-weight: 600;
  width: 100%;
}
.back {
  width: 50px;
}
.edit {
background-color: var(--md-sys-color-primary);
color: var(--md-sys-color-on-primary);
  border-radius: 32px;
  padding: var(--space-small);
  display: flex;
  align-items: center;
  margin-left: auto;
}
.text-wrap {
  /* border: 2px solid red; */
  margin: 0.6rem;
  min-height: 60vh;
  border-radius: 16px;
  overflow-y: auto;
  flex: 1;
  color: var(--md-sys-color-on-surface-variant);
  background-color: var(--md-sys-color-surface-container-high);
}
textarea {
  width: 100%;
  /* border: 2px solid red; */
  height: 98%;
  font-size: 0.9rem;
  white-space: pre-wrap;
  padding: 1rem; 
  overflow-wrap: break-word;
  resize: none;
}

.rendered-content {
  padding: 1rem; 
  font-size: 0.9rem;
  word-wrap: break-word;
  white-space: pre-wrap;
  overflow-wrap: break-word;
}

:global(.rendered-content pre) {
    white-space: pre-wrap;  
    overflow-wrap: break-word;
    padding: 1em;
    border-radius: 4px;
  }

  :global(.rendered-content img) {
    max-width: 100%;
    height: auto; 
  }

  :global(.rendered-content table) {
    width: 100%;
    max-width: 100%;
    overflow-x: auto; 
    display: block;
  }

.showTag {
  display: flex;
  z-index: 99;
  align-items: center;
  margin-left: 12px;
  border: 1px solid var(--md-sys-color-outline);
  border-radius: 32px;
  padding: 3px;
}

.tags-container {
  display: flex;
  position: fixed;
  top: 50%;
  left: 50%;
  max-width: 80vw;
  transform: translate(-50%,-50%);
  z-index: 99;
  flex-direction: column;
  overflow-y: auto;
  align-items: center;
  gap: 10px;
  margin: var(--space-small);
  border-radius: 16px;
  padding: var(--space-small);
  background-color: var(--md-sys-color-surface-container-high);
  box-shadow: 0px -0.5px 6px var(--md-sys-color-shadow);
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backdrop-filter: blur(6px);
  background: rgba(0, 0, 0, 0.3);
  z-index: 98; 
}
.tags {
  display: flex;
  overflow-x: auto;
  background-color: var(--md-sys-color-surface-container-low);
  border-radius: 16px;
  max-width: 80%;
  gap: 5px;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  margin: 1rem 0.8rem 0.7rem 0.8rem;
  align-items: center;
  padding: 10px 1rem;
}
.tags::-webkit-scrollbar {
  display: none;
}
 .tag {
  background-color: var(--md-sys-color-primary-container);
  padding: 6px 10px 6px 10px;
  display: flex;
  scroll-snap-align: start;
  justify-content: center;
  flex: 0 1 auto;
  gap: 10px;
  border-radius: 32px;
  font-size: 0.88rem;
  color: var(--md-sys-color-on-primary-container);
}
.tag-input {
  background-color: var(--md-sys-color-surface-container-highest);
  padding: 10px;
  margin-top: 1rem;
  border-radius: 32px;
}
.shortcut {
  display: flex;
  flex-shrink: 0;
  justify-content: space-evenly;
  padding: 0.5rem;
  background-color: var(--md-sys-color-surface-container-high);
  border-radius: 26px;
  margin: 0;
}
.shortcut button {
  padding: 2px;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
}
.shortcut button:active {
  transform: scale(0.95);
  color: var(--md-sys-color-primary);
}

@media (min-width: 768px) and (max-width: 1024px) {
  .text-wrap {
    height: 80vh;
  }
}
@media (min-width: 1024px) {
  .note-pad {
    height: 100%;
    width: 31vw;
    left: 68%;
    box-shadow: -3px 2px 7px rgba(0, 0, 0,0.5);
    top: 0;
    transform: none;
  }
}
</style>
