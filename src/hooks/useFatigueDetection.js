import { useEffect, useRef } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";
import { calculateEAR } from "../logic/eyeAspectRatio";
import { createFatigueDetector } from "../logic/fatigueDetector";
import { createAlertHandler } from "../logic/alertHandler";
import { db } from "../db/db";

export default function useFatigueDetection() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    let faceMesh;
    let camera;

    const detector = createFatigueDetector();
    const alertHandler = createAlertHandler();

    // Batch buffer for Dexie
    const buffer = [];

    // Flush buffer to Dexie every 30 seconds
    const BATCH_INTERVAL = 30 * 1000;
    const batchIntervalId = setInterval(async () => {
      if (buffer.length > 0) {
        try {
          await db.logs.bulkAdd(buffer);
        } catch (err) {
          console.error("Failed to save batch:", err);
        } finally {
          buffer.length = 0; // clear buffer
        }
      }
    }, BATCH_INTERVAL);

    async function setupFaceMesh() {
      faceMesh = new FaceMesh({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });

      faceMesh.onResults(onResults);
    }

    function onResults(results) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

      if (!results.multiFaceLandmarks) {
        detector.reset?.();
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.fillText("Face not detected", 20, 40);
        return;
      }

      const landmarks = results.multiFaceLandmarks[0];

      const leftEyeIndices = [33, 160, 158, 133, 153, 144];
      const rightEyeIndices = [362, 385, 387, 263, 373, 380];

      const leftEyePoints = leftEyeIndices.map((i) => landmarks[i]);
      const rightEyePoints = rightEyeIndices.map((i) => landmarks[i]);

      const leftEAR = calculateEAR(leftEyePoints);
      const rightEAR = calculateEAR(rightEyePoints);
      const ear = (leftEAR + rightEAR) / 2;

      const level = detector.update(ear);
      alertHandler.handleAlert(ctx, canvas, level);

      // Only save if level > 0
      if (level > 0) {
        buffer.push({
          timestamp: Date.now(),
          ear,
          level,
        });
      }

      // Draw EAR and level
      ctx.fillStyle = "green";
      ctx.font = "20px Arial";
      ctx.fillText(`EAR: ${ear.toFixed(3)}`, 20, 30);
      ctx.fillText(`Level: ${level}`, 20, 60);

      // Draw eye landmarks
      leftEyePoints.forEach((point) => {
        ctx.beginPath();
        ctx.arc(
          point.x * canvas.width,
          point.y * canvas.height,
          3,
          0,
          2 * Math.PI,
        );
        ctx.fillStyle = "yellow";
        ctx.fill();
      });

      rightEyePoints.forEach((point) => {
        ctx.beginPath();
        ctx.arc(
          point.x * canvas.width,
          point.y * canvas.height,
          3,
          0,
          2 * Math.PI,
        );
        ctx.fillStyle = "yellow";
        ctx.fill();
      });
    }

    async function startDetection() {
      await setupFaceMesh();

      camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (faceMesh) {
            await faceMesh.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480,
        facingMode: "user",
      });

      camera.start();
    }

    startDetection();

    return () => {
      camera?.stop();
      clearInterval(batchIntervalId);
    };
  }, []);

  return { videoRef, canvasRef };
}
