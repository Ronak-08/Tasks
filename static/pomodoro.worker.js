let timerInterval;
let endTime;

self.onmessage = (event) => {
  const { command, time } = event.data; 

  if (command === 'start') {
    clearInterval(timerInterval);

    endTime = Date.now() + (time * 1000);

    timerInterval = setInterval(() => {
      const remainingTimeMs = endTime - Date.now();
      const remainingTimeSec = Math.round(remainingTimeMs / 1000);

      self.postMessage({ type: 'tick', time: remainingTimeSec });

      if (remainingTimeMs <= 0) {
        clearInterval(timerInterval);
        self.postMessage({ type: 'phaseEnd' });
      }
    }, 1000);

  } else if (command === 'stop') {
    clearInterval(timerInterval);
  }
};
