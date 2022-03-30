import { Scene } from 'phaser';
import { startTransription } from '../deepgram';
import { isNewHighScore } from '../utils/highScore';

/**
 * Main game scene
 */
export class Game extends Scene {
	/** Score text game object */
	score: Phaser.GameObjects.Text | null;
	/** Countdown timer text game object */
	countDown: Phaser.GameObjects.Text | null;

	/** `Poof` sound asset */
	poofSound: Phaser.Sound.BaseSound | null;

	/** DeepGram websocket */
	dgSocket: WebSocket | null;

	/** `y` velocity of spawned texts */
	velocityY = 80;
	/** Flag for new high score */
	isNewHI = false;
	/** Words from which texts should be spawned */
	words: string[] = [];
	/** No. of texts to be spawned at a time */
	spawnCount = 4;
	/** Millisecods remaining till game over */
	remainingSeconds = 30 * 1000;

	/** Timer for spawning texts */
	spawnTimer: Phaser.Time.TimerEvent | null;
	/** gameTimer emitting events after every second elapsed */
	gameTimer: Phaser.Time.TimerEvent | null;

	constructor() {
		super('game');
	}

	/**
	 * Scene lifecycle callback. Load assets required for this scene
	 */
	preload() {
		this.load.image('page', 'page.webp');
		this.load.spritesheet('poof', 'poof.png', {
			frameWidth: 256,
			frameHeight: 256
		});
		this.load.audio('poof', 'poof.wav');

		this.load.text('words', 'words.txt');
	}

	/**
	 * Scene lifecycle callback. Initialize and add required assets to scene
	 */
	async create() {
		this.reset();
		this.physics.world.gravity.y = 0;

		this.add.image(0, -100, 'page').setOrigin(0, 0).setScale(1, 0.85);
		this.poofSound = this.sound.add('poof');
		this.anims.create({
			key: 'poof',
			frames: this.anims.generateFrameNumbers('poof', {
				start: 0,
				end: 29
			}),
			hideOnComplete: true
		});
		this.words = (<string>this.cache.text.get('words')).split(',');

		this.setScore(0);
		this.setCountDown(this.remainingSeconds);
		this.dgSocket = await startTransription(this.onHit.bind(this));
		this.initTimers();
		this.spawnText();
	}

	/**
	 * Start timers
	 */
	initTimers() {
		this.time.addEvent({
			loop: true,
			callback: this.increaseDifficulty,
			callbackScope: this,
			delay: 2.5 * 1000
		});
		this.spawnTimer = this.time.addEvent({
			loop: true,
			callback: this.spawnText,
			callbackScope: this,
			delay: 1.5 * 1000
		});
		this.gameTimer = this.time.addEvent({
			callback: this.onSecondElapsed,
			callbackScope: this,
			delay: 1 * 1000,
			loop: true
		});
	}

	/**
	 * Timer event callback. Called on very second elapsed
	 */
	onSecondElapsed() {
		this.remainingSeconds = this.remainingSeconds - 1 * 1000;
		if (this.remainingSeconds >= 0) {
			if (this.remainingSeconds === 0) this.transitionToStartScene()
			this.setCountDown(this.remainingSeconds);
		}
	}

	/**
	 * Increase difficulty with time
	 */
	increaseDifficulty() {
		this.velocityY += this.remainingSeconds < 8 * 1000 ? 200 : 25
		this.spawnTimer.timeScale += this.remainingSeconds < 8 * 1000 ? 4 : 0.5
	}

	/**
	 * Spawn random text at random `x` position for `this.spawnCount` number of times with some delay 
	 */
	async spawnText() {
		const spawn = () => {
			const randomWord = this.words[Phaser.Math.Between(0, this.words.length - 1)];

			const text = this.add
				.text(Phaser.Math.Between(100, this.game.canvas.width - 100), 0, randomWord, {
					fontFamily: `"Indie Flower", cursive`,
					fontSize: '1.8rem',
					color: '#6b6b6b'
				})
				.setOrigin(0, 0)
				.setName(`text-${randomWord}`);

			const textWithPhysics = <Phaser.Types.Physics.Arcade.GameObjectWithDynamicBody>(
				this.physics.add.existing(text)
			);
			textWithPhysics.body.setVelocityY(this.velocityY);
		};
		this.time.addEvent({
			repeatCount: this.spawnCount,
			callback: spawn,
			delay: 0.1 * 1000
		});
	}

	/** Score text handler */
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

	/** Countdown timer text handler */
	setCountDown(missed: number) {
		const formattedTime = `⏱: ${this.formatCountDownTimer(missed)}`;
		if (this.countDown) {
			this.countDown.setText(formattedTime);
		} else {
			this.countDown = this.add
				.text(20, this.score.y + 30, formattedTime, {
					fontSize: '1.5rem',
					color: '#f00'
				})
				.setOrigin(0, 0);
		}
		this.countDown.setData('missed', missed);
	}

	/** Shows trophy on new highscore */
	showTrophy() {
		const trophyText = this.add
			.text(20, this.countDown.y + 30, `🏆`, {
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

	/**
	 * Hit text if transcript matches with any of the spawned text in scene 
	 * @param text - transcript result
	 */
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

	/** Stop current scene and switch to start game scene with score */
	transitionToStartScene() {
		if (this.dgSocket) this.dgSocket.close();
		this.scene.transition({
			target: 'startGame',
			data: {
				score: this.score.getData('score'),
				isNewHighScore: this.isNewHI
			}
		});
	}

	/**
	 * Utility fn to format millisecods to mm:ss format
	 * @param ms - Time in milliseconds
	 * @returns Formatted time
	 */
	formatCountDownTimer(ms: number) {
		const minutesRemaining = Math.floor(ms / (60 * 1000));
		const secondsRemaing = Math.floor((ms % (60 * 1000)) / 1000);
		const strMin = `0${minutesRemaining}`;
		const strSec =
			secondsRemaing.toString().length > 1 ? `${secondsRemaing}` : `0${secondsRemaing}`;
		return `${strMin}:${strSec}`;
	}

	/**
	 * Reset scene data
	 */
	reset() {
		this.score = null;
		this.countDown = null;

		this.poofSound = null;

		this.spawnTimer = null;
		this.gameTimer = null;

		this.dgSocket = null;
		this.velocityY = 80;
		this.isNewHI = false;
		this.words = [];
		this.spawnCount = 1;
		this.remainingSeconds = 30 * 1000;
	}
}
