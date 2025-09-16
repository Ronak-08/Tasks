<script>
import "../app.css";
import { onMount } from "svelte";
import { browser } from "$app/environment";
import { page } from "$app/stores";
import { goto } from "$app/navigation";
import { fade, slide } from "svelte/transition";
import { breakpoints } from "$lib/breakpoints.js";
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

  const stored = localStorage.getItem("welcomeDismissed");
  if (stored !== "true") {
    showWelcome = true;
  }

  if (browser && "serviceWorker" in navigator) {
    navigator.serviceWorker.register("/service-worker.js").catch((error) => {
      console.error("Service Worker registration failed:", error);
    });
  }

  initializeAuth();
});

function dismissWelcome() {
  showWelcome = false;
  localStorage.setItem("welcomeDismissed", "true");
}
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

{#if showWelcome}
  <div transition:fade={{ duration: 300 }} class="welcome">
    {#if step === 1}
      <h1>Welcome</h1>
      <md-filled-button class="getStarted" onclick={() => (step = 2)}>
        <md-icon class="material-symbols-rounded">arrow_forward</md-icon>
      </md-filled-button>
    {:else if step === 2}
      <div transition:fade={{ duration: 300 }} class="page2">
        <h2>About this app 🚀</h2>
        <p>
          This app helps you stay organized with tasks, notes, focus tools, 
          and optional syncing. Here’s how to get started:
        </p>
        <ul>
          <li>∘ Hold a task to delete it.</li>
          <li>∘ Select multiple notes to delete them at once.</li>
          <li>∘ Use <code>#</code> in the search bar to filter by tags.</li>
        </ul>
        <button class="start" onclick={dismissWelcome}>Start</button>
      </div>
    {/if}

  </div>
{/if}

<div class="app">
  {#if $breakpoints.isTablet || $breakpoints.isDesktop || $breakpoints.isLargeDesktop}
    <div class="sideBar">
      <img src="/logo.png" class="logo" alt="logo" />
      <a href="/" class="link"
      ><md-icon class:active={path === "/"}>edit</md-icon>
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
    </div>
  {/if}

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
          <button class="btn" onclick={toggleParagraph}>
            {#if $user && $user.photoURL}
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
            <div class="overlay"></div>
            <div transition:fade={{ duration: 200 }} class="info">
              <p class="greet">
                {#if $user && $user.photoURL}
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
        {:else}
          <a class="noLogin" href="/login"
          ><span class="material-symbols-rounded"> person_add </span></a
          >
        {/if}
      </header>
    {/if}
    {#key $page.url.pathname}
      <main in:fade={{ duration: 150, delay: 150 }}>
        {@render children?.()}
      </main>
    {/key}

    {#if $breakpoints.isMobile}
      <div class="navigation">
        <a href="/"
        ><md-icon class:active={path === "/"}>edit</md-icon>
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
    {/if}
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

.sideBar {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: fit-content;
  background-color: var(--md-sys-color-surface-container);
  border-radius: 10px 10px 0 0;
  border-right: 1.3px solid var(--md-sys-color-outline-variant);
  padding: 0.9rem;
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
@media (min-width: 1024px) {
  header {
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
    padding: 0.5rem;
  }
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
  border-radius: 32px;
  --md-icon-font: "Material Symbols Rounded";
  transition: background-color 0.3s ease;
  margin-bottom: 4px;
  height: fit-content;
  padding: 5px 18px 5px 18px;
}
.welcome {
  background: url("/blob-scene-haikei.svg") center/cover no-repeat;
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-small);
  z-index: 99;
}
.welcome .page2 {
  height: 100%;
  width: 100%;
  margin: 1rem;
  padding: 1rem;
  font-weight: 500;
}
.page2 p {
  margin: 2rem 10px 2rem 7px;
  font-size: 0.93rem;
  color: var(--md-sys-color-on-surface-variant);
}
.page2 ul {
  background-color: var(--md-sys-color-secondary-container);
  border-radius: 16px;
  opacity: 0.87;
  color: var(--md-sys-color-on-secondary-container);
  line-height: 2;
  padding: 1rem;
}
.page2 .start {
  padding: 0.6rem;
  width: 80px;
  border-radius: 32px;
  background-color: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);

  position: absolute;
  left: 50%;
  bottom: 10%;
  transform: translateX(-50%); 
}

@media (min-width: 1024px) {
  .welcome {
    background-size: 100% auto;
    background-position: center top;
  }
}

.welcome h1 {
  font-size: 3.4rem;
  margin: var(--space-medium);
  font-weight: 500;
}
h1 {
  font-size: 2.7rem;
  word-spacing: 0.9;
  font-weight: 500;
  margin: 1rem;
}
.logo {
  width: 80px;
  height: 80px;
  margin: 1rem auto;
  background-color: var(--md-sys-color-surface-container-lowest);
  border-radius: 32px;
}
.getStarted {
  padding: 0.6rem;
  margin-top: 2rem;
}
.getStarted md-icon {
  display: flex;
  align-items: center;
}
</style>
