<script>
import "../app.css";
import { onMount } from "svelte";
import { browser } from "$app/environment";
import { page } from "$app/stores";
import { goto } from "$app/navigation";
import { fade, slide } from "svelte/transition";
import { user, initializeAuth } from "$lib/userStore.js";
import { clearNotes } from "$lib/noteStore.svelte.js";
import { clearTasks } from "$lib/taskStore.svelte.js";
import { searchQuery } from "$lib/index.svelte.js";

let { children } = $props();
let path = $derived($page.url.pathname);
let showWelcome = $state(false);
let showParagraph = $state(false);
let step = $state(1);

onMount(() => {
  import("@material/web/common.js");
  import("@material/web/fab/fab.js");
  import("@material/web/button/filled-tonal-button.js");
  import("@material/web/iconbutton/outlined-icon-button.js");
  import("@material/web/iconbutton/filled-tonal-icon-button.js");
  import ('katex/dist/katex.min.css');


  if (browser && "serviceWorker" in navigator) {
    navigator.serviceWorker.register("/service-worker.js").catch((error) => {
      console.error("Service Worker registration failed:", error);
    });
  }

  initializeAuth();
});
async function handleLogout() {
  try {
    const { getFirebase } = await import("$lib/firebase.js");
    const { signOut } = await import("firebase/auth");
    const { auth } = await getFirebase();

    await signOut(auth);

    clearNotes();
    clearTasks();
    showParagraph = false;
    goto("/");
  } catch (error) {
    console.error("Logout failed:", error);
  }
}

function toggleParagraph() {
  showParagraph = !showParagraph;
}
</script>

