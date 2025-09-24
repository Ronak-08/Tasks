import { browser } from "$app/environment";
let worker;

let initialState = {
  time: 25,
  rest: 10,
  timeSeconds: 25 * 60,
  currentPhase: "work",
  isRunning: false,
  confirmNext: true,
  currentLabel: 'unlabelled',
  history: [],
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

export function cleanup() {
  if(pomodoro.isRunning) saveState();
}

function initializeWorker() {
  if(!browser || worker) return;

  worker = new Worker('/pomodoro.worker.js');
  worker.onmessage = (event) => {
    const {type, time} = event.data;
    if(type === 'tick') {
      pomodoro.timeSeconds = time;
    } else if (type === 'phaseEnd') {
      switchPhase();
    }
  }
}

export function toggleTimer() {
  initializeWorker();
  pomodoro.isRunning = !pomodoro.isRunning;

  if (pomodoro.isRunning) {
    worker.postMessage({ command: 'start', time: pomodoro.timeSeconds });
  } else {
    worker.postMessage({ command: 'stop' });
    saveState();
  }
}

export const reset = () => {
  initializeWorker();
  worker.postMessage({ command: 'stop' });

  pomodoro.isRunning = false;
  pomodoro.currentPhase = "work";
  pomodoro.timeSeconds = (pomodoro.time || 25) * 60;
  saveState();
}

function switchPhase() {
  if (pomodoro.currentPhase === "work") {

    const sessionToLog = {
      date: new Date().toISOString(),
      label: pomodoro.currentLabel || "Unlabeled",
      duration: (pomodoro.time || 25) * 60,
    };
    pomodoro.history.push(sessionToLog);

    pomodoro.currentPhase = "rest";
    playAlarm();
    pomodoro.timeSeconds = (pomodoro.rest || 5) * 60;
  } else {
    pomodoro.currentPhase = "work";
    pomodoro.timeSeconds = (pomodoro.time || 25) * 60;
  }

  if (pomodoro.confirmNext) {
    pomodoro.isRunning = true;
    worker.postMessage({ command: 'start', time: pomodoro.timeSeconds });
  } else {
    pomodoro.isRunning = false;
  }
  pruneHistory();
  saveState();
}

export const uniqueLabels = () => {
  return [...new Set(pomodoro.history.map(s => s.label))]}
;

export const dailyInsights = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const sessionsToday = pomodoro.history.filter(s => new Date(s.date) >= start);
  const insightsInSeconds = sessionsToday.reduce((acc, session) => {
    acc[session.label] = (acc[session.label] || 0) + session.duration;
    return acc;
  }, {});

  const totalSeconds = sessionsToday.reduce((total, session) => total + session.duration, 0);
  const totalMinutes = Math.round(totalSeconds / 60);
  const sortedInsights = Object.entries(insightsInSeconds)
  .map(([label, seconds]) => [label, Math.round(seconds / 60)])
  .sort((a, b) => b[1] - a[1]);
  return {
    byLabel: sortedInsights,
    totalMinutes
  };
};

export const weeklyInsights = () => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfToday.getDate() - 7);

  const sessions = pomodoro.history.filter(s => {
    const sessionDate = new Date(s.date);
    return sessionDate >= startOfWeek && sessionDate < startOfToday;
  });

  const dailyTotals = {};

  sessions.forEach(s => {
    const date = new Date(s.date);
    const dayKey = date.toISOString().split('T')[0];
    if (!dailyTotals[dayKey]) {
      dailyTotals[dayKey] = {
        formattedDate: `${date.getDate()}/${String(date.getMonth() + 1).padStart(2, '0')}`,
        data: {} 
      };
    }
    dailyTotals[dayKey].data[s.label] = (dailyTotals[dayKey].data[s.label] || 0) + s.duration;
  });

  const sortedDays = Object.keys(dailyTotals)
  .sort()      
  .reverse()  
  .map(dayKey => {
    const dayData = dailyTotals[dayKey];
    for (const label in dayData.data) {
      dayData.data[label] = Math.round(dayData.data[label] / 60);
    }
    return {
      day: dayData.formattedDate,
      insights: dayData.data
    };
  });

  return sortedDays;
};


function pruneHistory() {
  if (!browser) return;

  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const recentHistory = pomodoro.history.filter(session => {
    return new Date(session.date) >= oneMonthAgo;
  });
  if (recentHistory.length < pomodoro.history.length) {
    pomodoro.history = recentHistory;
  }
}

if (browser) {
  pruneHistory();
  initializeWorker();
  if (pomodoro.isRunning) {
    worker.postMessage({ command: 'start', time: pomodoro.timeSeconds });
  }
}
