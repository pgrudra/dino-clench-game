import "./style.css";
import Phaser from "phaser";
import BootScene from "./game/BootScene.js";
import PlayScene from "./game/PlayScene.js";

const config = {
  type: Phaser.AUTO,
  parent: "phaserContainer",
  width: 800,
  height: 600,
  transparent: true, 
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 800 },
      debug: false
    }
  },
  scene: [BootScene, PlayScene]
};

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  new Phaser.Game(config);
});
