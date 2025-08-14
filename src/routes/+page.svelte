<script>
  import {
    tasks, deleteTask, updateTask, addTask, 
    filteredTasks, filteredOngoing, filteredCompleted,
    loadTasks,searchQuery
  } from "$lib/taskStore.js";
  import { onMount } from "svelte";
  import { slide } from "svelte/transition";
  import Modal from "$lib/components/Modal.svelte";

  let state = $state({
    predefinedTags: ["Urgent", "Work", "Study", "Personal", "Games"],
    customTag: '',
    showCompleted: true,
    showModal: false,
    editingTask: null,
    modalOrigin: { x: 0, y: 0 },
    deleteDialog: { open: false, task: null },
    formData: {
      task: "",
      description: "",
      dueDate: "",
      tags: [],
      priority: ""
    }
  });

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

  function completedTask(task) {
    const updated = {
      ...task,
      completed: !task.completed,
      updatedAt: new Date().toISOString() 
    };
    updateTask(updated);
  }
  function toggleCompletedVisibility() {
    state.showCompleted = !state.showCompleted;
  }
  function confirmDelete() {
    if (state.deleteDialog.task) {
      deleteTask(state.deleteDialog.task);
    }
    cancelDelete();
  }

  function cancelDelete() {
      state.deleteDialog = { open: false, task: null};
  }

  function openTaskModal(task = null, event) {
    if (task) {
      state.editingTask = task;
      Object.assign(state.formData, {
        task: task.task || "",
        description: task.description || "",
        dueDate: task.dueDate || "",
        tags: [...(task.tags || [])],
        priority: task.priority
      });
      
      state.formData.tags.forEach(tag => {
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
        priority: ""
      };
    }

    state.modalOrigin = event ? 
      { x: event.clientX, y: event.clientY } : 
      { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    
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
      ? state.formData.tags.filter(t => t !== tag)
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

<div class="header">
  <md-fab
    role="button"
    class="plus"
    variant="primary"
    onclick={() => openTaskModal(null, event)}
    aria-label="Add Task"
  >
    <md-icon class="material-symbols-rounded" slot="icon">add</md-icon>
  </md-fab>
      <input
            class="search"
            type="text"
            placeholder="Search"
            bind:value={$searchQuery}
            oninput={(event) => event.currentTarget.value}
          />
</div>

{#if state.deleteDialog.open}
  <md-dialog class="deleteDialog" open>
    <div slot="headline">Delete Task?</div>
    <div slot="content">
      Are you sure you want to delete this task? This action cannot be undone.
    </div>
    <div slot="actions" class="actions">
      <md-text-button class="b1" onclick={cancelDelete}>Cancel</md-text-button>
      <md-filled-button class="b1" onclick={confirmDelete}>Delete</md-filled-button>
    </div>
  </md-dialog>
{/if}


<Modal origin={state.modalOrigin} open={state.showModal} onclose={() => (state.showModal = false)}>
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
      {state.formData.Task ? "Save" : "Add"}
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
    </div>
    <md-divider></md-divider>

    <div class="misc">
      <label for="due-date">Enter due date and time</label>
      <input
        id="due-date"
        type="datetime-local"
        class="dateTime"
        bind:value={state.formData.dueDate}
      />

      <label for="priority">Priority</label>
      <select bind:value={state.formData.priority} id="priority" name="priority">
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
      </select>
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
  </form>
</Modal>

{#if $filteredTasks.length > 0}
  <div class="task-wrap">
    <ul class="ongoingTasks">
      <h3>Ongoing Tasks</h3>
      {#each $filteredOngoing as task (task.id)}
        {@const isOverdue = task.dueDate && !task.completed && new Date() > new Date(task.dueDate)}
        <li
          transition:slide={{ duration: 300 }}
          class="ongoingList {task.priority}">
          <md-ripple></md-ripple>
          <button onclick={() => openTaskModal(task, event)}
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
                checked={task.completed}
                onchange={() => completedTask(task)}
                onclick={(e) => e.stopPropagation()}
                touch-target="wrapper"
                class="check"
              ></md-checkbox>
            </div>
          </div>
        </li>
      {/each}
      {#if $filteredOngoing.length === 0}
        <p class="noTasks">No ongoing tasks</p>
      {/if}
    </ul>

    <div class="completed-section">
      <button class="completed-header" onclick={toggleCompletedVisibility}>
        <md-ripple></md-ripple>
        <h3>Completed ({$filteredCompleted.length})</h3>
        <span
          class="material-symbols-rounded icon-toggle"
          class:collapsed={!state.showCompleted}
        >
          expand_more
        </span>
      </button>

      {#if state.showCompleted && $filteredCompleted.length > 0}
        <ul class="completedTasks" transition:slide={{ duration: 300 }}>
          {#each $filteredCompleted as task (task.id)}
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
          {#if $filteredCompleted.length === 0}
            <p class="NotFoundTask">None</p>
          {/if}
        </ul>
      {/if}
    </div>
  </div>
{:else if $searchQuery.trim() !== ""}
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
  .icon-toggle {
    transition: transform 0.2s ease-in-out;
    margin-right: 5px;
  }
  .icon-toggle.collapsed {
    transform: rotate(-90deg);
  }
  .header {
    display: flex;
    align-items: center;
    margin: 1rem var(--space-medium);
    padding: var(--space-small);
    margin-bottom: var(--space-medium);
  }
  .high {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 1rem;
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
    text-align: left;
  }
  .wrap-text {
    display: flex;
    flex-direction: column;
    max-width: 70%;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .title {
    font-size: 0.96rem;
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
    max-width: 60px;
    padding: 5px 10px 5px 10px;
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
    padding: var(--space-medium);
    display: flex;
    flex-direction: column;
    margin: var(--space-small);
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
    transform: translate(-50%,-50%);
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
      top: 0;
      margin-left: 0.5rem;
      position: relative;
    }

  .NotFound,
  .NotFoundTask {
      transform: none;
    }
    .popup {
      width: 70%;
      margin: auto;
    }
  }
  @media (min-width: 1024px) {
    .plus {
      top: 0;
      margin-left: 0.5rem;
      position: relative;
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
    .header {
      width: 80%;
      gap: 2rem;
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
    width: 95%;
  }
  label {
    margin: 0.6rem;
    color: var(--md-sys-color-on-surface-variant);
    width: fit-content;
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
    background-color: var(--md-sys-color-surface-container);
  }
  .ongoingList.Medium {
    border: none;
  }
  .ongoingList.High {
    background-color: var(--md-sys-color-tertiary-container);
    color: var(--md-sys-color-on-tertiary-container);
  }
  .deleteDialog {
    width: 50%;
    margin: auto;
  }
  .deleteDialog div {
    margin: var(--space-medium);
  }
  .deleteDialog .actions {
    display: flex;
    align-items: center;
  }
  .actions .b1 {
    padding: 10px ;
  }
  .due-tag {
    background-color: var(--md-sys-color-error);
    color: var(--md-sys-color-on-error);
  }
</style>
