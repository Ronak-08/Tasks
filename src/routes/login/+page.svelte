<script>
import { goto } from '$app/navigation';
import Button from '$lib/components/Button.svelte';
import { auth,googleProvider,signInWithPopup,createUserWithEmailAndPassword,signInWithEmailAndPassword } from '$lib/firebase';
import Icon from "@iconify/svelte";
import { GoogleAuthProvider } from 'firebase/auth';

let isLoginMode = $state(true);
let email = $state("");
let password = $state("");
let errorMsg = $state("");
let isLoading = $state(false);

let title = $derived(isLoginMode ? "Welcome Back" : "Create Account");
let btnText = $derived(isLoginMode ? "Log In" : "Sign Up");

async function handleGoogle() {
  isLoading = true;
  errorMsg = "";

  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    goto('/');
  } catch (err) {
    console.error(err);
    errorMsg = "Google Login Failed: " + err.message;
  } finally {
    isLoading = false;
  }
}

async function handleEmail(e) {
  e.preventDefault(); 
  isLoading = true;
  errorMsg = "";

  try {

    if (isLoginMode) {
      await signInWithEmailAndPassword(auth, email, password);
    } else {
      await createUserWithEmailAndPassword(auth, email, password);
    }

    goto('/');
  } catch (err) {
    console.error(err);
    errorMsg = err.message.replace("Firebase: ", "");
  } finally {
    isLoading = false;
  }
}
</script>

<div class="flex min-h-full w-full items-center justify-center p-4 bg-surface">
  <div class="
    w-full max-w-[400px] lg:max-w-4xl 
    flex flex-col lg:flex-row 
    rounded-3xl bg-surface-container 
    shadow-xl border border-outline-variant/20
    overflow-hidden
    ">

    <div class="flex flex-col p-6 md:p-8 lg:p-12 lg:w-1/2">

      <div class="mb-6 md:mb-8 text-center lg:text-left">
        <h1 class="text-2xl md:text-3xl font-bold text-on-surface tracking-tight">
          {title}
        </h1>
      </div>

      {#if errorMsg}
        <div class="mb-6 rounded-lg bg-error-container p-3 text-sm font-medium text-on-error-container text-center animate-pulse">
          {errorMsg}
        </div>
      {/if}

      <form onsubmit={handleEmail} class="flex flex-col gap-4 flex-1 justify-center">
        <label class="block">
          <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant/80 ml-1">Email</span>
          <input 
            class="w-full mt-1 px-4 py-3 rounded-xl bg-surface-container-high border-2 border-transparent focus:border-primary outline-none text-on-surface placeholder:text-on-surface-variant/50 transition-all" 
            type="email" 
            placeholder="user@example.com" 
            bind:value={email} 
            required
          />
        </label>

        <label class="block">
          <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant/80 ml-1">Password</span>
          <input 
            class="w-full mt-1 px-4 py-3 rounded-xl bg-surface-container-high border-2 border-transparent focus:border-primary outline-none text-on-surface placeholder:text-on-surface-variant/50 transition-all" 
            type="password" 
            placeholder="••••••••" 
            bind:value={password} 
            required
          />
        </label>

        <Button 
          type="submit" 
          class="w-full mt-4 text-md md:text-base shadow-md py-3"
          disabled={isLoading}
        >
          {#if isLoading} <Icon icon="svg-spinners:ring-resize" class="mr-2"/> {/if}
          {btnText}
        </Button>
      </form>
    </div>

    <div class="relative flex items-center justify-center lg:w-px  lg:bg-outline-variant/20 lg:my-8">
      <div class="relative w-full text-center lg:hidden my-4 px-6">
        <div class="absolute inset-0 flex items-center px-6">
          <div class="w-full border-t border-outline-variant/50"></div>
        </div>
        <span class="relative bg-surface-container px-3 text-xs text-on-surface-variant/70 uppercase font-medium">
          Or
        </span>
      </div>
    </div>

    <div class="
      flex flex-col p-6 md:p-8 lg:p-12 lg:w-1/2 
      lg:bg-surface-container-high/30 
      justify-center items-center
      ">

      <Button 
        onclick={handleGoogle} 
        type="button" 
        disabled={isLoading}
        variant='outline'
        class='w-full py-3 bg-surface hover:bg-surface-container-highest border-outline/30'
      >
        <Icon icon="devicon:google" class="text-xl mr-2" />
        <span>Continue with Google</span>
      </Button>

      <div class="mt-8 text-center text-sm">
        <span class="text-on-surface-variant">
          {isLoginMode ? "Don't have an account?" : "Already have an account?"}
        </span>
        <button 
          class="ml-2 font-bold text-primary hover:text-primary-fixed-dim hover:underline transition-all"
          onclick={() => isLoginMode = !isLoginMode}
        >
          {isLoginMode ? "Sign Up" : "Log In"}
        </button>
      </div>
    </div>

  </div>
</div>
