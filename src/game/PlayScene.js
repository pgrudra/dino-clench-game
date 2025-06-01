import Phaser from "phaser";
import { getClenchState, startHandTracking } from "../gesture/handTracker.js";

export default class PlayScene extends Phaser.Scene {
  constructor() {
    super("PlayScene");
    this.lastJumpTime = 0;
    this.gameSpeed = 300;
    this.spawnTimer = 0;
    this.score = 0;
    this.scoreText = null;
    this.isGameOver = false;
    this.groundHeight = 568;
    this.lastFistState = false; // Track previous fist state for edge detection
    
    // Store references to game over UI elements
    this.gameOverText = null;
    this.restartText = null;
  }

  create() {
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
    this.player.setScale(0.3); // Reduced scale for better proportion
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

    // 9. Spawn first obstacle after 2 seconds
    this.spawnInterval = 2000; // ms
  }

  update(time, delta) {
    if (this.isGameOver) return;

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
    
    if (
      (fistJustClenched || Phaser.Input.Keyboard.JustDown(this.spaceKey)) &&
      onGround &&
      time - this.lastJumpTime > 300
    ) {
      this.player.setVelocityY(-450); // Increased jump power
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

    // 3. Spawn obstacles
    this.spawnTimer += delta;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnObstacle();
      this.spawnTimer = 0;
      // Gradually increase speed / decrease spawn interval
      this.gameSpeed += 1;
      this.spawnInterval = Math.max(1000, this.spawnInterval - 5);
    }

    // 4. Move obstacles left
    this.obstacles.getChildren().forEach((obs) => {
      obs.setVelocityX(-this.gameSpeed);
      // Destroy off-screen obstacles
      if (obs.x < -100) {
        obs.destroy();
        this.score += 10;
        this.scoreText.setText("Score: " + this.score);
        this.sound.play("pointSfx");
      }
    });
  }

  spawnObstacle() {
    // Randomly choose small cactus, large cactus, or ptero
    const rand = Phaser.Math.Between(0, 2);
    let key, yPos, scale = 1;
    
    if (rand === 0) {
      key = "cactusSmall";
      yPos = this.groundHeight - 45;
      scale = 0.8;
    } else if (rand === 1) {
      key = "cactusLarge";
      yPos = this.groundHeight - 45;
      scale = 0.7;
    } else {
      key = "ptero";
      yPos = this.groundHeight - 140;
      scale = 0.6;
    }
    
    const obstacle = this.obstacles.create(900, yPos, key);
    obstacle.setScale(scale);
    obstacle.setImmovable();
    obstacle.body.allowGravity = false;
    
    // Debug log for obstacle creation
    console.log(`Spawned ${key} at position:`, {
      x: obstacle.x,
      y: obstacle.y,
      scale: scale,
      type: key
    });
    
    // FIXED: Proper hitbox calculation for scaled sprites
    // When sprites are scaled, physics bodies are scaled too, so we need to compensate
    if (key === "cactusSmall") {
      // Hitbox for small cactus (scale = 0.8)
      obstacle.setSize(60 / scale, 75 / scale).setOffset(15 / scale, 0);
    } else if (key === "cactusLarge") {
      // Hitbox for large cactus (scale = 0.7)
      obstacle.setSize(70 / scale, 100 / scale).setOffset(15 / scale, 0);
    } else {
      // FIXED: Proper hitbox for ptero (scale = 0.6)
      // Make hitbox bigger but position it higher to avoid ground collision
      obstacle.setSize(70 / scale, 45 / scale).setOffset(15 / scale, 5 / scale);
    }
  
    // Log hitbox details for debugging
    console.log(`${key} hitbox:`, {
      width: obstacle.body.width,
      height: obstacle.body.height,
      offsetX: obstacle.body.offset.x,
      offsetY: obstacle.body.offset.y,
      bounds: obstacle.getBounds()
    });
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
      } : null
    });
    
    this.isGameOver = true;
    this.sound.play("hitSfx");
    
    // Stop all movement
    this.gameSpeed = 0;
    this.obstacles.getChildren().forEach(obs => obs.setVelocityX(0));
    
    // Play death animation
    this.player.play('dinoDead');
    
    // Store references to game over UI elements
    this.gameOverText = this.add.text(400, 250, "GAME OVER", {
      fontSize: "48px",
      fill: "#ff0000",
      fontStyle: "bold"
    });
    this.gameOverText.setOrigin(0.5);
    this.gameOverText.setScrollFactor(0);
    
    this.restartText = this.add.text(400, 320, "Make a fist or press SPACE to restart", {
      fontSize: "24px",
      fill: "#000"
    });
    this.restartText.setOrigin(0.5);
    this.restartText.setScrollFactor(0);
    
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
        // Properly destroy game over UI elements using stored references
        if (this.gameOverText && this.gameOverText.active) {
          this.gameOverText.destroy();
          this.gameOverText = null;
        }
        if (this.restartText && this.restartText.active) {
          this.restartText.destroy();
          this.restartText = null;
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
        
        // Reset game state variables
        this.isGameOver = false;
        this.gameSpeed = 300;
        this.spawnTimer = 0;
        this.score = 0;
        this.spawnInterval = 2000;
        this.lastFistState = false;
        
        // Update score display
        this.scoreText.setText("Score: 0");
        
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