<div class="app">
    <div class="sideBar">
      <img src="/logo.png" class="logo" alt="logo" />
      <a href="/" class="link"
      ><md-icon class:active={path === "/"}>task</md-icon>
        <p class:active={path === "/"}>Tasks</p></a
      >
      <a href="/pomodoro" class="link"
      ><md-icon class:active={path === "/pomodoro"}>schedule</md-icon>
        <p class:active={path === "/pomodoro"}>Pomodoro</p></a
      >
      <a href="/notes" class="link"
      ><md-icon class:active={path === "/notes"}>docs</md-icon>
        <p class:active={path === "/notes"}>Notes</p></a
      >

      <div class="account">

        {#if $user}
          <button class="logout" onclick={handleLogout}>
            <md-icon>logout</md-icon>
            Logout
          </button>


          <button class="btn">
            {#if $user && $user.photoURL}
              <img
                class="profileImage"
                src={$user.photoURL}
                alt="User Profile"
              />
            {:else}
              <md-icon class="profileIcon">account_circle</md-icon>
            {/if}
            {$user?.displayName || "User"}
          </button>
        {:else}
          <a class="noLogin2" href="/login"
          ><span class="material-symbols-rounded"> person_add </span> Sign in</a
          >
        {/if}
      </div> 
    </div>

<div class="content-wrap">
  {#if path !== "/pomodoro" && path !== "/login"}
    <header transition:slide={{ duration: 250 }}>
      <input
        type="text"
        placeholder="Search..."
        bind:value={searchQuery.query}
        class="search"
      />

        {#if $user}
          <div class="profile">
          <button class="btn" onclick={toggleParagraph}>
            {#if $user.photoURL}
              <img
                class="profileImage"
                src={$user.photoURL}
                alt="User Profile"
              />
            {:else}
              <md-icon class="profileIcon">account_circle</md-icon>
            {/if}
          </button>

          {#if showParagraph}
            <div onclick={() => showParagraph = false} class="overlay"></div>
            <div transition:fade={{ duration: 200 }} class="info">
              <p class="greet">
                {#if $user.photoURL}
                  <img
                    class="profileImage"
                    src={$user.photoURL}
                    alt="User profile"
                  />
                {:else}
                  <img
                    class="profileImage"
                    src="/favicon.png"
                    alt="Default profile"
                  />
                {/if}
                Welcome, {$user?.displayName || "User"}
              </p>
              <md-filled-tonal-button onclick={handleLogout}>
                Log Out
              </md-filled-tonal-button>
            </div>
          {/if}
      </div>
        {:else}
          <a class="noLogin" href="/login">
            <span class="material-symbols-rounded">person_add</span>
          </a>
        {/if}
    </header>
  {/if}


    {#key $page.url.pathname}
      <main in:fade={{ duration: 150, delay: 150 }}>
        {@render children?.()}
      </main>
    {/key}

      <div class="navigation">
        <a href="/"
        ><md-icon class:active={path === "/"}>task</md-icon>
          <p class:active={path === "/"}>Tasks</p></a
        >
        <a href="/pomodoro"
        ><md-icon class:active={path === "/pomodoro"}>schedule</md-icon>
          <p class:active={path === "/pomodoro"}>Pomodoro</p></a
        >
        <a href="/notes">
          <md-icon class:active={path === "/notes"}>docs</md-icon>
          <p class:active={path === "/notes"}>Notes</p></a
        >
      </div>
  </div>
</div>

<style>
.app {
  display: flex;
  height: 100dvh;
}
main {
  flex-grow: 1;
  overflow-y: auto;
  inset: 0;
}
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backdrop-filter: blur(8px);
  background: rgba(0, 0, 0, 0.5);
  z-index: 98;
}
.btn {
  z-index: 99;
}
.account .btn {
  display: flex;
  align-items: center;
  margin: 0.8rem 0.2rem;
  background-color: var(--md-sys-color-surface-container);
  padding: 6px;
  border-radius: 13px;
  text-wrap-mode: nowrap;
  gap: 10px;
  width: 100%;
}

.sideBar {
  display:none;
  flex-direction: column;
  height: 100%;
  margin: auto 0;
  width: 190px;
  background-color: var(--md-sys-color-surface-container-lowest);
  border-radius: 10px 10px 0 0;
  box-shadow: 1px 0px 8px rgba(0, 0, 0, 0.4);
  padding: 0.7rem;
}
.account {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: auto;
  width: 100%;
}
.sideBar .link md-icon {
  border-radius: 10px;
  padding: 0.5rem;
}
.sideBar a {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: var(--space-small);
  font-size: 0.9rem;
}
.content-wrap {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  position: relative;
}
header {
  display: flex;
  margin: 1rem 1.5rem;
  align-content: center;
  justify-content: space-between;
  gap: 10px;
  flex-shrink: 0;
}
.profileImage {
  width: 50px;
  border-radius: 36px;
  transition: all 0.3s ease;
}
.profileIcon {
  font-size: 2.5rem;
  transition: all 0.3s ease;
}
.profileImage:hover,
.profileIcon:hover {
  transform: scale(0.95);
}
.account .profileImage {
 width: 34px;
}
.account .profileIcon {
   font-size: 1.7rem;
  margin: 0;
}
.info {
  position: absolute;
  right: 10px;
  top: 5rem;
  display: flex;
  flex-direction: column;
  z-index: 99;
  padding: 1rem;
  background-color: var(--md-sys-color-surface-container-high);
  opacity: 0.9;
  border-radius: 16px;
  box-shadow: 0px -2px 7px var(--md-sys-color-shadow);
  font-weight: 500;
}
.noLogin {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--md-sys-color-surface-container-high);
  padding: 10px;
  border-radius: 99px;
  height: 50px;
  width: 50px;
  margin: auto 10px;
}
.noLogin span {
  font-size: 1.4rem;
}
.greet {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-direction: column;
  margin: 1rem;
}
.greet img {
  width: 60px;
}
.navigation {
  display: flex;
  justify-content: space-around;
  padding: 0.5rem;
  z-index: 10;
  background-color: var(--md-sys-color-surface-container-high);
  color: var(--md-sys-color-on-surface-variant);
  width: 100%;
}
.navigation > * {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 0.8rem;
  width: 100%;
  font-weight: 500;
  flex-shrink: 1;
}
md-icon.active {
  background-color: var(--md-sys-color-primary-container);
  font-variation-settings: "FILL" 1;
  color: var(--md-sys-color-on-primary-container);
}
p.active {
  color: var(--md-sys-color-on-surface);
}
md-icon {
  width: fit-content;
  border-radius: 36px;
  --md-icon-font: "Material Symbols Rounded";
  transition: background-color 0.3s ease;
  margin-bottom: 4px;
  height: fit-content;
  padding: 5px 18px 5px 18px;
}
.logo {
  width: 70px;
  height: 70px;
  margin: 1rem auto 2rem;
  background-color: var(--md-sys-color-surface-container-lowest);
  border-radius: 32px;
}
.noLogin2 {
  padding: 0.5rem 17px;
  background-color: var(--md-sys-color-surface-container);
  border-radius: 16px;
}
.logout {
  display: flex;
  align-items: center;
  background-color: var(--md-sys-color-surface-container);
  padding: 0.3rem;
  border-radius: 16px;
  width: 100%;
}
.sideBar md-icon {
padding: 5px 10px 5px;
}
.sideBar p.active {
  color: var(--md-sys-color-primary);
}

@media (min-width: 768px) {
.sideBar {
  display: flex;
  }
  .profile {
   display: none;
  }
  .navigation {
   display: none;
  }
  .noLogin {
    display: none;
  }
}
@media (min-width: 1024px) {
  header {
    padding: 0.5rem;
  }
  .search {
    width: 70%;
  }
}

</style>
