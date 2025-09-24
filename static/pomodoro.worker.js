let timerInterval;
self.onmessage = (event) => {
  const { command, time } = event.data;
  if (command === 'start') {
    clearInterval(timerInterval);

    let remainingTime = time;

    timerInterval = setInterval(() => {
      remainingTime--;

      self.postMessage({ type: 'tick', time: remainingTime });

      if (remainingTime <= 0) {
        clearInterval(timerInterval);
        self.postMessage({ type: 'phaseEnd' });
      }
    }, 1000);

  } else if (command === 'stop') {
    clearInterval(timerInterval);
  }
};
