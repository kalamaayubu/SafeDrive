import { useEffect, useRef } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";
import { createFatigueDetector } from "../logic/fatigueDetector";
import { calculateEAR } from "../logic/eyeAspectRatio";
import { createAlertHandler } from "../logic/alertHandler";

export default function FaceMonitor() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    let faceMesh;

    // CAMERA: Request user camera and start video stream
    async function setupCamera() {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    }

    // FaceMesh Setup configurations
    async function setupFaceMesh() {
      faceMesh = new FaceMesh({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`, // The model to be used
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      faceMesh.onResults(onResults);
    }

    const alertHandler = createAlertHandler();

    // DRAW: Render video frame and overlay face landmarks
    function onResults(results) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

      // Extract Eye Landmarks
      if (results.multiFaceLandmarks) {
        const landmarks = results.multiFaceLandmarks[0];

        // Left and right eye indices
        const leftEyeIndices = [33, 160, 158, 133, 153, 144];
        const rightEyeIndices = [362, 385, 387, 263, 373, 380];

        // Map indices to landmark points
        const leftEyePoints = leftEyeIndices.map((i) => landmarks[i]);
        const rightEyePoints = rightEyeIndices.map((i) => landmarks[i]);

        // Calculate EAR for each eye
        const leftEAR = calculateEAR(leftEyePoints);
        const rightEAR = calculateEAR(rightEyePoints);

        const ear = (leftEAR + rightEAR) / 2; // Average EAR
        const level = detector.update(ear); // Update fatigue level
        alertHandler.handleAlert(ctx, canvas, level);

        // Draw EAR value
        ctx.fillStyle = "green";
        ctx.font = "20px Arial";
        ctx.fillText(`EAR: ${ear.toFixed(3)}`, 20, 30);
        ctx.fillText(`Level: ${level}`, 20, 60);

        // Draw left and right eye points
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
    }

    const detector = createFatigueDetector();

    // DETECTION LOOP: Start camera, face detection, and continuous tracking
    async function startDetection() {
      await setupCamera();
      await setupFaceMesh();

      async function detect() {
        if (videoRef.current) {
          await faceMesh.send({ image: videoRef.current });
        }
        requestAnimationFrame(detect);
      }

      detect();
    }

    startDetection();

    return () => {
      if (faceMesh) faceMesh.close();
    };
  }, []);

  return (
    <div className="relative w-60 h-40">
      <video
        ref={videoRef}
        className="absolute w-full h-full"
        style={{ visibility: "hidden" }}
        playsInline
      />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="absolute w-full h-full rounded-lg border"
      />
    </div>
  );
}
