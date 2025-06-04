import Phaser from "phaser";
import { getClenchState, startHandTracking, isModelReady } from "../gesture/HandTracker.js";

export default class PlayScene extends Phaser.Scene {
  constructor() {
    super("PlayScene");
    this.lastJumpTime = 0;
    this.baseGameSpeed = 300;
    this.gameSpeed = 300;
    this.spawnTimer = 0;
    this.score = 0;
    this.scoreText = null;
    this.isGameOver = false;
    this.groundHeight = 568;
    this.lastFistState = false;
    this.isHandTrackingReady = false;
    this.countdownTimer = null;
    this.instructionsText = null;
    
    // Enhanced difficulty progression variables
    this.gameStartTime = 0;
    this.baseSpawnInterval = 2000;
    this.spawnInterval = 2000;
    this.difficultyLevel = 1;
    this.maxGameSpeed = 800; // Maximum speed cap
    this.speedIncreaseRate = 2; // How much speed increases per obstacle
    this.minSpawnInterval = 800; // Minimum time between obstacles
    this.maxSpeedReached = 300; // Track highest speed achieved
    
    // Store references to game over UI elements
    this.gameOverText = null;
    this.restartText = null;
    this.difficultyText = null;
  }

  create() {
    // Record game start time for time-based difficulty
    this.gameStartTime = this.time.now;
    
    // Show instructions and start countdown
    this.showInstructionsAndCountdown();
    
    // 1. Start Hand Tracking
    startHandTracking();

    // Debug: Check if textures are loaded
    console.log('Available textures:', this.textures.getTextureKeys());
    
    // 2. Ground - Create multiple ground tiles for seamless scrolling
    this.ground = this.physics.add.staticGroup();
    
    // Create multiple ground pieces for seamless scrolling
    for (let i = 0; i < 4; i++) {
      this.ground.create(i * 400, this.groundHeight, "ground").setScale(2).refreshBody();
    }

    // 3. Dino Player - Adjusted size and position
    this.player = this.physics.add.sprite(100, this.groundHeight - 60, "dinoRun1");
    this.player.setScale(0.3);
    this.player.setActive(true);
    this.player.setVisible(true);
    this.player.setDepth(1);
    this.player.setCollideWorldBounds(true);
    
    // Adjusted hitbox for better collision detection
    this.player.setSize(80, 100).setOffset(30, 40);
    
    // Start with idle animation
    this.player.play('dinoIdle');

    // 4. Collisions
    this.physics.add.collider(this.player, this.ground);

    // 5. Input (for fallback)
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // 6. Obstacles Group
    this.obstacles = this.physics.add.group();
    this.physics.add.collider(this.obstacles, this.ground);
    this.physics.add.overlap(this.player, this.obstacles, this.gameOver, null, this);

    // 7. Score Text
    this.scoreText = this.add.text(16, 16, "Score: 0", {
      fontSize: "32px",
      fill: "#000",
      fontStyle: "bold"
    });
    this.scoreText.setScrollFactor(0);

    // 8. Hand gesture status text for debugging
    this.gestureText = this.add.text(16, 60, "Hand: Open", {
      fontSize: "20px",
      fill: "#666"
    });
    this.gestureText.setScrollFactor(0);

    // 9. Difficulty level display
    this.difficultyText = this.add.text(16, 90, "Level: 1", {
      fontSize: "20px",
      fill: "#333",
      fontStyle: "bold"
    });
    this.difficultyText.setScrollFactor(0);

    // 10. Speed display for debugging
    this.speedText = this.add.text(16, 120, "Speed: 300", {
      fontSize: "16px",
      fill: "#999"
    });
    this.speedText.setScrollFactor(0);
  }

  showInstructionsAndCountdown() {
    // Create instructions text
    this.instructionsText = this.add.text(400, 200, 
      "Welcome to Dino Clench Runner!\n\n" +
      "Instructions:\n" +
      "• Make a fist to make the dino jump\n" +
      "• Avoid obstacles\n\n" +
      
      "Waiting for hand tracking to initialize...", {
      fontSize: "20px",
      fill: "#000",
      align: "center",
      lineSpacing: 10
    });
    this.instructionsText.setOrigin(0.5);
    this.instructionsText.setScrollFactor(0);

    // Create countdown text
    this.countdownText = this.add.text(400, 400, "3", {
      fontSize: "64px",
      fill: "#ff0000",
      fontStyle: "bold"
    });
    this.countdownText.setOrigin(0.5);
    this.countdownText.setScrollFactor(0);
    this.countdownText.setVisible(false);

    // Start checking for hand tracking readiness
    this.checkHandTrackingReady();
  }

