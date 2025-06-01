import Phaser from "phaser";
import groundImage from "../assets/images/ground.png";
import cactusSmallImage from "../assets/images/cactus-small.png";
import cactusLargeImage from "../assets/images/cactus-large.png";
import pteroImage from "../assets/images/ptero.png";
import jumpSound from "../assets/audio/jump.mp3";
import pointSound from "../assets/audio/point.mp3";
import hitSound from "../assets/audio/hit.mp3";

// Import dino sprites
import dinoRun1 from "../assets/images/dino-sprites/Run (1).png";
import dinoRun2 from "../assets/images/dino-sprites/Run (2).png";
import dinoRun3 from "../assets/images/dino-sprites/Run (3).png";
import dinoRun4 from "../assets/images/dino-sprites/Run (4).png";
import dinoRun5 from "../assets/images/dino-sprites/Run (5).png";
import dinoRun6 from "../assets/images/dino-sprites/Run (6).png";
import dinoRun7 from "../assets/images/dino-sprites/Run (7).png";
import dinoRun8 from "../assets/images/dino-sprites/Run (8).png";

import dinoWalk1 from "../assets/images/dino-sprites/Walk (1).png";
import dinoWalk2 from "../assets/images/dino-sprites/Walk (2).png";
import dinoWalk3 from "../assets/images/dino-sprites/Walk (3).png";
import dinoWalk4 from "../assets/images/dino-sprites/Walk (4).png";
import dinoWalk5 from "../assets/images/dino-sprites/Walk (5).png";
import dinoWalk6 from "../assets/images/dino-sprites/Walk (6).png";
import dinoWalk7 from "../assets/images/dino-sprites/Walk (7).png";
import dinoWalk8 from "../assets/images/dino-sprites/Walk (8).png";
import dinoWalk9 from "../assets/images/dino-sprites/Walk (9).png";
import dinoWalk10 from "../assets/images/dino-sprites/Walk (10).png";

import dinoJump1 from "../assets/images/dino-sprites/Jump (1).png";
import dinoJump2 from "../assets/images/dino-sprites/Jump (2).png";
import dinoJump3 from "../assets/images/dino-sprites/Jump (3).png";
import dinoJump4 from "../assets/images/dino-sprites/Jump (4).png";
import dinoJump5 from "../assets/images/dino-sprites/Jump (5).png";
import dinoJump6 from "../assets/images/dino-sprites/Jump (6).png";
import dinoJump7 from "../assets/images/dino-sprites/Jump (7).png";
import dinoJump8 from "../assets/images/dino-sprites/Jump (8).png";
import dinoJump9 from "../assets/images/dino-sprites/Jump (9).png";
import dinoJump10 from "../assets/images/dino-sprites/Jump (10).png";
import dinoJump11 from "../assets/images/dino-sprites/Jump (11).png";
import dinoJump12 from "../assets/images/dino-sprites/Jump (12).png";

import dinoIdle1 from "../assets/images/dino-sprites/Idle (1).png";
import dinoIdle2 from "../assets/images/dino-sprites/Idle (2).png";
import dinoIdle3 from "../assets/images/dino-sprites/Idle (3).png";
import dinoIdle4 from "../assets/images/dino-sprites/Idle (4).png";
import dinoIdle5 from "../assets/images/dino-sprites/Idle (5).png";
import dinoIdle6 from "../assets/images/dino-sprites/Idle (6).png";
import dinoIdle7 from "../assets/images/dino-sprites/Idle (7).png";
import dinoIdle8 from "../assets/images/dino-sprites/Idle (8).png";
import dinoIdle9 from "../assets/images/dino-sprites/Idle (9).png";
import dinoIdle10 from "../assets/images/dino-sprites/Idle (10).png";

import dinoDead1 from "../assets/images/dino-sprites/Dead (1).png";
import dinoDead2 from "../assets/images/dino-sprites/Dead (2).png";
import dinoDead3 from "../assets/images/dino-sprites/Dead (3).png";
import dinoDead4 from "../assets/images/dino-sprites/Dead (4).png";
import dinoDead5 from "../assets/images/dino-sprites/Dead (5).png";
import dinoDead6 from "../assets/images/dino-sprites/Dead (6).png";
import dinoDead7 from "../assets/images/dino-sprites/Dead (7).png";
import dinoDead8 from "../assets/images/dino-sprites/Dead (8).png";

