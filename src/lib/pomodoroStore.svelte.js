import { browser } from "$app/environment";

let initialState = {
  time: 25,
  rest: 10,
  timeSeconds: 25 * 60,
  currentPhase: "work",
  isRunning: false,
  confirmNext: true,
}

let alarm;
if (browser) {
  alarm = new Audio('/alarm.mp3');
}

function playAlarm() {
  if (alarm) {
    alarm.currentTime = 0;
    alarm.play().catch(e => console.error(e));
  }
}

const saved = browser ? JSON.parse(localStorage.getItem("pomodoro-state")) : initialState;
export let pomodoro = $state(saved || initialState);

export function saveState() {
  if (!browser) return;
  localStorage.setItem('pomodoro-state', JSON.stringify(pomodoro));
}

let interval;

export function cleanup() {
  if(pomodoro.isRunning) saveState();
}

export function toggleTimer() {
  pomodoro.isRunning = !pomodoro.isRunning;

  if (pomodoro.isRunning) {
    interval = setInterval(() => {
      if (pomodoro.timeSeconds > 0) {
        pomodoro.timeSeconds--;
      } else { switchPhase(); }
    }, 1000);
  } else { clearInterval(interval); saveState(); }
}
export const reset = () => {
  clearInterval(interval);
  pomodoro.isRunning = false;
  pomodoro.currentPhase = "work";
  pomodoro.timeSeconds = (pomodoro.time || 25) * 60;
  saveState();
}
function switchPhase() {
  clearInterval(interval);
  if (pomodoro.currentPhase === "work") {
    pomodoro.currentPhase = "rest";
    playAlarm();
    pomodoro.timeSeconds = (pomodoro.rest || 5) * 60;
  } else {
    pomodoro.currentPhase = "work";
    pomodoro.timeSeconds = (pomodoro.time || 25) * 60;
  }
  
  if(!pomodoro.confirmNext) {
    pomodoro.isRunning = false;
    saveState();
  } else {pomodoro.isRunning = true;
   interval = setInterval(() => {
    if(pomodoro.timeSeconds > 0) {
        pomodoro.timeSeconds--;
      } else {switchPhase();}
   }, 1000);
  } 
}
