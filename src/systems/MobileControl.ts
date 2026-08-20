// ============================================================
// MobileControl.ts
// NOVA OVERDRIVE
// Final Cyberpunk Mobile Control System
// ============================================================

import Phaser from "phaser";

type DriveDirection = "left" | "right";

export default class MobileControl {

    scene: Phaser.Scene;

    // ========================================================
    // INPUT STATE
    // ========================================================

    left = false;
    right = false;
    nitro = false;

    // ========================================================
    // BUTTONS
    // ========================================================

    leftButton!: Phaser.GameObjects.Container;
    rightButton!: Phaser.GameObjects.Container;
    nitroButton!: Phaser.GameObjects.Container;

    // ========================================================
    // TUTORIAL
    // ========================================================

    tutorialText!: Phaser.GameObjects.Text;

    private tutorialTimer = 4200;
    private tutorialActive = true;

    // ========================================================
    // VISUALS
    // ========================================================

    private leftGlow!: Phaser.GameObjects.Graphics;
    private rightGlow!: Phaser.GameObjects.Graphics;
    private nitroGlow!: Phaser.GameObjects.Graphics;

    private leftCore!: Phaser.GameObjects.Graphics;
    private rightCore!: Phaser.GameObjects.Graphics;

    private nitroCore!: Phaser.GameObjects.Graphics;

    private nitroRing!: Phaser.GameObjects.Graphics;

    private nitroLabel!: Phaser.GameObjects.Text;

    // ========================================================
    // CONSTANTS
    // ========================================================

    private readonly CYAN = 0x00eaff;
    private readonly BLUE = 0x168cff;
    private readonly ORANGE = 0xff8a18;

    private readonly WHITE = 0xeaffff;

    // ========================================================
    // STATE
    // ========================================================

    private destroyed = false;

    private nitroPointerDown = false;

    // ========================================================
    // DRAG / SWIPE STEERING (ON THE CAR)
    // ========================================================

    private carTarget?:
        Phaser.GameObjects.Sprite |
        Phaser.GameObjects.Image;

    private dragActive = false;

    // Small deadzone (in px) around the car's own x position,
    // just to stop 1px jitter from flickering left/right.
    // Direction is otherwise instant and continuous, based on
    // where the finger currently is relative to the car — not
    // relative to where the touch started. This is what makes
    // it feel like a direct steering wheel instead of a swipe
    // that needs to "travel" before it registers.
    private readonly STEER_DEADZONE = 6;

    private updateSteerFromPointer(
        pointer: Phaser.Input.Pointer
    ): void {

        if (!this.carTarget) {
            return;
        }

        const deltaX =
            pointer.x - this.carTarget.x;

        if (deltaX > this.STEER_DEADZONE) {

            this.left = false;
            this.right = true;

        } else if (deltaX < -this.STEER_DEADZONE) {

            this.left = true;
            this.right = false;

        } else {

            this.left = false;
            this.right = false;
        }
    }

    private handleCarPointerDown =
        (pointer: Phaser.Input.Pointer) => {

            if (
                pointer.button !== 0 &&
                pointer.button !== undefined
            ) {
                return;
            }

            this.dragActive = true;

            // React the instant the finger lands on the car -
            // no waiting for movement.
            this.updateSteerFromPointer(pointer);
        };

    private handleDragMove =
        (pointer: Phaser.Input.Pointer) => {

            if (
                !this.dragActive ||
                !pointer.isDown
            ) {
                return;
            }

            this.updateSteerFromPointer(pointer);
        };

    private handleDragUp =
        () => {

            if (!this.dragActive) {
                return;
            }

            this.dragActive = false;

            this.left = false;
            this.right = false;
        };

    // ========================================================
    // CONSTRUCTOR
    // ========================================================

    constructor(scene: Phaser.Scene) {

        this.scene = scene;

        this.createControls();

        this.createKeyboard();

        this.scene.events.once(
            "shutdown",
            this.destroy,
            this
        );
    }

