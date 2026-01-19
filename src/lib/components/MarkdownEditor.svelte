<script>
  import DOMPurify from "isomorphic-dompurify";
  import { appState } from "$lib/state.svelte";
  import Note from "~icons/material-symbols/note-outline";
  import Bold from "~icons/material-symbols/format-bold";
  import Italic from "~icons/material-symbols/format-italic";
  import Code from "~icons/material-symbols/code";
  import Number from "~icons/material-symbols/format-list-numbered";
  import Quote from "~icons/material-symbols/format-quote";
  import Bullet from "~icons/material-symbols/format-list-bulleted";
  import Link from "~icons/material-symbols/link";
  import Strikethrough from "~icons/material-symbols/strikethrough-s";
  
  import { tick } from "svelte";

  import Button from "./Button.svelte";
  import { slide } from "svelte/transition";
    import { preventDefault } from "svelte/legacy";

  let editor = $state();
  let showTrail = $state(false);

  let { note, children = [], edit = true } = $props();

  let settings = JSON.parse(localStorage.getItem("settings") || "{}");
  // edit = settings.defaultEdit;

  let content = $state(note.content || "");
  let lastId = $state(note.id);

  let marked = $state(null);
  let isMarkdownReady = $state(false);

  const formatButtons = [
    { label: Bold, prefix: "**", suffix: "**", width: "min-w-10" },
    { label: Italic, prefix: "*", suffix: "*", width: "min-w-10" },
    { label: Strikethrough, prefix: "~~", suffix: "~~", width: "min-w-10" },
    {
      label: Bullet,
      prefix: "- ",
      suffix: "",
      width: "min-w-10",
      title: "Bullet list",
    },
    {
      label: Number,
      prefix: "1. ",
      suffix: "",
      width: "min-w-10",
      title: "Numbers",
    },
  ];
  const trailingBtns = [
    {
      label: Quote,
      prefix: "> ",
      suffix: "",
      width: "min-w-10",
      title: "Quotes",
    },
    {
      label: Code,
      prefix: "```",
      suffix: "```",
      width: "min-w-10",
      title: "Code",
    },
    // { label: "Σ", prefix: "$", suffix: "$", width: "px-3" },
    {
      label: Link,
      prefix: "[",
      suffix: "](url)",
      width: "min-w-10",
      title: "Link",
    },
  ];

  $effect(() => {
    if (!settings.markdown && !isMarkdownReady) {
      Promise.all([
        import("marked"),
        import("marked-katex-extension"),
        import("katex/dist/katex.min.css"),
      ]).then(([markedModule, katexModule]) => {
        marked = markedModule.marked;

        marked.use(
          katexModule.default({
            throwOnError: true,
            nonStandard: true,
          }),
        );

        marked.use({
          breaks: true,
          gfm: true,
        });

        isMarkdownReady = true;
      });
    }
  });


async function insertFormat(symbol, suffix = symbol) {
  const { selectionStart, selectionEnd } = editor;
  const selectedText = content.substring(selectionStart, selectionEnd);

  const before = content.substring(0, selectionStart);
  const after = content.substring(selectionEnd);

  content = `${before}${symbol}${selectedText}${suffix}${after}`;

  await tick();

  editor.focus();
  editor.setSelectionRange(
      selectionStart + symbol.length,
      selectionEnd + symbol.length,
      );
}

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      const { selectionStart } = editor;
      const before = content.substring(0, selectionStart);

      const lastNewline = before.lastIndexOf("\n");
      const currentLine = before.substring(lastNewline + 1);

      if (currentLine.match(/^(\d+)\.\s*$/) || currentLine.match(/^-\s*$/)) {
        e.preventDefault();
        const lineStart = lastNewline + 1;
        content =
          content.substring(0, lineStart) + content.substring(selectionStart);
        setTimeout(() => {
          editor.focus();
          editor.setSelectionRange(lineStart, lineStart);
        }, 0);
        return;
      }

      const numberedMatch = currentLine.match(/^(\d+)\.\s/);
      if (numberedMatch) {
        e.preventDefault();
        const currentNum = parseInt(numberedMatch[1]);
        const nextNum = currentNum + 1;
        const insertion = `\n${nextNum}. `;

        const after = content.substring(selectionStart);
        content = `${before}${insertion}${after}`;

        setTimeout(() => {
          editor.focus();
          editor.setSelectionRange(
            selectionStart + insertion.length,
            selectionStart + insertion.length,
          );
        }, 0);
        return;
      }

      const bulletMatch = currentLine.match(/^-\s/);
      if (bulletMatch) {
        e.preventDefault();
        const insertion = "\n- ";

        const after = content.substring(selectionStart);
        content = `${before}${insertion}${after}`;

        setTimeout(() => {
          editor.focus();
          editor.setSelectionRange(
            selectionStart + insertion.length,
            selectionStart + insertion.length,
          );
        }, 0);
        return;
      }
    }
  }

  function handleKeyboardShortcuts(e) {
    if (!(e.ctrlKey || e.metaKey)) return;

    const shortcuts = {
      b: { prefix: "**", suffix: "**" }, // Bold
      i: { prefix: "*", suffix: "*" }, // Italic
      d: { prefix: "~~", suffix: "~~" }, // Strikethrough
      k: { prefix: "[", suffix: "](url)" }, // Link
      e: { prefix: "```", suffix: "```" }, // Code block
      "`": { prefix: "`", suffix: "`" }, // Inline code
      q: { prefix: "> ", suffix: "" }, // Quote
    };

    const shortcut = shortcuts[e.key.toLowerCase()];
    if (shortcut) {
      e.preventDefault();
      insertFormat(shortcut.prefix, shortcut.suffix);
    }
  }

  let renderHtml = $derived.by(() => {
    if (!content) return "";

    if (!settings.markdown && isMarkdownReady && marked) {
      return DOMPurify.sanitize(marked.parse(content));
    }

    return DOMPurify.sanitize(content.replace(/\n/g, "<br>"));
  });

  let timer;
  function handleInput(e) {
    content = e.target.value;
    clearTimeout(timer);
    timer = setTimeout(() => {
      appState.updateNote(note.id, { content });
    }, 1000);
  }

  $effect(() => {
    if (note.id !== lastId) {
      content = note.content || "";
      lastId = note.id;
    }
  });
