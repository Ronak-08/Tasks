<script>
  import {
    completedTask,
    deleteTask,
    updateTask,
    addTask,
    filteredTasks,
    ongoingTasks,
    completedTasks,
    loadTasks,
  } from "$lib/taskStore.svelte.js";
  import { onMount } from "svelte";
  import { slide, fly } from "svelte/transition";
  import { searchQuery } from "$lib/index.svelte.js";

  let state = $state({
    predefinedTags: ["Urgent", "Work", "Study", "Personal", "Games"],
    customTag: "",
    showCompleted: true,
    showModal: false,
    showOptions: false,
    editingTask: null,
    deleteDialog: { open: false, task: null },
    formData: {
      task: "",
      description: "",
      dueDate: "",
      subtasks: [],
      tags: [],
      priority: "",
    },
  });
  let subtaskInput = $state("");
  let filtered = $derived(filteredTasks());
  const HOLD_DURATION = 800;
  let holdTimer = null;


  function handleHoldStart(task) {
    holdTimer = setTimeout(() => {
      state.deleteDialog = { open: true, task };
    }, HOLD_DURATION);
  }
  function handleHoldCancel() {
    clearTimeout(holdTimer);
  }


  function addSubtask() {
    if (!subtaskInput.trim()) return;
    state.formData.subtasks.push({
      task: subtaskInput.trim(),
      completed: false,
    });
    subtaskInput = "";
  }
  function deleteSubtask(task, subtaskIndex) {
    task.subtasks.splice(subtaskIndex, 1);
    updateTask(task);
  }

  function toggleCompletedVisibility() {
    state.showCompleted = !state.showCompleted;
  }

let taskVisibility = $state({});
	function toggleSubtaskVisibility(taskId) {
		taskVisibility[taskId] = !taskVisibility[taskId];
	}

  function confirmDelete() {
    if (state.deleteDialog.task) {
      deleteTask(state.deleteDialog.task);
    }
  cancelDelete();
}

function cancelDelete() {
  state.deleteDialog = { open: false, task: null };
}

function openTaskModal(task = null, event) {
  if (task) {
    state.editingTask = task;
    Object.assign(state.formData, {
      task: task.task || "",
      description: task.description || "",
      dueDate: task.dueDate || "",
      tags: [...(task.tags || [])],
      priority: task.priority,
      subtasks: [...(task.subtasks || [])],
    });

    state.formData.tags.forEach((tag) => {
      if (!state.predefinedTags.includes(tag)) {
        state.predefinedTags = [...state.predefinedTags, tag];
      }
    });
  } else {
    state.editingTask = null;
    state.formData = {
      task: "",
      description: "",
      dueDate: "",
      tags: [],
      priority: "",
      subtasks: [],
    };
  }
  state.showModal = true;
}

function handleSubmit() {
  if (!state.formData.task.trim()) return;

  if (state.editingTask) {
    updateTask({ ...state.editingTask, ...state.formData });
  } else {
    addTask(state.formData);
  }

  state.showModal = false;
}

function toggleTag(tag) {
  state.formData.tags = state.formData.tags.includes(tag)
    ? state.formData.tags.filter((t) => t !== tag)
    : [...state.formData.tags, tag];
}

function addCustomTag() {
  const newTag = state.customTag.trim();
  if (newTag && !state.formData.tags.includes(newTag)) {
    state.formData.tags = [...state.formData.tags, newTag];
    if (!state.predefinedTags.includes(newTag)) {
      state.predefinedTags = [...state.predefinedTags, newTag];
    }
    state.customTag = "";
  }
}

onMount(loadTasks);
</script>



  <md-fab
    role="button"
    class="plus"
    variant="primary"
    onclick={(event) => openTaskModal(null, event)}
    aria-label="Add Task"
  >
    <md-icon class="material-symbols-rounded" slot="icon">add</md-icon>
  </md-fab>