    // ========================================================
    // CREATE CONTROLS
    // ========================================================

    private createControls(): void {

        this.leftButton =
            this.createDriveButton(
                48,
                715,
                "‹",
                "left"
            );

        this.rightButton =
            this.createDriveButton(
                352,
                715,
                "›",
                "right"
            );

        this.nitroButton =
            this.createNitroButton(
                325,
                585
            );

        this.tutorialText =
            this.scene.add.text(
                200,
                635,
                "TOUCH TO DRIVE",
                {
                    fontFamily: "Arial Black",
                    fontSize: "9px",
                    color: "#8aa6b8",
                    stroke: "#02070b",
                    strokeThickness: 4
                }
            );

        this.tutorialText
            .setOrigin(0.5)
            .setDepth(205)
            .setAlpha(0.9);

        // Global move/up listeners for car-drag steering.
        // They only act while dragActive is true (see setCarTarget),
        // so they're harmless to register up front.
        this.scene.input.on(
            "pointermove",
            this.handleDragMove,
            this
        );

        this.scene.input.on(
            "pointerup",
            this.handleDragUp,
            this
        );

        this.startIdleAnimations();
    }

    // ========================================================
    // CAR DRAG TARGET
    // ========================================================
    //
    // Call this once the car sprite exists (the car is usually
    // created after MobileControl, so wire it up afterwards):
    //
    //   this.mobile.setCarTarget(this.car);
    //
    // Pressing down directly on the car and dragging left/right
    // steers it, on top of the existing left/right/nitro buttons.
    // ========================================================

    setCarTarget(
        car: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image
    ): void {

        if (this.destroyed) {
            return;
        }

        // Detach from any previously assigned car.
        this.carTarget?.off(
            "pointerdown",
            this.handleCarPointerDown,
            this
        );

        this.carTarget = car;

        if (!car.input) {
            car.setInteractive({
                useHandCursor: false
            });
        }

        car.on(
            "pointerdown",
            this.handleCarPointerDown,
            this
        );
    }

    // ========================================================
    // DRIVE BUTTON
    // ========================================================

