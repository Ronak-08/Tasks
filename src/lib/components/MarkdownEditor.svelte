<script>
import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';
import DOMPurify from 'isomorphic-dompurify';
import 'katex/dist/katex.min.css';
import { appState } from '$lib/state.svelte';
import { tick } from 'svelte';
import Note from "~icons/material-symbols/note-outline";
import Button from './Button.svelte';

let editor = $state();
let {note, mode = "edit"} = $props();
marked.use(markedKatex({throwOnError: true, nonStandard: true}))
marked.use({
  breaks: true,
  gfm: true,
})

let content = $state(note.content || "");
let lastId = $state(note.id);
let renderHtml = $derived(content ? DOMPurify.sanitize(marked.parse(content)) : "");
let timer;

$effect(() => {
  if (mode === 'edit' && note.id) {
    scrollToBottom();
  }
})

async function scrollToBottom() {
  await tick();  
  if (editor) {
    editor.scrollTop = editor.scrollHeight;
    const length = editor.value.length;
    editor.setSelectionRange(length, length);
  }

}

function handleInput(e) {
  content = e.target.value;
  clearTimeout(timer);
  timer = setTimeout(() => {
    appState.updateNote(note.id, {content: content});
  }, 1000) 
}

$effect(() => {
  if(note.id !== lastId) {
  content = note.content || "";
  lastId = note.id
  }
})
</script>

<div class="h-full min-h-full bg-surface/50 rounded-2xl md:mx-5 flex flex-col">
  <div class="flex items-center justify-center rounded-t-xl px-3 sticky top-0 py-2 shrink-0 bg-surface-container-high">
    <div class="flex bg-surface-container/80 rounded-xl p-1 gap-1">
      <button 
        aria-label="mode"
        class="px-3 py-2 text-sm rounded-lg transition-all duration-200 font-medium {mode === 'edit' 
          ? 'bg-tertiary-container text-on-tertiary-container shadow-lg' 
          : 'text-on-surface'}"
        onclick={() => mode = 'edit'}
      >
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
      </button>
      <button 
        aria-label="mode"
        class="px-3 py-1 text-sm rounded-lg transition-all duration-200 font-medium {mode === 'preview' 
          ? 'bg-tertiary-container text-on-tertiary-container shadow-lg' 
          : 'text-on-surface'}"
        onclick={() => mode = 'preview'}
      >
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>
      </button>
    </div>
  </div>

  <div class="flex-1 min-h-0 overflow-hidden relative w-full h-full">
    {#if mode === "edit"}
      <textarea 
        bind:this={editor}
        name="markdown" 
        oninput={handleInput} 
        class="
        w-full h-full 
        bg-transparent outline-none border-none resize-none 
        text-on-surface placeholder:text-on-surface-variant/80 leading-relaxed
        p-4 overflow-y-auto
        " 
        placeholder="Start writing your note..." 
        value={content} 
        id="markdown"
      ></textarea>
    {:else}
      <div class="w-full h-full overflow-y-auto p-4">
        <div class="prose prose-invert wrap-break-word prose-headings:mb-3 prose-headings:mt-6 prose-primary max-w-none">
          {#if !note.content}
            <div class="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
              <Note class="w-16 h-16 text-surface-700 mb-3" />
              <p class="text-surface-500 text-sm">No content yet</p>
              <Button
                class="mt-3 text-sm text-primary/80"
                variant="text"
                onclick={() => mode = 'edit'}
              >
                Start writing
              </Button>
            </div>
          {:else} 
            {@html renderHtml}
          {/if} 
        </div>
      </div>
    {/if}
  </div>
</div>
