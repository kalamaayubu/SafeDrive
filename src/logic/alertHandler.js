// src/logic/alertHandler.js
export function createAlertHandler() {
  const alertAudio1 = new Audio("/audio/beepWarning.mp3"); // Level 1
  const alertAudio2 = new Audio("/audio/beepWarning1.mp3"); // Level 2
  const alertAudio3 = new Audio("/audio/beepWarning2.mp3"); // Level 3

  let currentPlaying = null;

  function handleAlert(ctx, canvas, level) {
    if (!ctx || !canvas) return;

    // Stop previous audio if level drops
    if (level === 0) {
      if (currentPlaying) {
        currentPlaying.pause();
        currentPlaying.currentTime = 0;
        currentPlaying = null;
      }
      return;
    }

    // Draw visual cue
    if (level === 1) {
      ctx.strokeStyle = "orange";
      ctx.lineWidth = 12;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);
      if (currentPlaying !== alertAudio1) {
        if (currentPlaying) {
          currentPlaying.pause();
          currentPlaying.currentTime = 0;
        }
        alertAudio1.loop = false;
        alertAudio1.play();
        currentPlaying = alertAudio1;
      }
    } else if (level === 2) {
      ctx.strokeStyle = "yellow";
      ctx.lineWidth = 16;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);
      if (currentPlaying !== alertAudio2) {
        if (currentPlaying) {
          currentPlaying.pause();
          currentPlaying.currentTime = 0;
        }
        alertAudio2.loop = false;
        alertAudio2.play();
        currentPlaying = alertAudio2;
      }
    } else if (level === 3) {
      ctx.strokeStyle = "red";
      ctx.lineWidth = 20;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);
      if (currentPlaying !== alertAudio3) {
        if (currentPlaying) {
          currentPlaying.pause();
          currentPlaying.currentTime = 0;
        }
        alertAudio3.loop = true;
        alertAudio3.play();
        currentPlaying = alertAudio3;
      }
    }
  }

  return { handleAlert };
}
