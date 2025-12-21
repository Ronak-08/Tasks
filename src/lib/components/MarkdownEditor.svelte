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
let {note,children = [], edit = true} = $props();
marked.use(markedKatex({throwOnError: true, nonStandard: true}))
marked.use({
  breaks: true,
  gfm: true,
})

let content = $state(note.content || "");
let lastId = $state(note.id);
let renderHtml = $derived(content ? DOMPurify.sanitize(marked.parse(content)) : "");
let timer;

function autofocus(node) {
    node.focus();
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

  <div class="flex-1 min-h-0 overflow-hidden relative w-full h-full">
    {#if edit}
      <textarea 
        bind:this={editor}
        use:autofocus
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
      {#if children.length > 0}
       <div class="not-prose flex text-sm  flex-wrap gap-2 mb-3 border-b border-b-outline-variant/50 pb-4"> 
    {#each children as child}
      <a class="rounded-lg px-3 py-1 transition-all hover:bg-secondary-container active:rounded-md hover:opacity-95 bg-surface-container-high" href='/notes/{child.id}'>{child.title || "Untitled"}</a>
    {/each}
       </div>
      {/if}
        <div class="prose prose-invert wrap-break-word prose-headings:mb-3 prose-headings:mt-6 prose-primary max-w-none">
          {#if !note.content}
            <div class="flex flex-col items-center justify-center h-full min-h-[350px] text-center">
              <Note class="w-16 h-16 text-on-surface-variant/60 mt-4" />
              <p class="text-on-surface font-medium mt-5 text-sm">No content</p>
              <Button
                class="mt-1 text-sm text-primary/80 transiton hover:text-primary"
                variant="text"
                onclick={() => edit = !edit}
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