export default class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }
  preload() {
    // Load dino animation frames
    this.load.image("dinoRun1", dinoRun1);
    this.load.image("dinoRun2", dinoRun2);
    this.load.image("dinoRun3", dinoRun3);
    this.load.image("dinoRun4", dinoRun4);
    this.load.image("dinoRun5", dinoRun5);
    this.load.image("dinoRun6", dinoRun6);
    this.load.image("dinoRun7", dinoRun7);
    this.load.image("dinoRun8", dinoRun8);

    this.load.image("dinoWalk1", dinoWalk1);
    this.load.image("dinoWalk2", dinoWalk2);
    this.load.image("dinoWalk3", dinoWalk3);
    this.load.image("dinoWalk4", dinoWalk4);
    this.load.image("dinoWalk5", dinoWalk5);
    this.load.image("dinoWalk6", dinoWalk6);
    this.load.image("dinoWalk7", dinoWalk7);
    this.load.image("dinoWalk8", dinoWalk8);
    this.load.image("dinoWalk9", dinoWalk9);
    this.load.image("dinoWalk10", dinoWalk10);

    this.load.image("dinoJump1", dinoJump1);
    this.load.image("dinoJump2", dinoJump2);
    this.load.image("dinoJump3", dinoJump3);
    this.load.image("dinoJump4", dinoJump4);
    this.load.image("dinoJump5", dinoJump5);
    this.load.image("dinoJump6", dinoJump6);
    this.load.image("dinoJump7", dinoJump7);
    this.load.image("dinoJump8", dinoJump8);
    this.load.image("dinoJump9", dinoJump9);
    this.load.image("dinoJump10", dinoJump10);
    this.load.image("dinoJump11", dinoJump11);
    this.load.image("dinoJump12", dinoJump12);

    this.load.image("dinoIdle1", dinoIdle1);
    this.load.image("dinoIdle2", dinoIdle2);
    this.load.image("dinoIdle3", dinoIdle3);
    this.load.image("dinoIdle4", dinoIdle4);
    this.load.image("dinoIdle5", dinoIdle5);
    this.load.image("dinoIdle6", dinoIdle6);
    this.load.image("dinoIdle7", dinoIdle7);
    this.load.image("dinoIdle8", dinoIdle8);
    this.load.image("dinoIdle9", dinoIdle9);
    this.load.image("dinoIdle10", dinoIdle10);

    this.load.image("dinoDead1", dinoDead1);
    this.load.image("dinoDead2", dinoDead2);
    this.load.image("dinoDead3", dinoDead3);
    this.load.image("dinoDead4", dinoDead4);
    this.load.image("dinoDead5", dinoDead5);
    this.load.image("dinoDead6", dinoDead6);
    this.load.image("dinoDead7", dinoDead7);
    this.load.image("dinoDead8", dinoDead8);
    
    this.load.image("ground", groundImage);
    this.load.image("cactusSmall", cactusSmallImage);
    this.load.image("cactusLarge", cactusLargeImage);
    this.load.image("ptero", pteroImage);
    // Audio
    this.load.audio("jumpSfx", jumpSound);
    this.load.audio("pointSfx", pointSound);
    this.load.audio("hitSfx", hitSound);
  }
  create() {
    // Create animations
    this.createDinoAnimations();
    this.scene.start("PlayScene");
  }

  createDinoAnimations() {
    // Run animation
    this.anims.create({
      key: 'dinoRun',
      frames: Array.from({length: 8}, (_, i) => ({ key: `dinoRun${i + 1}` })),
      frameRate: 12,
      repeat: -1
    });

    // Walk animation
    this.anims.create({
      key: 'dinoWalk',
      frames: Array.from({length: 10}, (_, i) => ({ key: `dinoWalk${i + 1}` })),
      frameRate: 10,
      repeat: -1
    });

    // Jump animation
    this.anims.create({
      key: 'dinoJump',
      frames: Array.from({length: 12}, (_, i) => ({ key: `dinoJump${i + 1}` })),
      frameRate: 15,
      repeat: 0
    });

    // Idle animation
    this.anims.create({
      key: 'dinoIdle',
      frames: Array.from({length: 10}, (_, i) => ({ key: `dinoIdle${i + 1}` })),
      frameRate: 8,
      repeat: -1
    });

    // Dead animation
    this.anims.create({
      key: 'dinoDead',
      frames: Array.from({length: 8}, (_, i) => ({ key: `dinoDead${i + 1}` })),
      frameRate: 10,
      repeat: 0
    });
  }
}