    private createDriveButton(
        x: number,
        y: number,
        symbol: string,
        type: DriveDirection
    ): Phaser.GameObjects.Container {

        const container =
            this.scene.add.container(
                x,
                y
            );

        container.setDepth(205);

        // ----------------------------------------------------
        // OUTER ENERGY FIELD
        // ----------------------------------------------------

        const glow =
            this.scene.add.graphics();

        glow.fillStyle(
            this.CYAN,
            0.035
        );

        glow.fillCircle(
            0,
            0,
            43
        );

        glow.lineStyle(
            1,
            this.CYAN,
            0.22
        );

        glow.strokeCircle(
            0,
            0,
            40
        );

        // ----------------------------------------------------
        // CORE
        // ----------------------------------------------------

        const core =
            this.scene.add.graphics();

        core.fillStyle(
            0x06131c,
            0.94
        );

        core.fillRoundedRect(
            -31,
            -31,
            62,
            62,
            20
        );

        core.lineStyle(
            1.5,
            this.CYAN,
            0.65
        );

        core.strokeRoundedRect(
            -31,
            -31,
            62,
            62,
            20
        );

        // ----------------------------------------------------
        // INNER PANEL
        // ----------------------------------------------------

        const inner =
            this.scene.add.graphics();

        inner.fillStyle(
            0x0b202b,
            0.8
        );

        inner.fillRoundedRect(
            -23,
            -23,
            46,
            46,
            15
        );

        inner.lineStyle(
            1,
            this.CYAN,
            0.22
        );

        inner.strokeRoundedRect(
            -23,
            -23,
            46,
            46,
            15
        );

        // ----------------------------------------------------
        // ARROW
        // ----------------------------------------------------

        const arrow =
            this.scene.add.text(
                0,
                -3,
                symbol,
                {
                    fontFamily: "Arial Black",
                    fontSize: "43px",
                    color: "#eaffff",
                    stroke: "#001319",
                    strokeThickness: 5
                }
            );

        arrow.setOrigin(0.5);

        // ----------------------------------------------------
        // SMALL LABEL
        // ----------------------------------------------------

        const label =
            this.scene.add.text(
                0,
                39,
                type === "left"
                    ? "L"
                    : "R",
                {
                    fontFamily: "Arial Black",
                    fontSize: "7px",
                    color: "#4e8291"
                }
            );

        label.setOrigin(0.5);

        container.add([
            glow,
            core,
            inner,
            arrow,
            label
        ]);

        container.setSize(
            82,
            82
        );

        container.setInteractive(
            new Phaser.Geom.Circle(
                0,
                0,
                42
            ),
            Phaser.Geom.Circle.Contains
        );

        // Store visuals.

        if (type === "left") {

            this.leftGlow = glow;
            this.leftCore = core;

        } else {

            this.rightGlow = glow;
            this.rightCore = core;
        }

        // ====================================================
        // POINTER DOWN
        // ====================================================

        container.on(
            "pointerdown",
            (pointer: Phaser.Input.Pointer) => {

                if (
                    pointer.button !== 0 &&
                    pointer.button !== undefined
                ) {
                    return;
                }

                if (type === "left") {

                    this.left = true;

                } else {

                    this.right = true;
                }

                this.pressDriveButton(
                    container,
                    glow,
                    core
                );
            }
        );

        // ====================================================
        // POINTER UP
        // ====================================================

        container.on(
            "pointerup",
            () => {

                if (type === "left") {

                    this.left = false;

                } else {

                    this.right = false;
                }

                this.releaseDriveButton(
                    container,
                    glow,
                    core
                );
            }
        );

        // ====================================================
        // POINTER OUT
        // ====================================================

        container.on(
            "pointerout",
            () => {

                if (type === "left") {

                    this.left = false;

                } else {

                    this.right = false;
                }

                this.releaseDriveButton(
                    container,
                    glow,
                    core
                );
            }
        );

        // ====================================================
        // POINTER UP OUTSIDE
        // ====================================================

        container.on(
            "pointerupoutside",
            () => {

                if (type === "left") {

                    this.left = false;

                } else {

                    this.right = false;
                }

                this.releaseDriveButton(
                    container,
                    glow,
                    core
                );
            }
        );

        return container;
    }

    // ========================================================
    // NITRO BUTTON
    // ========================================================

