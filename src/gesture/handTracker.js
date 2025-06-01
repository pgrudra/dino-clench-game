import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

let isClenched = false;
let modelReady = false;

const hands = new Hands({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
  }
});
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 0,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.5
});
hands.onResults(onResults);

function onResults(results) {
  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    isClenched = false;
    return;
  }
  const landmarks = results.multiHandLandmarks[0];
  let folded = 0;
  const fingerTips = [8, 12, 16, 20];
  const fingerPips = [6, 10, 14, 18];
  fingerTips.forEach((tipIdx, i) => {
    const tip = landmarks[tipIdx];
    const pip = landmarks[fingerPips[i]];
    if (pip.y - tip.y > 0.02) folded++;
  });
  // Thumb: TIP=4, IP=3 (for simplicity, check x-axis)
  const thumbTip = landmarks[4], thumbIP = landmarks[3];
  if (thumbIP.x - thumbTip.x > 0.02) folded++;
  isClenched = folded >= 4;
}

export function startHandTracking() {
  if (modelReady) return;
  const videoElement = document.getElementById("webcamVideo");
  navigator.mediaDevices
    .getUserMedia({ video: { facingMode: "user" } })
    .then((stream) => {
      videoElement.srcObject = stream;
      const camera = new Camera(videoElement, {
        onFrame: async () => {
          await hands.send({ image: videoElement });
        },
        width: 640,
        height: 480
      });
      camera.start();
      modelReady = true;
    })
    .catch((err) => {
      console.warn("Webcam access denied or unavailable.", err);
      modelReady = false;
    });
}

export function getClenchState() {
  return isClenched;
}