  checkHandTrackingReady() {
    if (isModelReady()) {
      this.startCountdown();
    } else {
      this.time.delayedCall(100, () => this.checkHandTrackingReady());
    }
  }

  startCountdown() {
    let count = 3;
    this.countdownText.setVisible(true);
    
    const updateCountdown = () => {
      if (count > 0) {
        this.countdownText.setText(count.toString());
        count--;
        this.time.delayedCall(1000, updateCountdown);
      } else {
        this.countdownText.setText("GO!");
        this.time.delayedCall(1000, () => {
          this.countdownText.destroy();
          this.instructionsText.destroy();
          this.isHandTrackingReady = true;
        });
      }
    };
    
    updateCountdown();
  }

  update(time, delta) {
    if (this.isGameOver || !this.isHandTrackingReady) return;

    // Update difficulty based on time elapsed and score
    this.updateDifficulty(time);

    // 1. Handle Jump (space OR hand clench)
    const isFist = getClenchState();
    const onGround = this.player.body.blocked.down || this.player.body.touching.down;
    
    // Update gesture debug text
    this.gestureText.setText(`Hand: ${isFist ? 'Fist' : 'Open'}`);
    
    // Update animation based on state
    if (!onGround) {
      if (this.player.anims.currentAnim?.key !== 'dinoJump') {
        this.player.play('dinoJump', true);
      }
    } else if (this.gameSpeed > 0) {
      if (this.player.anims.currentAnim?.key !== 'dinoRun') {
        this.player.play('dinoRun', true);
      }
    } else {
      if (this.player.anims.currentAnim?.key !== 'dinoIdle') {
        this.player.play('dinoIdle', true);
      }
    }

    // Jump logic - trigger on fist clench or spacebar (edge detection for fist)
    const currentFistState = isFist;
    const fistJustClenched = currentFistState && !this.lastFistState;
    this.lastFistState = currentFistState;
    
    // Adjust jump cooldown based on difficulty (faster reactions needed at higher levels)
    const jumpCooldown = Math.max(200, 400 - (this.difficultyLevel * 20));
    
    if (
      (fistJustClenched || Phaser.Input.Keyboard.JustDown(this.spaceKey)) &&
      onGround &&
      time - this.lastJumpTime > jumpCooldown
    ) {
      // Jump power increases slightly with difficulty for better obstacle clearing
      const jumpPower = Math.min(-550, -450 - (this.difficultyLevel * 5));
      this.player.setVelocityY(jumpPower);
      this.sound.play("jumpSfx");
      this.lastJumpTime = time;
    }

    // 2. Move ground texture to simulate running
    this.ground.getChildren().forEach((groundPiece) => {
      groundPiece.x -= (this.gameSpeed * delta) / 1000;
      
      // Reset ground position for infinite scrolling
      if (groundPiece.x <= -400) {
        groundPiece.x += 1600; // 4 * 400
      }
    });

    // 3. Spawn obstacles with dynamic difficulty
    this.spawnTimer += delta;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnObstacle();
      this.spawnTimer = 0;
      
      // Increase speed more aggressively
      this.gameSpeed = Math.min(this.maxGameSpeed, this.gameSpeed + this.speedIncreaseRate);
      
      // Decrease spawn interval more aggressively at higher difficulties
      const spawnReduction = Math.max(10, 5 + this.difficultyLevel);
      this.spawnInterval = Math.max(this.minSpawnInterval, this.spawnInterval - spawnReduction);
    }

    // 4. Move obstacles left
    this.obstacles.getChildren().forEach((obs) => {
      obs.setVelocityX(-this.gameSpeed);
      // Destroy off-screen obstacles
      if (obs.x < -100) {
        obs.destroy();
        // Increase score based on difficulty level
        const scoreIncrease = 10 + (this.difficultyLevel * 2);
        this.score += scoreIncrease;
        this.scoreText.setText("Score: " + this.score);
        this.sound.play("pointSfx");
      }
    });

