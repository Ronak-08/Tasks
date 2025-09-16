<script>
import { goto } from "$app/navigation";
import { getFirebase } from "$lib/firebase.js";
import { onMount } from "svelte";

let email = $state('');
let password = $state('');
let isLogin = $state(true); 
let errorMessage = $state(''); 

let auth, googleProvider;
let isFirebaseReady = $state(false);

onMount(async () => {
  const firebase = await getFirebase();
  auth = firebase.auth;
  googleProvider = firebase.googleProvider;
  isFirebaseReady = true; 
});

async function handleSubmit(event) {
  event.preventDefault(); 
  if (!isFirebaseReady) return; 

  errorMessage = '';
  if (!email || !password) {
    errorMessage = "Please enter both email and password.";
    return;
  }
  try {
    const { 
      signInWithEmailAndPassword, 
      createUserWithEmailAndPassword 
    } = await import("firebase/auth");

    if (isLogin) {
      await signInWithEmailAndPassword(auth, email, password);
    } else {
      await createUserWithEmailAndPassword(auth, email, password);
    }
    goto("/"); 
  } catch (error) {
    console.error('Authentication error:', error.code, error.message);
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        errorMessage = 'Invalid email or password.';
        break;
      case 'auth/email-already-in-use':
        errorMessage = 'This email address is already in use.';
        break;
      case 'auth/weak-password':
        errorMessage = 'Password should be at least 6 characters.';
        break;
      default:
        errorMessage = 'An unexpected error occurred. Please try again.';
    }
  }
}

async function handleGoogleSignIn() {
  if (!isFirebaseReady) return;
  try {
   const { signInWithPopup } = await import("firebase/auth");

    await signInWithPopup(auth, googleProvider);
    goto("/");
  } catch (error) {
    console.error("Google sign-in error:", error);
    errorMessage = "Failed to sign in with Google. Please try again.";
  }
}
</script>

<main class="auth-container">
  <h1>{isLogin ? "Welcome Back!" : "Create an Account"}</h1>

  <button class="google-btn" onclick={handleGoogleSignIn} disabled={!isFirebaseReady} >
    <md-ripple></md-ripple>
    <img src="/google-logo.svg" alt="Google logo" /> 
    Continue with Google
  </button>

  <div class="divider">
    <span>OR</span>
  </div>

  <div class="email-signup">
    <form onsubmit={handleSubmit}>
      <fieldset>
        <div class="form-field">
          <label for="email">Email</label>
          <input id="email" type="email" placeholder="you@example.com" bind:value={email} required />
        </div>
        <div class="form-field">
          <label for="password">Password</label>
          <input id="password" placeholder="••••••••" type="password" bind:value={password} required />
        </div>
      </fieldset>

      {#if errorMessage}
        <p class="error-message">{errorMessage}</p>
      {/if}

      <md-filled-button type="submit" class="submitBtn" disabled={!isFirebaseReady}>
        {#if !isFirebaseReady}
          Loading...
        {:else if isLogin}
          Log In
        {:else}
          Sign Up
        {/if}
      </md-filled-button>
    </form>
  </div>

  <div class="toggle-mode">
    <p>{isLogin ? "Don't have an account?" : "Already have an account?"}</p>
    <md-text-button onclick={() => isLogin = !isLogin}>
      {isLogin ? 'Sign Up' : 'Log In'}
    </md-text-button>
  </div>
</main>

<style>
.auth-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 450px;
  margin: 20px auto;
  gap: 1rem;
  padding-top: 1rem;
}
.email-signup form, fieldset {
  border: none;
  padding: 10px;
  background-color: var(--md-sys-color-surface-container);
  border-radius: 16px;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}
.form-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.error-message {
  color: red;
  font-size: 0.9em;
  text-align: center;
  margin: -8px 0 8px 0;
}
.toggle-mode {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 0.5rem;
  font-size: 0.9rem;
}
h1 {
  font-size: 2rem;
  text-wrap: nowrap;
  margin: 0.8rem;
  font-weight: 600;
}
form {
  display: flex;
  align-items: center;
  flex-direction: column;
}
.google-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background-color: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
  border-radius: 99px;
  padding: 0.7rem 1rem;
  position: relative;
  margin: 1rem;
}
img {
  width: 23px;
}
input {
  padding: 0.8rem;
  border-radius: 16px;
  width: 100%;
  background-color: var(--md-sys-color-surface-container-high);
  transition: all 0.3s ease;
}
input:hover {
  border: 2px solid var(--md-sys-color-primary);
}
md-filled-button {
  width: 40%;
  margin-bottom: var(--space-small);
}
label {
  font-size: 0.9rem;
  color: var(--md-sys-color-tertiary);
  margin: 0.4rem 0;
}
fieldset {
  margin: 8px;
}
.submitBtn {
  width: 90%;
}
</style>