    private createNitroButton(
        x: number,
        y: number
    ): Phaser.GameObjects.Container {

        const container =
            this.scene.add.container(
                x,
                y
            );

        container.setDepth(210);

        // ----------------------------------------------------
        // OUTER AURA
        // ----------------------------------------------------

        const glow =
            this.scene.add.graphics();

        glow.fillStyle(
            this.ORANGE,
            0.035
        );

        glow.fillCircle(
            0,
            0,
            54
        );

        glow.lineStyle(
            1,
            this.ORANGE,
            0.25
        );

        glow.strokeCircle(
            0,
            0,
            47
        );

        // ----------------------------------------------------
        // ENERGY RING
        // ----------------------------------------------------

        const ring =
            this.scene.add.graphics();

        ring.lineStyle(
            2,
            this.ORANGE,
            0.75
        );

        ring.strokeCircle(
            0,
            0,
            39
        );

        // ----------------------------------------------------
        // BODY
        // ----------------------------------------------------

        const body =
            this.scene.add.graphics();

        body.fillStyle(
            0x0a1118,
            0.97
        );

        body.fillCircle(
            0,
            0,
            34
        );

        body.lineStyle(
            2,
            this.ORANGE,
            0.9
        );

        body.strokeCircle(
            0,
            0,
            34
        );

        // ----------------------------------------------------
        // INNER CORE
        // ----------------------------------------------------

        const core =
            this.scene.add.graphics();

        core.fillStyle(
            0x20150a,
            0.95
        );

        core.fillCircle(
            0,
            0,
            27
        );

        core.lineStyle(
            1,
            this.ORANGE,
            0.3
        );

        core.strokeCircle(
            0,
            0,
            27
        );

        // ----------------------------------------------------
        // NITRO SYMBOL
        // ----------------------------------------------------

        const icon =
            this.scene.add.text(
                0,
                -4,
                "N",
                {
                    fontFamily: "Arial Black",
                    fontSize: "25px",
                    color: "#fff1d2",
                    stroke: "#512400",
                    strokeThickness: 4
                }
            );

        icon.setOrigin(0.5);

        // ----------------------------------------------------
        // LABEL
        // ----------------------------------------------------

        const label =
            this.scene.add.text(
                0,
                52,
                "NITRO",
                {
                    fontFamily: "Arial Black",
                    fontSize: "8px",
                    color: "#ffb45e",
                    stroke: "#140b02",
                    strokeThickness: 3
                }
            );

        label.setOrigin(0.5);

        // ----------------------------------------------------
        // READY DOT
        // ----------------------------------------------------

        const dot =
            this.scene.add.circle(
                0,
                -43,
                3,
                this.ORANGE,
                0.95
            );

        container.add([
            glow,
            ring,
            body,
            core,
            icon,
            label,
            dot
        ]);

        container.setSize(
            100,
            100
        );

        container.setInteractive(
            new Phaser.Geom.Circle(
                0,
                0,
                47
            ),
            Phaser.Geom.Circle.Contains
        );

        // Store.

        this.nitroGlow = glow;

        this.nitroRing = ring;

        this.nitroCore = core;

        this.nitroLabel = label;

        // ====================================================
        // POINTER DOWN
        // ====================================================

        container.on(
            "pointerdown",
            () => {

                this.nitroPointerDown =
                    true;

                this.nitro = true;

                this.pressNitroButton();
            }
        );

        // ====================================================
        // POINTER UP
        // ====================================================

        container.on(
            "pointerup",
            () => {

                this.nitroPointerDown =
                    false;

                this.nitro = false;

                this.releaseNitroButton();
            }
        );

        // ====================================================
        // POINTER OUT
        // ====================================================

        container.on(
            "pointerout",
            () => {

                // Do NOT kill nitro immediately.
                //
                // This prevents mobile browsers from
                // cancelling the input when the finger
                // moves slightly outside the button.

                if (
                    this.nitroPointerDown
                ) {
                    return;
                }

                this.nitro = false;

                this.releaseNitroButton();
            }
        );

        // ====================================================
        // POINTER UP OUTSIDE
        // ====================================================

        container.on(
            "pointerupoutside",
            () => {

                this.nitroPointerDown =
                    false;

                this.nitro = false;

                this.releaseNitroButton();
            }
        );

        return container;
    }

    // ========================================================
    // DRIVE PRESS
    // ========================================================

    private pressDriveButton(
        button: Phaser.GameObjects.Container,
        glow: Phaser.GameObjects.Graphics,
        core: Phaser.GameObjects.Graphics
    ): void {

        this.scene.tweens.killTweensOf(
            button
        );

        button.setScale(
            0.93
        );

        glow.setAlpha(
            1
        );

        core.setAlpha(
            1
        );

        this.scene.tweens.add({

            targets: button,

            scaleX: 0.88,

            scaleY: 0.88,

            duration: 60,

            ease: "Quad.easeOut"
        });

        if (
            typeof navigator !== "undefined" &&
            navigator.vibrate
        ) {

            navigator.vibrate(8);
        }
    }

    // ========================================================
    // DRIVE RELEASE
    // ========================================================

    private releaseDriveButton(
        button: Phaser.GameObjects.Container,
        glow: Phaser.GameObjects.Graphics,
        core: Phaser.GameObjects.Graphics
    ): void {

        this.scene.tweens.killTweensOf(
            button
        );

        this.scene.tweens.add({

            targets: button,

            scaleX: 1,

            scaleY: 1,

            duration: 150,

            ease: "Back.easeOut"
        });
    }

