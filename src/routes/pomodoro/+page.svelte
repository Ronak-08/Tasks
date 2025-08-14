<script>
import Modal from "$lib/components/Modal.svelte";
import { pomodoro,cleanup, toggleTimer, reset, saveState } from "$lib/pomodoroStore.svelte.js";
import { onDestroy } from "svelte";

let modalOrigin = $state({ x: 0, y: 0 });
let open = $state(false);

const formatTime = $derived(() => {
  const minutes = Math.floor(pomodoro.timeSeconds / 60);
  const seconds = pomodoro.timeSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
});

onDestroy(() => {
  cleanup();
})

const openSettings = (event) => {
  open = !open;
  modalOrigin = event
    ? { x: event.clientX, y: event.clientY }
    : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
};
</script>

<Modal origin={modalOrigin} {open}>
  <header class="header-modal">
    <md-outlined-icon-button
      class="close"
      role="button"
      onclick={() => (open = false)}
    ><md-icon class="material-symbols-rounded">close</md-icon
      ></md-outlined-icon-button
    >
    <h2>Settings</h2>
  </header>
  <div class="config">
    <div class="wrap wrap-2">
      <label for="time">Focus Duration</label>
      <input
        max="180"
        min="1"
        id="time"
        type="number"
        bind:value={pomodoro.time}
        onchange={reset}
        placeholder="in mins..."
      />
    </div>
    <div class="wrap wrap-2">
      <label for="restInput">Rest Duration</label>
      <input
        id="restInput"
        max="30"
        min="2"
        type="number"
        bind:value={pomodoro.rest}
        onchange={reset}
        placeholder="(in mins...)"
      />
    </div>
  </div>
  <div class="card wrap-2">
    Auto start next phase  <md-switch selected={pomodoro.confirmNext}
      onchange={(event) => {
        pomodoro.confirmNext = event.target.selected;
        saveState();
      }} ></md-switch>
  </div>
</Modal>

<main class="pomodoro">
  <div class="wrap">
    <h1 class={pomodoro.currentPhase === "work" ? "phase-work" : "phase-break"}>
      <md-icon class="icon material-symbols-rounded">
        {pomodoro.currentPhase === "work" ? "timer" : "coffee"}
      </md-icon>
      {pomodoro.currentPhase === "work" ? "Focus" : "Break"}
    </h1>
    <md-filled-tonal-icon-button
      class="settingBtn"
      onclick={() => {
        openSettings();
      }}
    ><md-icon class="material-symbols-rounded">settings</md-icon
      ></md-filled-tonal-icon-button
    >
  </div>
  <button onclick={toggleTimer} class="timer">{formatTime()}</button>
  <md-filled-tonal-icon-button class="reset" onclick={reset}
  ><md-icon class="material-symbols-rounded">refresh</md-icon
    ></md-filled-tonal-icon-button
  >
</main>

<style>
.pomodoro {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}
h1 {
  font-weight: 200;
  font-size: 1.1rem;
  padding: 5px 17px;
  background-color: var(--md-sys-color-primary-container);
  margin-bottom: 3rem;
  color: var(--md-sys-color-on-primary-container);
  border-radius: 52px;
  width: fit-content;
}
.phase-break {
  background-color: var(--md-sys-color-tertiary-container);
  color: var(--md-sys-color-on-tertiary-container);
}
.timer {
  font-size: clamp(5rem, calc(7vw - 10%), 6rem);
  margin: var(--space-large);
  transition: 0.2s all ease-out;
}
.timer:active {
  transform: scale(0.96);
}
.icon {
  vertical-align: middle;
  font-size: 1.3rem;
}
.reset {
  --md-filled-tonal-icon-button-container-width: 60px;
  --md-filled-tonal-icon-button-container-height: 60px;
  margin: 1rem;
}

.header-modal {
  display: flex;
  margin: 1rem;
  gap: 2rem;
  align-items: center;
}
.config {
  background-color: var(--md-sys-color-surface-container-lowest);
  color: var(--md-sys-color-on-surface-container);
  display: flex;
  border-radius: 16px;
  flex-direction: column;
  margin: 3rem 1rem;
  padding: var(--space-medium);
}
input {
  padding: 12px;
  margin: var(--space-small);
  background-color: var(--md-sys-color-surface-container);
  width: 20%;
  border-radius: 16px;
  transition: 0.3s all ease;
}
input[type="number"]:placeholder-shown, input[type="number"]:invalid   {
  border: 2px solid var(--md-sys-color-error);
}

.wrap {
  display: flex;
  gap: 0.8rem;
}
.wrap-2 {
  align-items: center;
  justify-content: space-between;
}
.card {
  background-color: var(--md-sys-color-surface-container-lowest);
  color: var(--md-sys-color-on-surface-container);
  display: flex;
  margin: 3rem 1rem;
  padding: var(--space-medium);
  border-radius: 16px;
}
</style>
