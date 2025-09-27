<script>
import Modal from "$lib/components/Modal.svelte";
import "@material/web/switch/switch.js";
import { pomodoro,cleanup, toggleTimer, reset, uniqueLabels,dailyInsights,weeklyInsights , saveState } from "$lib/pomodoroStore.svelte.js";
import { onDestroy } from "svelte";

let modalOrigin = $state({ x: 0, y: 0 });
let open = $state(false);
let openInsights = $state(false);

const formatTime = $derived(() => {
  const minutes = Math.floor(pomodoro.timeSeconds / 60);
  const seconds = pomodoro.timeSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
});

let insights = $derived(dailyInsights());
let weeklyData = $derived(weeklyInsights());
let labels = $derived(uniqueLabels());
let hasInsights = $derived(() => {
  insights.byLabel.length > 0 }
);
onDestroy(() => {
  cleanup();
})

const openSettings = (event) => {
  open = !open;
};
</script>

<Modal {open}>
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
        defaultvalue="Work"
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

<Modal open={openInsights}>
  <header class="header-modal">
    <md-outlined-icon-button
      class="close"
      role="button"
      onclick={() => (openInsights = false)}
    ><md-icon class="material-symbols-rounded">close</md-icon
      ></md-outlined-icon-button
    >
    <h2>Insights</h2>
  </header>


  <div class="insights-card">
    <h3>Today's Focus</h3>
    <div class="totalTime">Total (mins) <br> <strong><p class="mins">{insights.totalMinutes}</p></strong></div>
    {#if hasInsights}
      <ul>
        {#each insights.byLabel as [label,duration], i}
          <li class="daily-entry" >
            <span> {#if i === 0}🏆{/if} {label} </span>
            <span>{duration} min</span>
          </li>
        {/each}
      </ul>
    {:else}
      <p>No focus sessions logged today. Let's get to it!</p>
    {/if}

    <md-divider></md-divider>

    <h3>Last 7 Days</h3>
    {#if weeklyData.length > 0}
      <div class="weekly-list">
        {#each weeklyData as dayEntry}
          <div class="day-container">
            <h4 class="day-header">{dayEntry.day}</h4>
            <ul>
              {#each Object.entries(dayEntry.insights) as [label, minutes]}
                <li>
                  <span>{label}:</span>
                  <span>{minutes} min</span>
                </li>
              {/each}
            </ul>
          </div>
        {/each}
      </div>
    {:else}
      <p class="text-p">No focus sessions logged in the past week.</p>
    {/if}

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
    <md-filled-tonal-icon-button
      class="settingBtn"
      onclick={() => {
        openInsights = true;
      }}
    ><md-icon class="material-symbols-rounded">analytics</md-icon
      ></md-filled-tonal-icon-button>
  </div>
  <div class="label-input">
    <input
      type="text"
      placeholder="Label"
      bind:value={pomodoro.currentLabel}
      class="label"
      maxlength="60"
      list="known-labels"
      disabled={pomodoro.isRunning}
    />
    <datalist id="known-labels">
      {#each labels as label}
        <option value={label}>{label}</option>
      {/each}
    </datalist>
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
  padding: 7px 17px;
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
  font-size: clamp(5rem, calc(8vw - 10%), 7rem);
  font-weight: 600;
  margin: var(--space-large);
  transition: 0.2s all ease-out;
}
.timer:active {
  transform: scale(0.96);
}
.icon {
  vertical-align: middle;
  font-size: 1.4rem;
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
.label-input {
  width: 100%;
  display: flex;
  justify-content: center;
}
.label {
  width: 30%;
  background-color: rgba(0, 0, 0, 0.3);
  color: var(--md-sys-color-primary);
  font-weight: 500;
  font-size: 1rem;
  text-align: center;
  border-radius: 32px;
}
.insights-card {
  padding: var(--space-medium);
}
.insights-card h3 {
  margin: 2rem 0.5rem;
}
.totalTime {
  background-color: var(--md-sys-color-tertiary-container);
  padding: 7px 15px;
  margin: 1rem;
  text-align: center;
  width: fit-content;
  font-size: 0.9rem;
  border-radius: 10px;
}
.totalTime .mins {
  margin: 0.5rem 0;
  color: var(--md-sys-color-on-tertiary-container);
  font-size: 2.6rem;
}
.insights-card ul {
  margin: var(--space-medium);
  display: flex;
  flex-direction: column;
  gap: 5px;
  max-height: 250px;
  overflow: auto;
}
.daily-entry {
  display: flex;
  justify-content: space-between;
  padding: var(--space-medium);
  background-color: var(--md-sys-color-surface-container-low);
  border-radius: 16px;
}
.weekly-list {
  display: flex;
  gap: 10px;
  margin: var(--space-medium);
}
.day-container {
  background-color: var(--md-sys-color-surface-container);
  width: fit-content;
  display: flex;
  flex-direction: column;
  border-radius: 13px;
  justify-content: center;
  padding: 10px;
  font-size: 0.9rem;
  max-height: 200px;
  overflow-y: auto;
}
.text-p {
  text-align: center;
  padding-top: 2rem;
  font-size: 0.9rem;
  color: var(--md-sys-color-on-surface-variant);
}
</style>
