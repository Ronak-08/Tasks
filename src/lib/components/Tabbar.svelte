<script>
import { page } from "$app/stores";
import IconHomeOutline from '~icons/material-symbols/home-outline';
import IconHomeFilled from '~icons/material-symbols/home';
import IconNotesOutline from '~icons/material-symbols/note-stack-outline';
import IconNotesFilled from '~icons/material-symbols/note-stack';
import Account from "~icons/material-symbols/person-add";
    import { appState } from "$lib/state.svelte";

let path = $derived($page.url.pathname);

const links = [
  { label: 'Tasks', href: '/', icon: IconHomeOutline, activeIcon: IconHomeFilled },
  { label: 'Notes', href: '/notes', icon: IconNotesOutline, activeIcon: IconNotesFilled },
];

function isActive(href) {
  if (href === '/') return path === '/';
  return path.startsWith(href);
}
</script>

<nav class="
  flex flex-row z-50 bg-surface-container-low border-outline-variant/20 
  w-full h-[70px] border-t
  md:w-24 lg:w-28 md:h-full md:flex-col md:justify-between md:py-3 md:border-r md:border-t-0
  ">
  <div class="
    flex items-center justify-around w-full h-full
    md:flex-col md:justify-start md:gap-3 md:pt-6
    ">
    {#each links as link}
      {@const active = isActive(link.href)}
      {@const IconComponent = active ? link.activeIcon : link.icon}

      <a 
        href={link.href} 
        class="
         flex flex-col items-center justify-center gap-1 
        w-14 h-full md:w-full md:h-auto md:py-2
        transition-opacity hover:opacity-100 outline-none
        "
      >
        <div class="
          flex items-center justify-center rounded-full transition-colors duration-200
          w-16 h-8 md:w-14 md:h-8
          {active 
            ? 'bg-primary-container/80 text-on-primary-container' 
            : 'text-on-surface-variant group-hover:bg-on-surface/10'}
          ">
          <IconComponent class="text-xl" />
        </div>

        <span class="
          text-[11px] font-medium truncate max-w-full px-1
          transition-colors duration-200
          {active ? 'text-on-surface' : 'text-on-surface-variant'}
          ">
          {link.label}
        </span>
      </a>
    {/each}
  </div>

  <div class="hidden md:flex md:flex-col">
  {#if appState.authLoading}
    <div class="h-9 w-9 rounded-full animate-pulse bg-surface-container-high"></div>
  {:else if appState.user}
    <!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
    <div 
      class="flex flex-col justify-center items-center"
    >
      <img aria-label={appState.user.displayName} class="rounded-full text-center object-cover size-9 border border-outline-variant" src={appState.user.photoURL} alt={appState.user.displayName} />
        <button class="border border-outline-variant cursor-pointer mt-2 px-2 py-1 text-sm rounded-full" onclick={() => appState.logout()}>Sign out</button>
    </div>

{:else}
  <a 
    href="/login" 
    class="
      flex items-center justify-center border border-outline-variant py-2 px-3 w-fit mx-auto rounded-full
      hover:bg-on-surface/10 transition outline-none
      text-on-surface-variant 
    "
  >
      <Account class="text-2xl md:text-xl" />
  </a>
{/if}

    </div>

</nav>
