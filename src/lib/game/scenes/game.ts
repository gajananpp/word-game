import { Scene } from 'phaser';
import { isNewHighScore } from '../utils/highScore';

export class Game extends Scene {
	score: Phaser.GameObjects.Text | null;
	missed: Phaser.GameObjects.Text | null;

	poofSound: Phaser.Sound.BaseSound | null;
	missedSound: Phaser.Sound.BaseSound | null;

	spawnCount = 1;
	textVelocity = 0.01;
	velocityY = 50;

	isNewHI = false;

	constructor() {
		super('game');
	}

	preload() {
		this.load.image('page', 'page.webp');
		this.load.spritesheet('poof', 'poof.png', {
			frameWidth: 256,
			frameHeight: 256
		});
		this.load.audio('poof', 'poof.wav');
		this.load.audio('missed', 'missed.wav');
	}

	create() {
		this.reset();
		this.physics.world.gravity.y = 0;

		this.add.image(0, -100, 'page').setOrigin(0, 0).setScale(1, 0.85);
		this.poofSound = this.sound.add('poof');
		this.missedSound = this.sound.add('missed');
		this.anims.create({
			key: 'poof',
			frames: this.anims.generateFrameNumbers('poof', {
				start: 0,
				end: 29
			}),
			hideOnComplete: true
		});

		this.physics.world.on(
			Phaser.Physics.Arcade.Events.WORLD_BOUNDS,
			(bo: Phaser.Physics.Arcade.Body, top: boolean, down: boolean) => {
				if (down) this.onTextMissed(bo.gameObject);
			}
		);

		this.setScore(0);
		this.setMissed(0);
		this.spawnText();
		this.initTimers();
	}

	initTimers() {
		this.time.addEvent({
			loop: true,
			callback: this.increaseDifficulty,
			callbackScope: this,
			delay: 10 * 1000
		});
		this.time.addEvent({
			loop: true,
			callback: this.spawnText,
			callbackScope: this,
			delay: 1 * 1000
		});
	}

	increaseDifficulty() {
		if (this.spawnCount < 6) {
			this.spawnCount++;
			this.velocityY = this.velocityY + 25;
		} else {
			this.velocityY = this.velocityY + 50;
		}
	}

	spawnText() {
		const spawn = () => {
			const text = this.add
				.text(Phaser.Math.Between(100, this.game.canvas.width - 100), 0, 'fantastic', {
					fontFamily: `"Indie Flower", cursive`,
					fontSize: '1.8rem',
					color: '#6b6b6b',
					padding: {
						top: -6,
						bottom: -10
					}
				})
				.setOrigin(0, 0)
				.setName('text-fantastic');

			const textWithPhysics = <Phaser.Types.Physics.Arcade.GameObjectWithDynamicBody>(
				this.physics.add.existing(text)
			);
			textWithPhysics.body.setCollideWorldBounds(true);
			textWithPhysics.body.onWorldBounds = true;
			textWithPhysics.body.setVelocityY(this.velocityY);
		};

		this.time.addEvent({
			delay: 0.05 * 1000,
			repeatCount: this.spawnCount,
			callback: spawn
		});
	}

	setScore(newScore: number) {
		if (this.score) {
			this.score.setText(`Score: ${newScore}`);
		} else {
			this.score = this.add
				.text(20, 20, `Score: ${newScore}`, {
					fontSize: '1.5rem',
					color: '#f00'
				})
				.setOrigin(0, 0);
		}
		if (!this.isNewHI && isNewHighScore(newScore)) {
			this.isNewHI = true;
			this.showTrophy();
		}
		this.score.setData('score', newScore);
	}

	setMissed(missed: number) {
		if (this.missed) {
			this.missed.setText(`Missed: ${missed}/10`);
		} else {
			this.missed = this.add
				.text(20, this.score.y + 30, `Missed: ${missed}/10`, {
					fontSize: '1.5rem',
					color: '#f00'
				})
				.setOrigin(0, 0);
		}
		this.missed.setData('missed', missed);
	}

	showTrophy() {
		const trophyText = this.add
			.text(20, this.missed.y + 30, `🏆`, {
				fontSize: '2rem',
				color: '#f00'
			})
			.setOrigin(0, 0);
		this.tweens.add({
			targets: trophyText,
			scale: 1.2,
			yoyo: true,
			repeat: 3,
			duration: 50
		});
	}

	onHit(text: string) {
		const textGO = this.children.getByName(`text-${text}`);
		if (textGO) {
			const poofer = this.physics.add.sprite(0, 0, 'poof');
			poofer.setScale(1.5);

			Phaser.Display.Align.In.Center(poofer, textGO);

			poofer.anims.play('poof', true);
			this.poofSound.play();
			poofer.on(
				Phaser.Animations.Events.ANIMATION_UPDATE,
				(anim, frame: Phaser.Animations.AnimationFrame) => {
					if (frame.index === 6) {
						textGO.destroy();
						this.setScore(this.score.getData('score') + 1);
					}
				}
			);
			poofer.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
				poofer.destroy();
			});
		}
	}

	onTextMissed(textGO: Phaser.GameObjects.GameObject) {
		this.missedSound.play();
		textGO.destroy();
		const missed = this.missed.getData('missed') + 1;
		if (missed <= 10) {
			this.setMissed(missed);
			if (missed == 10) this.transitionToStartScene();
		}
	}

	transitionToStartScene() {
		this.scene.transition({
			target: 'startgame',
			data: {
				score: this.score.getData('score'),
				isNewHighScore: this.isNewHI
			}
		});
	}

	reset() {
		this.score = null;
		this.missed = null;

		this.poofSound = null;
		this.missedSound = null;

		this.spawnCount = 1;
		this.textVelocity = 0.01;
		this.velocityY = 50;

		this.isNewHI = false;
	}
}