    // Update debug displays
    this.speedText.setText(`Speed: ${Math.round(this.gameSpeed)}`);
    // Update max speed reached
    this.maxSpeedReached = Math.max(this.maxSpeedReached, this.gameSpeed);
  }

  updateDifficulty(currentTime) {
    const timeElapsed = (currentTime - this.gameStartTime) / 1000; // seconds
    
    // Calculate difficulty level based on time and score
    const timeDifficulty = Math.floor(timeElapsed / 10); // Every 10 seconds
    const scoreDifficulty = Math.floor(this.score / 100); // Every 100 points
    
    const newDifficultyLevel = Math.max(1, timeDifficulty + scoreDifficulty);
    
    if (newDifficultyLevel > this.difficultyLevel) {
      this.difficultyLevel = newDifficultyLevel;
      
      // Apply difficulty bonuses
      this.applyDifficultyBonus();
      
      // Update difficulty display
      this.difficultyText.setText(`Level: ${this.difficultyLevel}`);
      
      console.log(`Difficulty increased to level ${this.difficultyLevel}`);
    }
  }

  applyDifficultyBonus() {
    // Increase maximum speed cap as difficulty increases
    this.maxGameSpeed = 800 + (this.difficultyLevel * 50);
    
    // Increase speed increase rate
    this.speedIncreaseRate = 2 + Math.floor(this.difficultyLevel / 3);
    
    // Decrease minimum spawn interval (more obstacles)
    this.minSpawnInterval = Math.max(500, 800 - (this.difficultyLevel * 30));
    
    // Every 5 difficulty levels, add an immediate speed boost
    if (this.difficultyLevel % 5 === 0) {
      this.gameSpeed = Math.min(this.maxGameSpeed, this.gameSpeed + 100);
      this.spawnInterval = Math.max(this.minSpawnInterval, this.spawnInterval * 0.8);
    }
  }

  spawnObstacle() {
    // At higher difficulties, increase chance of flying obstacles and multiple obstacles
    let obstacleCount = 1;
    
    // Chance for multiple obstacles at higher difficulties
    if (this.difficultyLevel >= 5 && Math.random() < 0.3) {
      obstacleCount = 2;
    }
    if (this.difficultyLevel >= 10 && Math.random() < 0.2) {
      obstacleCount = 3;
    }
    
    for (let i = 0; i < obstacleCount; i++) {
      this.createSingleObstacle(i * 100); // Offset multiple obstacles
    }
  }
  
  createSingleObstacle(xOffset = 0) {
    // Adjust obstacle probabilities based on difficulty
    let rand;
    if (this.difficultyLevel < 3) {
      // Early game: mostly ground obstacles
      rand = Phaser.Math.Between(0, 1);
    } else if (this.difficultyLevel < 7) {
      // Mid game: introduce more flying obstacles
      rand = Phaser.Math.Between(0, 2);
    } else {
      // Late game: higher chance of flying obstacles
      rand = Phaser.Math.FloatBetween(0, 3);
      if (rand > 2.5) rand = 2; // Increase ptero chance
    }
    
    let key, yPos, scale = 1;
    
    if (rand <= 0.5) {
      key = "cactusSmall";
      yPos = this.groundHeight - 45;
      scale = 0.8;
    } else if (rand <= 1.5) {
      key = "cactusLarge";
      yPos = this.groundHeight - 45;
      scale = 0.7;
    } else {
      key = "ptero";
      // Vary ptero height at higher difficulties
      const heightVariations = [120, 140, 160];
      const heightIndex = Math.floor(Math.random() * heightVariations.length);
      yPos = this.groundHeight - heightVariations[heightIndex];
      scale = 0.6;
    }
    
    const obstacle = this.obstacles.create(900 + xOffset, yPos, key);
    obstacle.setScale(scale);
    obstacle.setImmovable();
    obstacle.body.allowGravity = false;
    
    // Adjust hitboxes (keeping your existing logic)
    if (key === "cactusSmall") {
      obstacle.setSize(60 / scale, 75 / scale).setOffset(15 / scale, 0);
    } else if (key === "cactusLarge") {
      obstacle.setSize(70 / scale, 100 / scale).setOffset(15 / scale, 0);
    } else {
      obstacle.setSize(70 / scale, 45 / scale).setOffset(15 / scale, 5 / scale);
    }
  }

  gameOver() {
    if (this.isGameOver) return;
    
    // Debug log for collision
    const collidingObstacle = this.obstacles.getChildren().find(obs => 
      this.physics.overlap(this.player, obs)
    );
    
    console.log('Collision detected!', {
      playerPosition: {
        x: this.player.x,
        y: this.player.y,
        bounds: this.player.getBounds()
      },
      obstacleType: collidingObstacle ? collidingObstacle.texture.key : 'unknown',
      obstaclePosition: collidingObstacle ? {
        x: collidingObstacle.x,
        y: collidingObstacle.y,
        bounds: collidingObstacle.getBounds()
      } : null,
      finalScore: this.score,
      difficultyLevel: this.difficultyLevel,
      finalSpeed: this.gameSpeed
    });
    
    this.isGameOver = true;
    this.sound.play("hitSfx");
    
    // Stop all movement
    this.gameSpeed = 0;
    this.obstacles.getChildren().forEach(obs => obs.setVelocityX(0));
    
    // Play death animation
    this.player.play('dinoDead');
    
    // Enhanced game over screen with stats
    this.gameOverText = this.add.text(400, 200, "GAME OVER", {
      fontSize: "48px",
      fill: "#ff0000",
      fontStyle: "bold"
    });
    this.gameOverText.setOrigin(0.5);
    this.gameOverText.setScrollFactor(0);
    
    // Show final stats
    const statsText = this.add.text(400, 260, 
      `Final Score: ${this.score}\nDifficulty Level: ${this.difficultyLevel}\nMax Speed: ${Math.round(this.maxSpeedReached)}`, {
      fontSize: "20px",
      fill: "#333",
      align: "center"
    });
    statsText.setOrigin(0.5);
    statsText.setScrollFactor(0);
    
    this.restartText = this.add.text(400, 340, "Make a fist or press SPACE to restart", {
      fontSize: "24px",
      fill: "#000"
    });
    this.restartText.setOrigin(0.5);
    this.restartText.setScrollFactor(0);
    
    // Store reference to stats text for cleanup
    this.statsText = statsText;
    
    // Wait for death animation to complete, then allow restart
    this.time.delayedCall(1500, () => {
      this.enableRestart();
    });
  }
  
  enableRestart() {
    let lastRestartFistState = false;
    
    // Listen for restart input
    const checkRestart = () => {
      const currentFistState = getClenchState();
      const fistJustClenched = currentFistState && !lastRestartFistState;
      lastRestartFistState = currentFistState;
      
      if (fistJustClenched || Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
        // Properly destroy game over UI elements
        if (this.gameOverText && this.gameOverText.active) {
          this.gameOverText.destroy();
          this.gameOverText = null;
        }
        if (this.restartText && this.restartText.active) {
          this.restartText.destroy();
          this.restartText = null;
        }
        if (this.statsText && this.statsText.active) {
          this.statsText.destroy();
          this.statsText = null;
        }
        
        // Clear all existing obstacles
        this.obstacles.clear(true, true);
        
        // Reset ground positions
        this.ground.getChildren().forEach((groundPiece, index) => {
          groundPiece.x = index * 400;
        });
        
        // Reset player position and state
        this.player.setPosition(100, this.groundHeight - 60);
        this.player.setVelocity(0, 0);
        this.player.play('dinoRun');
        
        // Reset all game state variables
        this.isGameOver = false;
        this.gameSpeed = this.baseGameSpeed;
        this.spawnTimer = 0;
        this.score = 0;
        this.spawnInterval = this.baseSpawnInterval;
        this.lastFistState = false;
        this.difficultyLevel = 1;
        this.gameStartTime = this.time.now;
        this.maxGameSpeed = 800;
        this.speedIncreaseRate = 2;
        this.minSpawnInterval = 800;
        this.maxSpeedReached = 300; // Reset max speed reached
        
        // Update all displays
        this.scoreText.setText("Score: 0");
        this.difficultyText.setText("Level: 1");
        this.speedText.setText("Speed: 300");
        
        // Stop checking for restart input
        return;
      }
      
      // Continue checking for restart input if game is still over
      if (this.isGameOver) {
        this.time.delayedCall(100, checkRestart);
      }
    };
    checkRestart();
  }
}