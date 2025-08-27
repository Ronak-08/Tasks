# Task Master 📝

A simple and fast app to manage your notes, tasks, and focus time, all in one place. Built with the latest web tech to be reliable and easy to use.

**Live Demo:** [**https://tasksmaster01.netlify.app**](https://tasksmaster01.netlify.app)

---

### ✨ Features

*   **📝 Markdown Notes:** Write rich notes with a secure, real-time markdown preview.
*   **✅ Simple Todos:** Keep track of your tasks and check them off as you go.
*   **🍅 Pomodoro Timer:** Stay focused and manage your work sessions effectively.
*   **☁️ Firebase Sync:** Your data is always synced across all your devices (optional, can work without it).
*   **✈️ Offline Support:** Keep working even when the internet isn't. The app saves your changes locally and syncs when you're back online.
*   **📱 PWA Ready:** Install it on your phone or desktop for a native app-like experience.

---

### 🛠️ Tech Stack

*   **Framework:** **Svelte 5**
*   **UI:** **Google's Material Web Components** for a clean, modern look.
*   **Backend & Sync:** **Firebase** (Firestore & Authentication).
*   **Markdown:** `marked` for parsing and `DOMPurify` for keeping things secure.

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
