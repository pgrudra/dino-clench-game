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
  }

  create() {
    // 1. Start Hand Tracking (attaches itself to a hidden <video>)
    startHandTracking();

    // Debug: Check if textures are loaded
    console.log('Available textures:', this.textures.getTextureKeys());
    
    // 2. Ground
    this.ground = this.physics.add.staticGroup();
    this.ground.create(400, 568, "ground").setScale(2).refreshBody();

    // 3. Dino Player
    this.player = this.physics.add.sprite(100, 510, "dinoRun1");
    this.player.setScale(0.4);
    this.player.setActive(true);
    this.player.setVisible(true);
    this.player.setDepth(1);
    this.player.setCollideWorldBounds(true);
    this.player.setSize(60, 80).setOffset(40, 60);
    
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
      fontSize: "24px",
      fill: "#000"
    });
    this.scoreText.setScrollFactor(0);

    // 8. Ground Scrolling
    this.ground.tilePositionX = 0;

    // 9. Spawn first obstacle after 1–1.5 seconds
    this.spawnInterval = 1500; // ms
  }

  update(time, delta) {
    // 1. Handle Jump (space OR hand clench)
    const isFist = getClenchState();
    const onGround = this.player.body.blocked.down;
    
    // Update animation based on state
    if (!onGround) {
      this.player.play('dinoJump', true);
    } else if (this.player.body.velocity.x !== 0) {
      this.player.play('dinoRun', true);
    } else {
      this.player.play('dinoIdle', true);
    }

    if (
      (isFist || Phaser.Input.Keyboard.JustDown(this.spaceKey)) &&
      onGround &&
      time - this.lastJumpTime > 300
    ) {
      this.player.setVelocityY(-400);
      this.sound.play("jumpSfx");
      this.lastJumpTime = time;
    }

    // 2. Move ground texture to simulate running
    this.ground.tilePositionX += (this.gameSpeed * delta) / 1000;

    // 3. Spawn obstacles
    this.spawnTimer += delta;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnObstacle();
      this.spawnTimer = 0;
      // Gradually increase speed / decrease spawn interval
      this.gameSpeed += 2;
      this.spawnInterval = Math.max(800, this.spawnInterval - 10);
    }

    // 4. Move obstacles left
    this.obstacles.getChildren().forEach((obs) => {
      obs.setVelocityX(-this.gameSpeed);
      // Destroy off-screen obstacles
      if (obs.x < -50) {
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
    let key, yPos;
    if (rand === 0) {
      key = "cactusSmall";
      yPos = 520;
    } else if (rand === 1) {
      key = "cactusLarge";
      yPos = 500;
    } else {
      key = "ptero";
      yPos = 450;
    }
    const obstacle = this.obstacles.create(900, yPos, key);
    obstacle.setImmovable();
    obstacle.body.allowGravity = false;
  }

  gameOver() {
    this.sound.play("hitSfx");
    this.player.play('dinoDead');
    // Wait for death animation to complete before restarting
    this.time.delayedCall(1000, () => {
      this.scene.restart();
      this.gameSpeed = 300;
      this.spawnInterval = 1500;
      this.score = 0;
    });
  }
}
