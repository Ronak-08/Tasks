# Task Master 📝

A simple and fast app to manage your notes, tasks.

**Live Demo:** [**https://tasksmaster01.netlify.app**](https://tasksmaster01.netlify.app)

---

### ✨ Features

*   **📝 Markdown Notes:** Write notes with markdown preview.
*   **📒 Make Notebooks:** Make nested notes like notion.
*   **✅ Simple Todos:** Keep track of your tasks and check them off as you go.
*   **☁️ Firebase Sync:** Your data is always synced across all your devices (optional, can work without it).
*   **✈️ Offline Support:** Keep working even when the internet isn't. The app saves your changes locally and syncs when you're back online.
*   **📱 PWA:** Install it on your phone or desktop for a native app-like experience.

---

### 🛠️ Tech Stack

*   **Framework:** **Svelte 5**
*   **Backend & Sync:** **Firebase** (Firestore & Authentication) + Dexie.
*   **Markdown:** `marked and dompurify` for parsing.

---

### 🚀 Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Ronak-08/Tasks.git
    cd Tasks
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Firebase:**
    *   Create a project on [Firebase](https://firebase.google.com/).
    *   Create a `src/lib/firebase.js` file with your Firebase config.
    *   Enable Firestore and Authentication.

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

---

Made with ❤️ by **Ronak Ameta**.
