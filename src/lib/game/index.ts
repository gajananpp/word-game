import Phaser from 'phaser';
import { Game } from './scenes/game';
import { StartGame } from './scenes/start';

const gameConfig: Phaser.Types.Core.GameConfig = {
	type: Phaser.AUTO,
	width: 1280,
	height: 720,
	physics: {
		default: 'arcade',
		arcade: {
			gravity: {
				y: 10
			},
			debug: false
		}
	},
	scene: [StartGame, Game],
	scale: {
		mode: Phaser.Scale.FIT,
		autoCenter: Phaser.Scale.CENTER_BOTH
	}
};

export const game = new Phaser.Game(gameConfig);