    // ========================================================
    // NITRO PRESS
    // ========================================================

    private pressNitroButton(): void {

        this.scene.tweens.killTweensOf(
            this.nitroButton
        );

        this.nitroButton.setScale(
            0.92
        );

        this.nitroRing.setAlpha(
            1
        );

        this.nitroGlow.setAlpha(
            1
        );

        this.nitroCore.setAlpha(
            1
        );

        this.nitroLabel.setColor(
            "#fff1d2"
        );

        this.scene.tweens.add({

            targets:
                this.nitroButton,

            scaleX: 0.86,

            scaleY: 0.86,

            duration: 55,

            ease: "Quad.easeOut"
        });

        this.scene.tweens.add({

            targets:
                this.nitroRing,

            scale: 1.12,

            alpha: 0.55,

            duration: 90,

            yoyo: true,

            ease: "Sine.easeOut"
        });

        if (
            typeof navigator !== "undefined" &&
            navigator.vibrate
        ) {

            navigator.vibrate(18);
        }
    }

    // ========================================================
    // NITRO RELEASE
    // ========================================================

    private releaseNitroButton(): void {

        this.scene.tweens.killTweensOf(
            this.nitroButton
        );

        this.scene.tweens.add({

            targets:
                this.nitroButton,

            scaleX: 1,

            scaleY: 1,

            duration: 170,

            ease: "Back.easeOut"
        });
    }

    // ========================================================
    // IDLE ANIMATIONS
    // ========================================================

    private startIdleAnimations(): void {

        // ----------------------------------------------------
        // NITRO BREATHING
        // ----------------------------------------------------

        this.scene.tweens.add({

            targets:
                this.nitroGlow,

            alpha: {
                from: 0.35,
                to: 0.75
            },

            duration: 900,

            yoyo: true,

            repeat: -1,

            ease: "Sine.easeInOut"
        });

        // ----------------------------------------------------
        // NITRO RING
        // ----------------------------------------------------

        this.scene.tweens.add({

            targets:
                this.nitroRing,

            alpha: {
                from: 0.45,
                to: 0.9
            },

            duration: 750,

            yoyo: true,

            repeat: -1,

            ease: "Sine.easeInOut"
        });

        // ----------------------------------------------------
        // SIDE BUTTONS
        // ----------------------------------------------------

        this.scene.tweens.add({

            targets:
                [
                    this.leftGlow,
                    this.rightGlow
                ],

            alpha: {
                from: 0.55,
                to: 0.9
            },

            duration: 1100,

            yoyo: true,

            repeat: -1,

            ease: "Sine.easeInOut"
        });
    }

    // ========================================================
    // KEYBOARD
    // ========================================================

    private createKeyboard(): void {

        this.scene.input.keyboard?.on(
            "keydown",
            this.handleKeyDown,
            this
        );

        this.scene.input.keyboard?.on(
            "keyup",
            this.handleKeyUp,
            this
        );
    }

    // ========================================================
    // KEY DOWN
    // ========================================================

    private handleKeyDown(
        event: KeyboardEvent
    ): void {

        if (
            event.code === "ArrowLeft" ||
            event.code === "KeyA"
        ) {

            this.left = true;
        }

        if (
            event.code === "ArrowRight" ||
            event.code === "KeyD"
        ) {

            this.right = true;
        }

        if (
            event.code === "Space"
        ) {

            if (!this.nitro) {

                this.nitro = true;

                this.nitroPointerDown =
                    true;

                this.pressNitroButton();
            }
        }
    }

    // ========================================================
    // KEY UP
    // ========================================================

    private handleKeyUp(
        event: KeyboardEvent
    ): void {

        if (
            event.code === "ArrowLeft" ||
            event.code === "KeyA"
        ) {

            this.left = false;
        }

        if (
            event.code === "ArrowRight" ||
            event.code === "KeyD"
        ) {

            this.right = false;
        }

        if (
            event.code === "Space"
        ) {

            this.nitro = false;

            this.nitroPointerDown =
                false;

            this.releaseNitroButton();
        }
    }