{#if state.deleteDialog.open}
  <div class="overlay"></div>
  <md-dialog class="deleteDialog" open>
    <div slot="headline" class="heading">Delete Task?</div>
    <div slot="content">
      Are you sure you want to delete this task? This action cannot be undone.
    </div>
    <div slot="actions" class="actions">
      <md-text-button class="b1" onclick={cancelDelete}>Cancel</md-text-button>
      <md-filled-button class="b1" onclick={confirmDelete}
      >Delete</md-filled-button
      >
    </div>
  </md-dialog>
{/if}

{#if state.showModal}
  <div class="overlay"></div>
  <div
    in:fly={{ y: 100, duration: 200 }}
    out:fly={{ y: 100, duration: 200 }}
    class="hiddenContainer"
  >
    <div class="high">
      <md-outlined-icon-button
        class="close"
        role="button"
        onclick={() => (state.showModal = false)}
      ><md-icon class="material-symbols-rounded">close</md-icon
        ></md-outlined-icon-button
      >
      <h2>Task</h2>
      <md-filled-button form="form-id" class="add" type="submit">
        Save
      </md-filled-button>
    </div>

    <form class="popup" onsubmit={handleSubmit} id="form-id">
      <div class="mainInput">
        <md-outlined-text-field
          label="Task Name"
          type="text"
          maxlength="500"
          required
          class="textField"
          value={state.formData.task}
          oninput={(event) => (state.formData.task = event.target.value)}
        ></md-outlined-text-field>

        <md-outlined-text-field
          label="Description"
          class="textField"
          type="text"
          value={state.formData.description}
          oninput={(event) => (state.formData.description = event.target.value)}
        ></md-outlined-text-field>

        <div class="wrap">
          <input
            class="subtask-input"
            bind:value={subtaskInput}
            placeholder="New subtask..."
            onkeydown={(e) => {
              if (e.key === "Enter" && subtaskInput.trim()) {
                e.preventDefault();
                addSubtask();
                subtaskInput = "";
              }
            }}
          />
          <button type="button" class="subtask-btn" onclick={addSubtask}>Add</button>
        </div>
      </div>
            <button type="button" class="completed-header moreOptions" onclick={() => state.showOptions = !state.showOptions}>
        <md-ripple></md-ripple>
        <h3>Show more options</h3>
        <span
          class="material-symbols-rounded icon-toggle"
          class:collapsed={!state.showOptions}
        >
          expand_more
        </span>
      </button>


      {#if state.showOptions}
        <div class="misc">
          <div class="taskwrap">
          <label for="due-date">Due date and time</label>
          <input
            id="due-date"
            type="datetime-local"
            class="dateTime"
            bind:value={state.formData.dueDate}
          />
      </div>

          <div class="taskwrap">
          <label for="priority">Priority</label>
          <select
            bind:value={state.formData.priority}
            id="priority"
            name="priority"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
      </div>
        </div>

        <div class="tags">
          <md-chip-set>
            {#each state.predefinedTags as tag}
              <md-filter-chip
                onclick={() => toggleTag(tag)}
                role="button"
                selected={state.formData.tags.includes(tag)}
                type="button"
              >
                {tag}
              </md-filter-chip>
            {/each}
          </md-chip-set>
          <div class="customTagWrap">
            <input
              type="text"
              maxlength="40"
              placeholder="Add Custom Tag"
              bind:value={state.customTag}
            />
            <md-filled-tonal-button
              class="tagBtn"
              type="button"
              role="button"
              onclick={addCustomTag}
            >
              Add Tag
            </md-filled-tonal-button>
          </div>
        </div>
      {/if}
    </form>
  </div>
{/if}



{#if filtered.length > 0}
<div class="task-wrap">
  <ul class="ongoingTasks">
    <h3>Ongoing Tasks</h3>
    {#each ongoingTasks() as task (task.id)}
      {@const isOverdue =
        task.dueDate &&
        !task.completed &&
        new Date() > new Date(task.dueDate)}
      <li
        transition:slide={{ duration: 300 }}
        class="ongoingList {task.priority}"
          onclick={() => toggleSubtaskVisibility(task.id)}
      >
        <md-ripple></md-ripple>
        <button
          onclick={() => openTaskModal(task, event)}
          onmousedown={() => handleHoldStart(task)}
          onmouseup={handleHoldCancel}
          onmouseleave={handleHoldCancel}
          ontouchstart={() => handleHoldStart(task)}
          ontouchend={handleHoldCancel}
        >
          <div class="wrap-text">
            <p class="title">{task.task}</p>
            {#if task.description}
              <p class="desc">{task.description}</p>
            {/if}
          </div>
        </button>
        <div class="wrap2">
          {#if isOverdue}
            <span class="tag due-tag">Due</span>
          {/if}
          <div class="wrap3">
            {#each task.tags || [] as tag}
              <span class="tag">{tag}</span>
            {/each}
          </div>
          <div>
            <md-checkbox
                onchange={() => completedTask(task)}
                onclick={(e) => e.stopPropagation()}
                touch-target="wrapper"
              ></md-checkbox>
            </div>
          </div>
        </li>

        {#if taskVisibility[task.id] && task.subtasks.length}
          <div transition:slide={{duration: 300}} class="subtask-list">
            {#each task.subtasks as subtask, i}
              <div class:checkbox1={subtask.completed} onclick={() => completedTask((subtask))} class="subtask" >
                <p>
                {subtask.task}
                </p>
                <button class="sub-delete" onclick={() => deleteSubtask(task, i)}>
                  <span class="material-symbols-rounded"> delete </span>
                </button>
              </div>
            {/each}
          </div>
         {/if}
      {/each}
      {#if ongoingTasks().length === 0}
        <p class="noTasks">No ongoing tasks</p>
      {/if}
    </ul>



    <div class="completed-section">
      <button class="completed-header" onclick={toggleCompletedVisibility}>
        <md-ripple></md-ripple>
        <h3>Completed ({completedTasks().length})</h3>
        <span
          class="material-symbols-rounded icon-toggle"
          class:collapsed={!state.showCompleted}
        >
          expand_more
        </span>
      </button>

      {#if state.showCompleted && completedTasks().length > 0}
        <ul class="completedTasks" transition:slide={{ duration: 300 }}>
          {#each completedTasks() as task (task.id)}
            <li class="completedList">
              <md-ripple></md-ripple>
              <div class="wrap">
                <md-checkbox
                  checked={task.completed}
                  onchange={() => completedTask(task)}
                  touch-target="wrapper"
                ></md-checkbox>
                <span>{task.task}</span>
              </div>
              <button class="delete" onclick={() => deleteTask(task)}>
                <span class="material-symbols-rounded"> delete </span>
              </button>
            </li>
          {/each}
          {#if completedTasks().length === 0}
            <p class="NotFoundTask">None</p>
          {/if}
        </ul>
      {/if}
    </div>
  </div>


{:else if searchQuery.query.trim() !== ""}
  <p class="NotFound">No matching tasks found.</p>
{:else}
  <p class="NotFound">No tasks yet. Add one!</p>
{/if}



<style>
  ul {
    list-style: none;
    padding: 0;
  }
  .completed-section,
  .ongoingTasks {
    overflow: hidden;
    background-color: var(--md-sys-color-surface-container-lowest);
    margin: var(--space-medium);
    margin-top: 0.2rem;
    border-radius: 16px;
  }
  .completed-header {
    display: flex;
    align-items: center;
    position: relative;
    justify-content: space-between;
    width: 100%;
    margin: 5px 0;
    cursor: pointer;
    text-align: left;
    color: inherit;
  }
  .moreOptions {
    background-color: var(--md-sys-color-surface-container-low);
    border-radius: 16px;
  }
  .moreOptions h3 {
    color: var(--md-sys-color-tertiary);
  }
  .icon-toggle {
    transition: transform 0.2s ease-in-out;
    margin-right: 5px;
  }
  .icon-toggle.collapsed {
    transform: rotate(-90deg);
  }
  .high {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 0.5rem;
  }
  .ongoingTasks,
  .completedTasks {
    outline: none;
    transition: all 0.3s ease-in;
  }
  .ongoingTasks {
    padding: 0.5rem;
  }
  .completedTasks {
    border-radius: 16px;
    margin: 1rem;
  }
  h3 {
    margin: 1.2rem;
    color: var(--md-sys-color-primary);
    font-size: 0.85rem;
    font-weight: 500;
  }
  .ongoingTasks h3 {
    margin-bottom: 2rem;
  }
  .ongoingList,
  .completedList {
    padding: var(--space-medium);
    background-color: var(--md-sys-color-surface-container-low);
    color: var(--md-sys-color-on-surface-container);
    -webkit-user-select: none;
    -ms-user-select: none;
    user-select: none;
    border-radius: 14px;
    position: relative;
    display: flex;
    max-height: 80px;
    transition: all 0.3s ease-in;
    overflow: hidden;
    z-index: 5;
    justify-content: space-between;
    align-items: center;
    gap: 0.3rem;
    margin: var(--space-small);
    font-weight: 500;
  }
  .ongoingList button {
    width: 100%;
    max-width: 50%;
    text-align: left;
  }
  .wrap-text {
    display: flex;
    flex-direction: column;
    max-width: 80%;
    width: 100%;
  }
  .wrap-text > * {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .title {
    font-size: 0.95rem;
  }
  .desc {
    font-size: 0.78rem;
    line-height: 2;
    font-weight: 400;
    color: var(--md-sys-color-on-surface-variant);
  }
  .tag {
    background-color: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
    position: relative;
    box-shadow: 0 -1px 8px rgba(0, 0, 0, 0.6);
    z-index: 1;
    overflow: hidden;
    max-width: 65px;
    padding: 5px 8px 5px 10px;
    font-weight: 400;
    font-size: 0.7rem;
    border-radius: 32px;
  }
  .wrap2 {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }
  .wrap3 {
    display: flex;
    gap: -12px;
    border-radius: 14px;
    flex-direction: column;
    overflow-y: auto;
    max-height: 55px;
  }
  .wrap3 span:not(:first-child) {
    margin-top: -9px;
  }
  .completedList:hover {
    border-radius: 36px;
    transform: scale(1.02);
  }
  .ongoingList:hover {
    border-radius: 36px;
  }
  .completedList {
    background-color: var(--md-sys-color-surface-container-low);
    font-weight: 400;
    font-size: 0.9rem;
    overflow-y: auto;
    height: fit-content;
    flex-wrap: wrap;
    color: var(--md-sys-color-on-surface-variant);
  }
  .wrap {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .popup {
    padding: var(--space-small);
    display: flex;
    flex-direction: column;
    margin: var(--space-small) 0.3rem 0.3rem;
  }
  .tags {
    display: flex;
    justify-content: center;
    background-color: var(--md-sys-color-surface-container);
    gap: 10px;
    padding: var(--space-medium);
    flex-wrap: wrap;
    margin: var(--space-medium) 0;
    border-radius: 16px;
  }
  .add {
    padding: 0 1rem;
  }
  .NotFound,
  .NotFoundTask {
    font-weight: 500;
    font-size: 1rem;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    color: var(--md-sys-color-error);
  }
  .NotFoundTask {
    position: relative;
    top: 50%;
    margin: auto;
  }
  .actions-2 {
    display: flex;
    align-items: center;
    justify-content: center;
    width: auto;
    background-color: var(--md-sys-color-surface-container);
    padding: var(--space-small);
    border-radius: 16px;
    gap: 12px;
  }
  .plus {
    position: fixed;
    z-index: 17;
    bottom: 10vh;
    right: 1rem;
  }
  @media (min-width: 768px) and (max-width: 1024px) {
    .plus {
      bottom: 3vh;
      right: 1.6rem;
    }
    .ongoingList button {
      max-width: 70%;
      width: 100%;
    }

    .NotFound,
    .NotFoundTask {
      transform: none;
    }
    .popup {
      width: 70%;
      margin: auto;
    }
    .hiddenContainer {
      max-height: 40%;
    }
  }
  @media (min-width: 1024px) {
    .plus {
      top: 44%;
      left: 3%;
      margin-left: 0.5rem;
      position: fixed;
    }
    .hiddenContainer {
      max-width: 50%;
    }
    .popup {
      margin: var(--space-small);
    }
    .completed-section {
      width: 80%;
      height: 100%;
      overflow-y: auto;
    }
    .completedTasks {
      max-height: 40vh;
      overflow-y: auto;
    }
    .ongoingTasks {
      border-radius: 16px;
      height: 100%;
      margin: 1rem 1rem 1rem 2rem;
      width: 100%;
      max-height: 50vh;
      overflow-y: auto;
    }
    .task-wrap {
      display: flex;
      max-height: 100%;
    }
  }
  .noTasks {
    margin: 2rem auto;
    text-align: center;
    font-size: 0.9rem;
    color: var(--md-sys-color-on-surface-variant);
  }
  .mainInput {
    padding: var(--space-medium);
    border-radius: 16px;
    width: 96%;
    margin: var(--space-small);
  }
  .textField {
    margin-bottom: 10px;
    width: 100%;
  }
  .misc {
    display: flex;
    flex-direction: column;
    background-color: var(--md-sys-color-surface-container);
    border-radius: 16px;
    padding: var(--space-medium);
    margin-top: 1rem;
  }
  .dateTime,
  #priority {
    margin: var(--space-small);
    font-weight: 500;
    padding: 12px 14px 12px 14px;
    background-color: var(--md-sys-color-surface-container-lowest);
    color: var(--md-sys-color-on-surface-container);
    border-radius: 10px;
    width: 70%;
  }
  label {
    margin: 0.6rem;
    color: var(--md-sys-color-on-surface-variant);
    width: 30%;
    font-weight: 400;
    font-size: 0.9rem;
  }
  h2 {
    margin: 1rem;
  }
  .customTagWrap input {
    padding: 13px;
    background-color: var(--md-sys-color-surface-container-high);
    color: var(--md-sys-color-on-surface-variant);
    width: 80%;
    font-size: 0.9rem;
    border-radius: 32px;
  }
  .customTagWrap {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: var(--space-medium);
    padding: var(--space-small);
    width: 100%;
  }
  .tagBtn {
    padding: 5px 10px 5px 10px;
  }
  .ongoingList.Low {
    background-color: rgba(0, 0, 10, 0.9);
    color: var(--md-sys-color-on-surface-variant);
  }
  .ongoingList.Medium {
    border: none;
  }
  .ongoingList.High {
    background-color: var(--md-sys-color-tertiary-container);
    color: var(--md-sys-color-on-tertiary-container);
  }
  .deleteDialog {
    width: 75%;
    z-index: 99;
    margin: auto;
  }
  .deleteDialog .heading {
    margin: 1.5rem 1.8rem;
  }
  .deleteDialog div {
    margin: var(--space-small) 1.8rem;
  }
  .deleteDialog .actions {
    display: flex;
    margin: 1rem;
    align-items: center;
  }
  .actions .b1 {
    padding: 10px;
  }
  .due-tag {
    background-color: var(--md-sys-color-error);
    color: var(--md-sys-color-on-error);
  }
  .hiddenContainer {
    position: fixed;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 60%;
    overflow: auto;
    z-index: 99;
    color: var(--md-sys-color-on-surface-container);
    background-color: var(--md-sys-color-surface-container-high);
    padding: var(--space-medium);
    box-shadow: 0 -3px 8px rgba(0, 0, 0, 0.1);
    border-radius: 12px 12px 0 0;
  }
  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    backdrop-filter: blur(4px);
    background: rgba(0, 0, 0, 0.3);
    z-index: 98;
  }
  .subtask-list {
    margin: 0.2rem 1.3rem 1.3rem;
    background-color: var(--md-sys-color-surface-container-low);
    transition: all 0.2s ease;
    max-height: 200px;
    overflow-y: auto;
    color: var(--md-sys-color-on-surface-variant);
    font-size: 0.9rem;
    border-radius: 13px;
  }
  .subtask {
    display: flex;
    justify-content: space-between;
    margin: 13px;
    align-items: center;
    gap: 10px;
    padding: 0.3rem;
    border-radius: 16px;
    background-color: var(--md-sys-color-surface-container-high);
    transition: all 0.2s ease;
  }
  .subtask p {
    margin-left: 10px;
  }
  .subtask-input {
    display: flex;
    background-color: var(--md-sys-color-surface-container);
    padding: var(--space-small);
    border-radius: 11px;
    padding: 15px;
    margin: 1.2rem 0;
    width: 75%;
  }
  .subtask-btn {
    color: var(--md-sys-color-primary);
  }
  .sub-delete {
    margin: 0.3rem;
    font-size: 0.2rem;
  }
.checkbox1 {
    background-color: var(--md-sys-color-tertiary-container);
    color: var(--md-sys-color-on-tertiary-container);
    border-radius: 18px;
  }
  .taskwrap {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  }
</style>
