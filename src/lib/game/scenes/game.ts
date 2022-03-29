import { Scene } from 'phaser';
import { startTransription } from '../deepgram';
import { isNewHighScore } from '../utils/highScore';

export class Game extends Scene {
	score: Phaser.GameObjects.Text | null;
	countDown: Phaser.GameObjects.Text | null;

	poofSound: Phaser.Sound.BaseSound | null;

	dgSocket: WebSocket | null;

	velocityY = 80;
	isNewHI = false;
	words: string[] = [];
	spawnCount = 1;
	remainingSeconds = 2 * 60 * 1000;

	spawnTimer: Phaser.Time.TimerEvent | null;
	gameTimer: Phaser.Time.TimerEvent | null;

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

		this.load.text('words', 'words.txt');
	}

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

	initTimers() {
		this.time.addEvent({
			loop: true,
			callback: this.increaseDifficulty,
			callbackScope: this,
			delay: 5 * 1000
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

	onSecondElapsed() {
		this.remainingSeconds = this.remainingSeconds - 1 * 1000;
		if (this.remainingSeconds === 0) {
			this.transitionToStartScene();
		} else {
			this.setCountDown(this.remainingSeconds);
		}
	}

	increaseDifficulty() {
		if (this.spawnCount < 5) {
			this.spawnCount = this.spawnCount + 1;
		} else {
			this.velocityY = this.velocityY + 25;
			this.spawnTimer.timeScale = this.spawnTimer.timeScale + 1;
		}
	}

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

	setCountDown(missed: number) {
		const formattedTime = `⏱: ${this.formatCountDownTimer(missed)}`;
		console.log(formattedTime);
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

	formatCountDownTimer(ms: number) {
		const minutesRemaining = Math.floor(ms / (60 * 1000));
		const secondsRemaing = Math.floor((ms % (60 * 1000)) / 1000);
		const strMin = `0${minutesRemaining}`;
		const strSec =
			secondsRemaing.toString().length > 1 ? `${secondsRemaing}` : `0${secondsRemaing}`;
		return `${strMin}:${strSec}`;
	}

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
	}
}