    // ========================================================
    // UPDATE
    // ========================================================

    update(): void {

        if (this.destroyed) {
            return;
        }

        const delta =
            this.scene.game.loop.delta;

        // ----------------------------------------------------
        // TUTORIAL
        // ----------------------------------------------------

        if (
            this.tutorialActive
        ) {

            this.tutorialTimer -=
                delta;

            if (
                this.tutorialTimer <= 0
            ) {

                this.hideTutorial();

                this.tutorialActive =
                    false;
            }
        }

        // ----------------------------------------------------
        // SAFETY
        // ----------------------------------------------------

        if (
            this.left &&
            this.right
        ) {

            // Prevent impossible simultaneous steering.
            this.left = false;
            this.right = false;
        }
    }

    // ========================================================
    // HIDE TUTORIAL
    // ========================================================

    private hideTutorial(): void {

        const targets = [
            this.leftButton,
            this.rightButton,
            this.nitroButton,
            this.tutorialText
        ];

        this.scene.tweens.add({

            targets,

            alpha: 0,

            duration: 800,

            ease: "Sine.easeInOut",

            onComplete: () => {

                // Important:
                // We DO NOT destroy the buttons.
                //
                // They remain interactive even while
                // visually hidden. This means the game
                // never loses its controls.

            }
        });
    }

    // ========================================================
    // SHOW CONTROLS
    // ========================================================

    showControls(): void {

        if (this.destroyed) {
            return;
        }

        this.scene.tweens.killTweensOf([
            this.leftButton,
            this.rightButton,
            this.nitroButton,
            this.tutorialText
        ]);

        this.scene.tweens.add({

            targets: [
                this.leftButton,
                this.rightButton,
                this.nitroButton
            ],

            alpha: 1,

            duration: 350,

            ease: "Sine.easeOut"
        });
    }

    // ========================================================
    // SET CONTROL VISIBILITY
    // ========================================================

    setControlsVisible(
        visible: boolean
    ): void {

        const alpha =
            visible ? 1 : 0;

        this.leftButton.setAlpha(
            alpha
        );

        this.rightButton.setAlpha(
            alpha
        );

        this.nitroButton.setAlpha(
            alpha
        );
    }

    // ========================================================
    // RESET
    // ========================================================

    reset(): void {

        this.left = false;

        this.right = false;

        this.nitro = false;

        this.nitroPointerDown =
            false;

        this.dragActive = false;
    }

    // ========================================================
    // DESTROY
    // ========================================================

    destroy(): void {

        if (this.destroyed) {
            return;
        }

        this.destroyed = true;

        this.left = false;

        this.right = false;

        this.nitro = false;

        this.nitroPointerDown =
            false;

        this.dragActive = false;

        this.scene.input.off(
            "pointermove",
            this.handleDragMove,
            this
        );

        this.scene.input.off(
            "pointerup",
            this.handleDragUp,
            this
        );

        this.carTarget?.off(
            "pointerdown",
            this.handleCarPointerDown,
            this
        );

        this.scene.input.keyboard?.off(
            "keydown",
            this.handleKeyDown,
            this
        );

        this.scene.input.keyboard?.off(
            "keyup",
            this.handleKeyUp,
            this
        );

        this.scene.tweens.killTweensOf(
            this.leftButton
        );

        this.scene.tweens.killTweensOf(
            this.rightButton
        );

        this.scene.tweens.killTweensOf(
            this.nitroButton
        );

        this.scene.tweens.killTweensOf(
            this.nitroGlow
        );

        this.scene.tweens.killTweensOf(
            this.nitroRing
        );

        this.leftButton?.destroy();

        this.rightButton?.destroy();

        this.nitroButton?.destroy();

        this.tutorialText?.destroy();
    }
}