import { Scene } from 'phaser';
import { getHighScore, setHighScore } from '../utils/highScore';

/**
 * Start game scene
 */
export class StartGame extends Scene {
	constructor() {
		super('startGame');
	}

	/**
	 * Scene lifecycle callback. Load assets required for this scene
	 */
	preload() {
		this.load.image('page', 'page.webp');
		this.load.spritesheet('button', 'buttons.png', {
			frameWidth: 256,
			frameHeight: 64
		});
	}

	/**
	 * Scene lifecycle callback. Initialize and add required assets to scene
	 */
	create(params: { score?: number; isNewHighScore?: boolean }) {
		const { score, isNewHighScore } = params;

		this.add.image(0, -100, 'page').setOrigin(0, 0).setScale(1, 0.85);
		this.anims.create({
			key: 'buttonClick',
			frames: this.anims.generateFrameNumbers('button', {
				start: 0,
				end: 1
			}),
			yoyo: true
		});

		this.createStartButton();

		const hi = isNewHighScore ? setHighScore(score) : getHighScore();
		if (hi > 0) this.showHighScore(hi);
		if (score >= 0) this.showScore(score, isNewHighScore);
	}

	/**
	 * Creates start button with `onClick` event to switch main game scene
	 * @returns Start button for game
	 */
	createStartButton() {
		const sceneCenterX = this.cameras.main.centerX;
		const sceneCenterY = this.cameras.main.centerY;

		const startButton = this.add
			.sprite(sceneCenterX, sceneCenterY, 'button')
			.setInteractive()
			.setName('startButton');
		const startText = this.add.text(sceneCenterX, sceneCenterY, 'START', {
			fontSize: '1.8rem'
		});
		Phaser.Display.Align.In.Center(startText, startButton);

		startButton.on('pointerdown', () => {
			startButton.play('buttonClick');
			startButton.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
				this.scene.transition({
					target: 'game'
				});
			});
		});

		return startButton;
	}

	/**
	 * Renders score in scene along with trophy if required
	 * @param score - Current game score
	 * @param isNewHighScore - `true` if `score` is the new high score
	 * @returns Score text game object
	 */
	showScore(score: number, isNewHighScore: boolean) {
		const scoreText = this.add.text(0, 0, `Score: ${score}`, {
			fontSize: '1.8rem',
			color: '#f00'
		});
		Phaser.Display.Align.In.TopCenter(
			scoreText,
			this.children.getByName('hiText') || this.children.getByName('startButton'),
			0,
			50
		);
		if (isNewHighScore) {
			const trophyText = this.add.text(0, 0, `🏆`, {
				fontSize: '8rem'
			});
			Phaser.Display.Align.In.TopCenter(trophyText, scoreText, 0, 150);
		}
		return scoreText;
	}

	/**
	 * Renders high score in scene
	 * @param highScore - High score
	 * @returns High score text game object
	 */
	showHighScore(highScore: number) {
		const hiText = this.add
			.text(0, 0, `High Score: ${highScore}`, {
				fontSize: '1.8rem',
				color: '#f00'
			})
			.setName('hiText');
		Phaser.Display.Align.In.TopCenter(hiText, this.children.getByName('startButton'), 0, 50);
		return hiText;
	}
}
