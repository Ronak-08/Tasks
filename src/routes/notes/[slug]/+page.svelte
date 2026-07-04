<script>
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { appState } from "$lib/state.svelte.js";

  import Add from "~icons/material-symbols/note-add";
  import Preview from "~icons/material-symbols/preview";
  import Back from "~icons/material-symbols/arrow-back";
  import Right from "~icons/material-symbols/chevron-right";
  import Edit from "~icons/material-symbols/edit-square";
  import Delete from "~icons/material-symbols/delete";
  import Note from "~icons/material-symbols/note-outline";
  import NoteRow from "$lib/components/NoteRow.svelte";
  import MarkdownEditor from "$lib/components/MarkdownEditor.svelte";
  import {Button, Loader} from "svelte-libyou";
  import { fade } from "svelte/transition";

  const id = $derived(page.params.slug);
  let titleInput = $state();
  const note = $derived(appState.notes.find((n) => n.id == id));
  let settings = JSON.parse(localStorage.getItem("settings") || "{}");
  let edit = $state(true);
  edit = settings.defaultEdit;
  let Icon = $derived(edit ? Edit : Preview);
  let children = $derived(appState.notes.filter((n) => n.parentId === id));
  let headerScrolled = $state(false);
  let lastScrollY = $state(0);

  function handleHeaderScroll(e) {
    const scrollY = e.target.scrollTop;
    headerScrolled = scrollY > 20;
    lastScrollY = scrollY;
  }

  $effect(() => {
    const currentId = id;

    return () => {
      const target = appState.notes.find((n) => n.id == currentId);
      const hasKids = appState.notes.some((n) => n.parentId == currentId);
      if (
        target &&
        !target.title?.trim() &&
        !target.content?.trim() &&
        !hasKids
      ) {
        appState.deleteNote(currentId);
      }
    };
  });

  let timer;
  function handleTitle(e) {
    const val = e.target.value;
    clearTimeout(timer);
    timer = setTimeout(() => {
      appState.updateNote(note.id, { title: val });
    }, 500);
  }

  function handleKeydown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
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
        item = allNotes.find((n) => n.id == item.parentId);
      } else {
        item = null;
      }
    }
    return path.reverse();
  };
  let breadcrumbs = $derived(getBreadcrumbs(note, appState.notes));
  async function createChild() {
    if (!note.title || !note.title.trim()) {
      if (titleInput) {
        titleInput.focus();
      }
      return;
    }
    const newId = await appState.addNote(id);
    goto(`/notes/${newId}`);
  }
  async function deleteNote() {
    if (!confirm("Delete this page?")) return;
    const parent = note.parentId;
    await appState.deleteNote(id);
    goto(parent ? `/notes/${parent}` : "/notes");
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if !note || appState.authLoading || appState.loading}
  <div
    class="fixed inset-0 bg-bg/50 z-100 flex items-center justify-center"
  >
    <Loader size="sm" />
  </div>
{:else}
  <div
    onscroll={handleHeaderScroll}
    class="flex flex-col w-full h-full min-h-dvh overflow-auto absolute top-0 p-3 z-100 bg-surface-container gap-2"
  >
    <header
      class="flex sticky top-0 z-50 items-center mb-2 max-w-full justify-between"
      transition:fade
    >
      <a
        href={note.parentId ? note.parentId : "/notes"}
        class="rounded-full p-2 mr-2 transition active:opacity-90 active:rounded-lg {headerScrolled
          ? 'bg-surface-container-high opacity-50'
          : 'bg-surface-container'}"><Back /></a
      >

      {#if !headerScrolled}
        <input
          transition:fade={{ duration: 100 }}
          bind:this={titleInput}
          oninput={handleTitle}
          value={note.title}
          class="p-1 text-center text-xl font-medium;
w-full mx-2"
          placeholder="Untitled"
          type="text"
        />
        <Button
          onclick={createChild}
          class="mx-2 transition p-2.5"
          variant="normal"><Add /></Button
        >
      {/if}

      <button
        aria-label="mode"
        class="p-2.5 px-3 bg-primary text-on-primary text-sm rounded-full mr-1 active:opacity-90 hover:scale-[0.98] active:rounded-xl transition duration-300 font-medium"
        onclick={() => {
          edit = !edit;
        }}
      >
        <Icon />
      </button>
    </header>

    <div
      class="flex justify-between items-center my-2 gap-1 text-on-surface-variant text-sm m-2"
    >
      <div class="flex gap-0.5 max-w-fit bg-surface-container-low px-3 p-2 rounded-3xl mr-2 overflow-x-auto">
        <a href="/notes">Home</a>
        {#each breadcrumbs as breadcrumb}
          <Right class="opacity-50" />
          <a
            href={breadcrumb.id}
            class="text-nowrap hover:text-primary max-w-20 truncate transition"
            >{breadcrumb.title}</a
          >
        {/each}
      </div>
      <button
        class="p-2 transition-all active:bg-error-container active:text-on-error-container active:px-3 rounded-full bg-surface-container-high"
        onclick={deleteNote}><Delete /></button
      >
    </div>
    <MarkdownEditor {note} {children} {edit} />
  </div>
{/if}
