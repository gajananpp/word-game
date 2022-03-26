import { Scene } from "phaser";

export class Game extends Scene {

    TEXT_CATEGORY = 0b0001
    EXPLOSION_CATEGORY = 0b0010

    score: Phaser.GameObjects.Text | null
    spawnCount = 1
    textVelocity = 0.01
    gravityY = 0

    constructor() {
        super('game')
    }

    preload() {
        this.load.image('page', 'page.webp')
        this.load.spritesheet('poof', 'poof.png', {
            frameWidth: 256,
            frameHeight: 256
        })
    }

    create() {
        this.gravityY = (<Phaser.Types.Math.Vector2Like>this.matter.config.gravity).y
        this.matter.world.setBounds()

        this.add.image(0, -100, 'page').setOrigin(0, 0).setScale(1, 0.85)
        this.anims.create({
            key: 'poof',
            frames: this.anims.generateFrameNumbers('poof', {
                start: 0,
                end: 29
            }),
            frameRate: 15,
            hideOnComplete: true
        });

        this.setScore(0)
        this.spawnText()

        this.time.addEvent({
            loop: true,
            callback: this.increaseDifficulty,
            callbackScope: this,
            delay: 10 * 1000
        })
        this.time.addEvent({
            loop: true,
            callback: this.spawnText,
            callbackScope: this,
            delay: 1 * 1000
        })

        setTimeout(() => {
            const text = this.children.getByName('text-fantastic')

            const poofer = this.matter.add.sprite(0, 0, 'poof')
            poofer.setScale(2)
            poofer.setCollisionCategory(this.EXPLOSION_CATEGORY)
            poofer.setCollidesWith([])

            Phaser.Display.Align.In.Center(poofer, text)

            poofer.anims.play('poof', true)
            poofer.on(Phaser.Animations.Events.ANIMATION_UPDATE, (anim, frame: Phaser.Animations.AnimationFrame) => {
                if (frame.index === 6) {
                    text.destroy() 
                    this.setScore(this.score.getData('score') + 1)
                }
            })
            poofer.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                poofer.destroy()
            })
        }, 5000)
    }

    update() {

    }

    increaseDifficulty() {
        if (this.spawnCount < 6) {
            this.spawnCount++
        } else {
            this.gravityY = this.gravityY + 0.25
            this.matter.world.setGravity(0, this.gravityY)
        }
    }

    spawnText() {
        for (let i = 0; i < this.spawnCount; i++) {
            const text = this.add.text(Phaser.Math.Between(100, this.game.canvas.width), 0, "fantastic", {
                fontFamily: `"Indie Flower", cursive`,
                fontSize: '32px',
                color: '#6b6b6b',
                padding: {
                    top: -6,
                    bottom: -10
                }
            }).setOrigin(0, 0).setName('text-fantastic')

            const textMatter = <Phaser.Physics.Matter.Image>this.matter.add.gameObject(text)
            textMatter.setBounce(0)
            textMatter.setCollisionCategory(this.TEXT_CATEGORY)
            textMatter.setCollidesWith([this.TEXT_CATEGORY])
                textMatter.setOnCollideWith([(<any>this.matter.world.walls).top], (...a) => {
                    console.log(a[1].collision.normal)
                })  
        }
    }

    setScore(newScore: number) {
        if (this.score) {
            this.score.setText(`Score: ${newScore}`)
        } else {
            this.score = this.add.text(20, 20, `Score: ${newScore}`, {
                fontSize: '1.5rem',
                color: '#f00'
            }).setOrigin(0, 0)
        }
        this.score.setData('score', newScore)
    }
}