</script>

<div
  class="h-full min-h-full bg-surface-container-lowest rounded-3xl md:mx-5 flex flex-col"
>

  <div class="flex-1 min-h-0 overflow-hidden relative w-full h-full">
    {#if edit}
      <textarea
        bind:this={editor}
        name="markdown"
        oninput={handleInput}
        onkeydown={(e) => {
          handleKeyboardShortcuts(e);
          handleKeyDown(e);
        }}
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
          <div
            class="not-prose flex text-sm flex-wrap gap-2 mb-3 border-b border-b-outline-variant/50 pb-4"
          >
            {#each children as child}
              <a
                class="rounded-lg px-3 py-1 transition-all hover:bg-secondary-container active:rounded-md hover:opacity-95 bg-surface-container-high"
                href="/notes/{child.id}">{child.title || "Untitled"}</a
              >
            {/each}
          </div>
        {/if}
        <div
          class="prose prose-invert wrap-break-word prose-headings:mb-3 prose-headings:mt-6 prose-primary text-on-surface-variant max-w-none"
        >
          {#if !note.content}
            <div
              class="flex flex-col items-center justify-center h-full min-h-[360px] text-center"
            >
              <Note class="w-16 h-16 text-on-surface-variant/60 mt-4" />
              <p class="text-on-surface-variant font-medium mt-5 text-sm">
                No content
              </p>
              <Button
                class="mt-1 text-sm text-primary/80 transiton hover:text-primary"
                variant="text"
                onclick={() => (edit = !edit)}
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

    {#if edit && !settings.toolBar}
    <div
      class="sticky -bottom-1 z-999 flex items-center bg-surface-container-high gap-1.5 p-2 m-1 md:max-w-fit md:mx-auto rounded-3xl shadow-xl overflow-hidden justify-center transition-all ease-in-out duration-200"
    >
      <select
        class="p-2 text-center outline-none rounded-full appearance-none"
        onchange={(e) => {
          insertFormat(e.target.value + " ", "");
          e.target.value = "";
        }}
      >
        <option value="" disabled selected>H</option>
        <option value="#">H1</option>
        <option value="##">H2</option>
        <option value="###">H3</option>
        <option value="####">H4</option>
        <option value="#####">H5</option>
        <option value="######">H6</option>
      </select>

      {#each formatButtons as button}
        {@const Icon = button.label}
        <Button
          class="text-on-surface-variant transition-all active:brightness-75 {button.width ||
            'min-w-10'}"
          variant="normal"
          onclick={() => insertFormat(button.prefix, button.suffix)}>
        
          <Icon />
        </Button>
      {/each}
      <div class="hidden md:flex">
      {#each trailingBtns as button }
        {@const Icon = button.label}
        <Button
          class="text-on-surface-variant transition-all active:brightness-75 {button.width ||
            'min-w-10'}"
          variant="normal"
          onclick={() => insertFormat(button.prefix, button.suffix)}>
        
          <Icon />
        </Button>
        
      {/each}
      </div>

      <div class="relative md:hidden">
        <button
          class="min-w-10 transition-all active:brightness-75 h-10 rounded-full hover:bg-surface-container-highest"
          onclick={() => (showTrail = !showTrail)}
        >
          ⋮
        </button>

        {#if showTrail}
          <div
            class="fixed bottom-15 mb-2 right-0 flex flex-col gap-1 bg-surface-container-high rounded-3xl p-2 shadow-xl min-w-36 max-w-full"
            transition:slide={{ y: -100 }}
          >
            {#each trailingBtns as button}
              {@const Icon = button.label}
              <Button
                class="text-on-surface-variant transition-all active:brightness-75 justify-start {button.width ||
                  'w-full'}"
                variant="normal"
                onclick={() => {
                  insertFormat(button.prefix, button.suffix);
                  showTrail = false;
                }}
              >
                <Icon />
                <p>{button.title}</p>
              </Button>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}

</div>
