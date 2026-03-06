import useFatigueDetection from "../hooks/useFatigueDetection";

export default function FaceMonitor() {
  const { videoRef, canvasRef } = useFatigueDetection();

  return (
    <div className="relative w-80 h-60">
      {/* Hidden video stream used as input for FaceMesh */}
      <video
        ref={videoRef}
        className="absolute w-full rounded-2xl"
        // style={{ visibility: "hidden" }}
        playsInline
      />

      {/* Canvas where processed frames are drawn */}
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="absolute w-full h-full rounded-2xl"
      />
    </div>
  );
}
