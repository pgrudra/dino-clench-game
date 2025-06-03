import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

let isClenched = false;
let modelReady = false;
let lastClenchState = false;
let clenchConfidence = 0;
let frameBuffer = []; // Buffer to smooth detection
const BUFFER_SIZE = 3;
const CLENCH_THRESHOLD = 0.6; // Lowered threshold - need 3/5 fingers folded

const hands = new Hands({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
  }
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1, // Increased for better accuracy
  minDetectionConfidence: 0.7, // Reduced for better detection
  minTrackingConfidence: 0.5   // Reduced for better tracking
});

hands.onResults(onResults);

function calculateFistScore(landmarks) {
  let foldedFingers = 0;
  const fingerResults = [];
  
  // Simplified and more reliable finger detection
  // Check if fingertips are below their corresponding PIP joints
  
  // Index finger (tip: 8, pip: 6)
  const indexFolded = landmarks[8].y > landmarks[6].y + 0.02;
  if (indexFolded) foldedFingers++;
  fingerResults.push(indexFolded);
  
  // Middle finger (tip: 12, pip: 10)
  const middleFolded = landmarks[12].y > landmarks[10].y + 0.02;
  if (middleFolded) foldedFingers++;
  fingerResults.push(middleFolded);
  
  // Ring finger (tip: 16, pip: 14)
  const ringFolded = landmarks[16].y > landmarks[14].y + 0.02;
  if (ringFolded) foldedFingers++;
  fingerResults.push(ringFolded);
  
  // Pinky (tip: 20, pip: 18)
  const pinkyFolded = landmarks[20].y > landmarks[18].y + 0.02;
  if (pinkyFolded) foldedFingers++;
  fingerResults.push(pinkyFolded);
  
  // Thumb (tip: 4, ip: 3) - check x-axis for thumb
  const thumbFolded = Math.abs(landmarks[4].x - landmarks[3].x) < 0.03;
  if (thumbFolded) foldedFingers++;
  fingerResults.push(thumbFolded);
  
  // Debug logging
  //console.log(`Fingers folded: ${foldedFingers}/5`, fingerResults);
  
  // Calculate confidence based on how many fingers are folded
  const confidence = foldedFingers / 5.0;
  
  return confidence;
}

function updateClenchState(isCurrentlyFist, confidence) {
  // Add to frame buffer for smoothing
  frameBuffer.push({ isFist: isCurrentlyFist, confidence });
  
  if (frameBuffer.length > BUFFER_SIZE) {
    frameBuffer.shift();
  }
  
  // Calculate smoothed state - simplified logic
  const fistFrames = frameBuffer.filter(frame => frame.isFist).length;
  const averageConfidence = frameBuffer.reduce((sum, frame) => sum + frame.confidence, 0) / frameBuffer.length;
  
  // More responsive fist detection
  const shouldBeFist = (averageConfidence >= CLENCH_THRESHOLD);
  
  isClenched = shouldBeFist;
  clenchConfidence = averageConfidence;
  
  // Debug logging
//   if (frameBuffer.length === BUFFER_SIZE) {
//     console.log(`Fist Detection - Confidence: ${averageConfidence.toFixed(2)}, State: ${isClenched ? 'FIST' : 'OPEN'}`);
//   }
}

function onResults(results) {
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0];
    const confidence = calculateFistScore(landmarks);
    const isCurrentlyFist = confidence >= CLENCH_THRESHOLD;
    updateClenchState(isCurrentlyFist, confidence);
  } else {
    // No hands detected, update state accordingly
    updateClenchState(false, 0);
  }
}

export function startHandTracking() {
  if (modelReady) return;
  
  // Create loading spinner
  const loadingContainer = document.createElement('div');
  loadingContainer.className = 'loading-container';
  loadingContainer.innerHTML = `
    <div class="loading-spinner"></div>
    <div class="loading-text">Initializing camera...</div>
  `;
  document.body.appendChild(loadingContainer);
  
  // Create or get video element
  let videoElement = document.getElementById("webcamVideo");
  if (!videoElement) {
    videoElement = document.createElement("video");
    videoElement.id = "webcamVideo";
    videoElement.style.position = "absolute";
    videoElement.style.top = "0";
    videoElement.style.left = "0";
    videoElement.style.width = "100vw";
    videoElement.style.height = "100vh";
    videoElement.style.objectFit = "cover";
    videoElement.style.zIndex = "0";
    videoElement.autoplay = true;
    videoElement.muted = true;
    videoElement.playsInline = true;
    document.body.appendChild(videoElement);
  }
  
  navigator.mediaDevices
    .getUserMedia({ 
      video: { 
        facingMode: "user",
        width: { ideal: 1280 },
        height: { ideal: 720 }
      } 
    })
    .then((stream) => {
      videoElement.srcObject = stream;
      
      const camera = new Camera(videoElement, {
        onFrame: async () => {
          if (modelReady) {
            await hands.send({ image: videoElement });
          }
        },
        width: 1280,
        height: 720
      });
      
      videoElement.onloadedmetadata = () => {
        camera.start();
        modelReady = true;
        console.log("Hand tracking initialized successfully");
        // Remove loading spinner
        loadingContainer.remove();
      };
    })
    .catch((err) => {
      console.warn("Webcam access denied or unavailable.", err);
      modelReady = false;
      // Update loading text to show error
      const loadingText = loadingContainer.querySelector('.loading-text');
      if (loadingText) {
        loadingText.textContent = "Camera access denied. Please allow camera access to play the game.";
        loadingText.style.color = "#ff0000";
      }
    });
}

export function getClenchState() {
  return isClenched;
}

export function getClenchConfidence() {
  return clenchConfidence;
}

export function isModelReady() {
  return modelReady;
}