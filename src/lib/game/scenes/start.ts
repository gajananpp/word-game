import { Scene } from 'phaser';
import { getHighScore, setHighScore } from '../utils/highScore';

export class StartGame extends Scene {
	constructor() {
		super('startGame');
	}

	preload() {
		this.load.image('page', 'page.webp');
		this.load.spritesheet('button', 'buttons.png', {
			frameWidth: 256,
			frameHeight: 64
		});
	}

	create(params: { score?: number; isNewHighScore?: boolean; missedTexts?: string[] }) {
		const { score, isNewHighScore, missedTexts } = params;

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

		if (missedTexts?.length > 0) this.showMissedTexts(missedTexts);
	}

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

	showMissedTexts(missedTexts: string[]) {
		const textGOs = missedTexts.map((missedText) => {
			return this.add.text(0, 0, missedText, {
				fontFamily: `"Indie Flower", cursive`,
				fontSize: '1.8rem',
				color: '#6b6b6b',
				padding: {
					top: -6,
					bottom: -10
				}
			});
		});

		const startButton = <Phaser.GameObjects.Image>this.children.getByName('startButton');

		const missedWordsText = this.add.text(0, 0, 'Missed Words: ', {
			fontSize: '1.8rem',
			color: '#f00'
		});

		Phaser.Display.Align.In.BottomCenter(missedWordsText, startButton, 0, 80);

		Phaser.Actions.GridAlign(textGOs, {
			width: 5,
			height: 2,
			cellWidth: textGOs[0].width + 20,
			cellHeight: textGOs[0].height + 20,
			position: Phaser.Display.Align.CENTER,
			x: startButton.x - startButton.width,
			y: startButton.y - startButton.height + 210
		});
	}
}
