import Phaser from 'phaser'
import { Game } from './scenes/game';

const gameConfig: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    physics: {
        default: 'matter',
        matter: {
            gravity: {
                y: 0.05
            },
            debug: false
        }
    },
    scene: [Game]
};

export const game = new Phaser.Game(gameConfig);
