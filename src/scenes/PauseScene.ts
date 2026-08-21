import Phaser from "phaser";
import AudioSystem from "../systems/AudioSystem";

// ============================================================
// NIGHT ROAD — PREMIUM CYBERPUNK PAUSE HUD
// Phaser 4 + TypeScript
// UI REDESIGN ONLY
// ============================================================

const CONFIG = {
    colors: {
        bg: 0x02060a,
        panel: 0x06131b,
        panel2: 0x081b25,
        panelDark: 0x030a10,

        cyan: 0x00ffff,
        cyanBright: 0x9fffff,
        cyanDark: 0x007783,

        magenta: 0xff00d9,
        magentaDark: 0x73005f,

        white: 0xffffff,
        text: 0xeaffff,
        muted: 0x5f8995,
        dim: 0x27434d,

        green: 0x00ffb7,
        blue: 0x00aaff,
        red: 0xff315c,
        yellow: 0xffd600,
    },

    layout: {
        centerX: 200,

        panelY: 400,
        panelWidth: 350,
        panelHeight: 590,

        buttonWidth: 282,
        buttonHeight: 68,
    },

    animation: {
        hoverScale: 1.035,
        pressScale: 0.96,

        hoverDuration: 120,
        pressDuration: 75,

        pulseDuration: 1700,
        glowDuration: 2100,
    },
};

export default class PauseScene extends Phaser.Scene {

    // =========================================================
    // BUTTONS
    // =========================================================

    resumeButton!: Phaser.GameObjects.Container;
    restartButton!: Phaser.GameObjects.Container;
    menuButton!: Phaser.GameObjects.Container;

    // =========================================================
    // UI
    // =========================================================

    private title!: Phaser.GameObjects.Text;
    private subtitle!: Phaser.GameObjects.Text;

    private panel!: Phaser.GameObjects.Rectangle;

    private statusDot!: Phaser.GameObjects.Rectangle;
    private statusText!: Phaser.GameObjects.Text;

    private pulseLine!: Phaser.GameObjects.Rectangle;

    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    constructor() {
        super("PauseScene");
    }

    // =========================================================
    // CREATE
    // =========================================================

    create(): void {

        this.cameras.main.setBackgroundColor(
            CONFIG.colors.bg
        );

        this.createBackground();
        this.createAtmosphere();
        this.createHudFrame();
        this.createMainPanel();
        this.createHeader();
        this.createSystemStatus();
        this.createButtons();
        this.createFooter();

        this.animateEntrance();
    }

    // =========================================================
    // BACKGROUND
    // =========================================================

    private createBackground(): void {

        const overlay = this.add.rectangle(
            200,
            400,
            400,
            800,
            0x000000,
            0.82
        );

        overlay.setDepth(0);

        // subtle vertical grid

        const grid = this.add.graphics();

        grid.setDepth(1);

        grid.lineStyle(
            1,
            CONFIG.colors.cyan,
            0.025
        );

        for (let x = 0; x <= 400; x += 20) {

            grid.lineBetween(
                x,
                0,
                x,
                800
            );
        }

        for (let y = 0; y <= 800; y += 20) {

            grid.lineBetween(
                0,
                y,
                400,
                y
            );
        }

        // scanlines

        const scanlines = this.add.graphics();

        scanlines.setDepth(2);

        scanlines.lineStyle(
            1,
            CONFIG.colors.cyan,
            0.012
        );

        for (let y = 0; y < 800; y += 7) {

            scanlines.lineBetween(
                0,
                y,
                400,
                y
            );
        }

        // subtle horizontal data lines

        const dataLines = this.add.graphics();

        dataLines.setDepth(3);

        dataLines.lineStyle(
            1,
            CONFIG.colors.cyan,
            0.08
        );

        dataLines.lineBetween(
            0,
            96,
            58,
            96
        );

        dataLines.lineBetween(
            342,
            96,
            400,
            96
        );

        dataLines.lineStyle(
            1,
            CONFIG.colors.magenta,
            0.08
        );

        dataLines.lineBetween(
            0,
            704,
            48,
            704
        );

        dataLines.lineBetween(
            352,
            704,
            400,
            704
        );
    }

    // =========================================================
    // ATMOSPHERE
    // =========================================================

    private createAtmosphere(): void {

        const cyanGlow = this.add.ellipse(
            80,
            290,
            330,
            330,
            CONFIG.colors.cyan,
            0.055
        );

        cyanGlow.setDepth(2);

        this.tweens.add({
            targets: cyanGlow,
            alpha: 0.025,
            scale: 1.18,
            duration: CONFIG.animation.glowDuration,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        });

        const magentaGlow = this.add.ellipse(
            330,
            570,
            280,
            280,
            CONFIG.colors.magenta,
            0.045
        );

        magentaGlow.setDepth(2);

        this.tweens.add({
            targets: magentaGlow,
            alpha: 0.02,
            scale: 1.2,
            duration: 2600,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        });
    }

    // =========================================================
    // HUD FRAME
    // =========================================================

    private createHudFrame(): void {

        const frame = this.add.graphics();

        frame.setDepth(4);

        frame.lineStyle(
            2,
            CONFIG.colors.cyan,
            0.35
        );

        // top left

        frame.lineBetween(14, 18, 55, 18);
        frame.lineBetween(14, 18, 14, 56);

        // top right

        frame.lineBetween(345, 18, 386, 18);
        frame.lineBetween(386, 18, 386, 56);

        // bottom left

        frame.lineBetween(14, 744, 14, 782);
        frame.lineBetween(14, 782, 55, 782);

        // bottom right

        frame.lineBetween(345, 782, 386, 782);
        frame.lineBetween(386, 744, 386, 782);

        frame.lineStyle(
            1,
            CONFIG.colors.magenta,
            0.5
        );

        frame.lineBetween(
            23,
            31,
            43,
            31
        );

        frame.lineBetween(
            357,
            31,
            377,
            31
        );

        // tiny HUD marks

        this.add.text(
            25,
            70,
            "NOVA // SYSTEM",
            {
                fontFamily: "Arial Black",
                fontSize: "7px",
                color: "#3d707c",
                letterSpacing: 2,
            } as Phaser.Types.GameObjects.Text.TextStyle
        )
            .setDepth(5);

        this.add.text(
            375,
            70,
            "01",
            {
                fontFamily: "Arial Black",
                fontSize: "7px",
                color: "#00ffff",
            }
        )
            .setOrigin(1, 0)
            .setDepth(5);
    }

    // =========================================================
    // MAIN PANEL
    // =========================================================

    private createMainPanel(): void {

        // outer glow

        const glow = this.add.rectangle(
            200,
            CONFIG.layout.panelY,
            CONFIG.layout.panelWidth + 18,
            CONFIG.layout.panelHeight + 18,
            CONFIG.colors.cyan,
            0.025
        );

        glow.setDepth(5);

        this.tweens.add({
            targets: glow,
            alpha: 0.055,
            scaleX: 1.012,
            scaleY: 1.012,
            duration: CONFIG.animation.glowDuration,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        });

        // main panel

        this.panel = this.add.rectangle(
            200,
            CONFIG.layout.panelY,
            CONFIG.layout.panelWidth,
            CONFIG.layout.panelHeight,
            CONFIG.colors.panel,
            0.97
        );

        this.panel.setDepth(6);

        this.panel.setStrokeStyle(
            2,
            CONFIG.colors.cyan,
            0.65
        );

        // inner panel

        const inner = this.add.rectangle(
            200,
            CONFIG.layout.panelY,
            CONFIG.layout.panelWidth - 12,
            CONFIG.layout.panelHeight - 12,
            CONFIG.colors.panelDark,
            0.18
        );

        inner.setDepth(7);

        inner.setStrokeStyle(
            1,
            CONFIG.colors.cyan,
            0.12
        );

        // top strip

        const strip = this.add.rectangle(
            200,
            116,
            322,
            24,
            CONFIG.colors.cyan,
            0.035
        );

        strip.setDepth(8);

        const stripLine = this.add.rectangle(
            200,
            128,
            322,
            1,
            CONFIG.colors.cyan,
            0.3
        );

        stripLine.setDepth(9);

        this.add.text(
            45,
            118,
            "NIGHT ROAD // SESSION",
            {
                fontFamily: "Arial Black",
                fontSize: "7px",
                color: "#527d88",
                letterSpacing: 2,
            } as Phaser.Types.GameObjects.Text.TextStyle
        )
            .setDepth(10);

        this.add.text(
            355,
            118,
            "PAUSE.01",
            {
                fontFamily: "Arial Black",
                fontSize: "7px",
                color: "#00ffff",
                letterSpacing: 1,
            } as Phaser.Types.GameObjects.Text.TextStyle
        )
            .setOrigin(1, 0)
            .setDepth(10);

        this.createPanelCorners();
    }

    // =========================================================
    // PANEL CORNERS
    // =========================================================

    private createPanelCorners(): void {

        const g = this.add.graphics();

        g.setDepth(11);

        g.lineStyle(
            2,
            CONFIG.colors.cyan,
            0.75
        );

        // top left

        g.lineBetween(25, 105, 44, 105);
        g.lineBetween(25, 105, 25, 124);

        // top right

        g.lineBetween(356, 105, 375, 105);
        g.lineBetween(375, 105, 375, 124);

        // bottom left

        g.lineBetween(25, 695, 25, 714);
        g.lineBetween(25, 714, 44, 714);

        // bottom right

        g.lineBetween(356, 714, 375, 714);
        g.lineBetween(375, 695, 375, 714);

        // magenta accents

        g.lineStyle(
            1,
            CONFIG.colors.magenta,
            0.7
        );

        g.lineBetween(
            32,
            110,
            41,
            110
        );

        g.lineBetween(
            359,
            709,
            368,
            709
        );
    }

    // =========================================================
    // HEADER
    // =========================================================

    private createHeader(): void {

        // magenta ghost

        this.add.text(
            204,
            162,
            "PAUSED",
            {
                fontFamily: "Arial Black",
                fontSize: "48px",
                color: "#ff00d9",
                
            }
        )
            .setOrigin(0.5)
            .setDepth(12);

        // cyan title

        this.title = this.add.text(
            200,
            158,
            "PAUSED",
            {
                fontFamily: "Arial Black",
                fontSize: "48px",
                color: "#ffffff",
                stroke: "#00ffff",
                strokeThickness: 2,
                shadow: {
                    color: "#00ffff",
                    blur: 20,
                    fill: true,
                },
            }
        )
            .setOrigin(0.5)
            .setDepth(13);

        this.tweens.add({
            targets: this.title,
            alpha: 0.86,
            scaleX: 1.015,
            scaleY: 1.015,
            duration: CONFIG.animation.pulseDuration,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        });

        this.subtitle = this.add.text(
            200,
            198,
            "RACE SESSION SUSPENDED",
            {
                fontFamily: "Arial Black",
                fontSize: "8px",
                color: "#00ffff",
                letterSpacing: 3,
            } as Phaser.Types.GameObjects.Text.TextStyle
        )
            .setOrigin(0.5)
            .setDepth(13);

        // header line

        const line = this.add.rectangle(
            200,
            218,
            240,
            1,
            CONFIG.colors.cyan,
            0.35
        );

        line.setDepth(13);

        this.pulseLine = this.add.rectangle(
            80,
            218,
            42,
            2,
            CONFIG.colors.magenta,
            0.8
        );

        this.pulseLine.setDepth(14);

        this.tweens.add({
            targets: this.pulseLine,
            x: 320,
            duration: 1800,
            repeat: -1,
            ease: "Sine.easeInOut",
        });
    }

    // =========================================================
    // SYSTEM STATUS
    // =========================================================

    private createSystemStatus(): void {

        const statusPanel = this.add.rectangle(
            200,
            250,
            270,
            38,
            CONFIG.colors.panel2,
            0.7
        );

        statusPanel.setDepth(12);

        statusPanel.setStrokeStyle(
            1,
            CONFIG.colors.cyan,
            0.22
        );

        this.statusDot = this.add.rectangle(
            82,
            250,
            6,
            6,
            CONFIG.colors.green,
            1
        );

        this.statusDot.setDepth(14);

        this.statusText = this.add.text(
            95,
            250,
            "SYSTEM STATUS  //  STANDBY",
            {
                fontFamily: "Arial Black",
                fontSize: "8px",
                color: "#7ac5cf",
                letterSpacing: 1,
            } as Phaser.Types.GameObjects.Text.TextStyle
        )
            .setOrigin(0, 0.5)
            .setDepth(14);

        this.tweens.add({
            targets: this.statusDot,
            alpha: 0.35,
            duration: 850,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        });
    }

    // =========================================================
    // BUTTONS
    // =========================================================

    private createButtons(): void {

        this.resumeButton = this.createButton(
            200,
            335,
            "▶",
            "RESUME",
            "CONTINUE RACE",
            CONFIG.colors.cyan,
            CONFIG.colors.green
        );

        this.restartButton = this.createButton(
            200,
            445,
            "↻",
            "RESTART",
            "REINITIALIZE SESSION",
            CONFIG.colors.blue,
            CONFIG.colors.cyan
        );

        this.menuButton = this.createButton(
            200,
            555,
            "←",
            "MENU",
            "RETURN TO MAIN SYSTEM",
            CONFIG.colors.magenta,
            CONFIG.colors.cyan
        );

        // Resume

        this.makeInteractive(
            this.resumeButton,
            () => {

                this.scene.stop("PauseScene");

                this.scene.resume(
                    "GameScene"
                );
            }
        );

        // Restart

        this.makeInteractive(
            this.restartButton,
            () => {

                this.killAllAudio();

                this.scene.stop(
                    "GameScene"
                );

                this.scene.start(
                    "GameScene"
                );
            }
        );

        // Menu

        this.makeInteractive(
            this.menuButton,
            () => {

                this.killAllAudio();

                this.scene.stop(
                    "GameScene"
                );

                this.scene.start(
                    "MenuScene"
                );
            }
        );
    }

    // =========================================================
    // KILL ALL AUDIO
    // =========================================================
    // Master safety switch: stops EVERY sound currently playing
    // (music, sfx, zone-intro narration) immediately, regardless
    // of whether GameScene's own shutdown() has run yet.
    // Also cancels any queued/playing Web Speech narration used
    // as a fallback for the zone voice lines.
    // =========================================================

    private killAllAudio(): void {

        AudioSystem.stopGameMusic();

        this.sound.stopAll();

        if ("speechSynthesis" in window) {

            try {

                window.speechSynthesis.cancel();

            } catch { }

        }

    }

    // =========================================================
    // BUTTON CREATOR
    // =========================================================

    private createButton(
        x: number,
        y: number,
        icon: string,
        title: string,
        subtitle: string,
        primaryColor: number,
        accentColor: number
    ): Phaser.GameObjects.Container {

        // outer glow

        const glow = this.add.rectangle(
            0,
            0,
            CONFIG.layout.buttonWidth + 12,
            CONFIG.layout.buttonHeight + 12,
            primaryColor,
            0.025
        );

        // shadow

        const shadow = this.add.rectangle(
            0,
            5,
            CONFIG.layout.buttonWidth + 4,
            CONFIG.layout.buttonHeight + 4,
            0x000000,
            0.55
        );

        // base

        const bg = this.add.rectangle(
            0,
            0,
            CONFIG.layout.buttonWidth,
            CONFIG.layout.buttonHeight,
            CONFIG.colors.panelDark,
            0.98
        );

        bg.setStrokeStyle(
            1,
            primaryColor,
            0.72
        );

        // inner border

        const inner = this.add.rectangle(
            0,
            0,
            CONFIG.layout.buttonWidth - 8,
            CONFIG.layout.buttonHeight - 8,
            primaryColor,
            0
        );

        inner.setStrokeStyle(
            1,
            primaryColor,
            0.12
        );

        // left accent

        const leftAccent = this.add.rectangle(
            -CONFIG.layout.buttonWidth / 2 + 5,
            0,
            5,
            CONFIG.layout.buttonHeight - 14,
            primaryColor,
            0.9
        );

        // right accent

        const rightAccent = this.add.rectangle(
            CONFIG.layout.buttonWidth / 2 - 5,
            0,
            3,
            CONFIG.layout.buttonHeight - 24,
            accentColor,
            0.75
        );

        // top scan

        const scan = this.add.rectangle(
            0,
            -CONFIG.layout.buttonHeight / 2 + 5,
            CONFIG.layout.buttonWidth - 28,
            1,
            primaryColor,
            0.4
        );

        // icon box

        const iconBox = this.add.rectangle(
            -104,
            0,
            43,
            43,
            primaryColor,
            0.07
        );

        iconBox.setStrokeStyle(
            1,
            primaryColor,
            0.5
        );

        const iconText = this.add.text(
            -104,
            0,
            icon,
            {
                fontFamily: "Arial Black",
                fontSize: "23px",
                color: "#ffffff",
                stroke: "#" + primaryColor
                    .toString(16)
                    .padStart(6, "0"),
                strokeThickness: 1,
                shadow: {
                    color: "#" + primaryColor
                        .toString(16)
                        .padStart(6, "0"),
                    blur: 10,
                    fill: true,
                },
            }
        )
            .setOrigin(0.5);

        // title

        const label = this.add.text(
            -45,
            -9,
            title,
            {
                fontFamily: "Arial Black",
                fontSize: "16px",
                color: "#ffffff",
                letterSpacing: 1,
            } as Phaser.Types.GameObjects.Text.TextStyle
        )
            .setOrigin(0, 0.5);

        // subtitle

        const sub = this.add.text(
            -45,
            14,
            subtitle,
            {
                fontFamily: "Arial",
                fontSize: "7px",
                color: "#537984",
                letterSpacing: 1,
            } as Phaser.Types.GameObjects.Text.TextStyle
        )
            .setOrigin(0, 0.5);

        // tiny indicator

        const indicator = this.add.rectangle(
            116,
            -23,
            5,
            5,
            accentColor,
            0.8
        );

        // container

        const container = this.add.container(
            x,
            y,
            [
                glow,
                shadow,
                bg,
                inner,
                leftAccent,
                rightAccent,
                scan,
                iconBox,
                iconText,
                label,
                sub,
                indicator,
            ]
        );

        container.setDepth(20);

        // store references

        container.setData(
            "background",
            bg
        );

        container.setData(
            "glow",
            glow
        );

        container.setData(
            "primaryColor",
            primaryColor
        );

        container.setData(
            "accentColor",
            accentColor
        );

        return container;
    }

    // =========================================================
    // BUTTON INTERACTION
    // =========================================================

    private makeInteractive(
        button: Phaser.GameObjects.Container,
        callback: () => void
    ): void {

        // Explicit hit area for reliable mouse + touch input.
        button.setInteractive(
            new Phaser.Geom.Rectangle(
                -CONFIG.layout.buttonWidth / 2,
                -CONFIG.layout.buttonHeight / 2,
                CONFIG.layout.buttonWidth,
                CONFIG.layout.buttonHeight
            ),
            Phaser.Geom.Rectangle.Contains,
            true
        );

        const bg =
            button.getData(
                "background"
            ) as Phaser.GameObjects.Rectangle;

        const glow =
            button.getData(
                "glow"
            ) as Phaser.GameObjects.Rectangle;

        const primaryColor =
            button.getData(
                "primaryColor"
            ) as number;

        const accentColor =
            button.getData(
                "accentColor"
            ) as number;

        // Prevent duplicate activation from touch/pointer events.
        let actionLocked = false;

        const resetActionLock = () => {
            actionLocked = false;
        };

        // Desktop hover only. Touch devices do not need hover feedback.
        button.on(
            "pointerover",
            (pointer: Phaser.Input.Pointer) => {

                if ((pointer as any).pointerType === "touch") {
                    return;
                }

                this.tweens.killTweensOf(button);

                this.tweens.add({
                    targets: button,
                    scale: CONFIG.animation.hoverScale,
                    duration: CONFIG.animation.hoverDuration,
                    ease: "Quad.easeOut",
                });

                bg.setStrokeStyle(2, accentColor, 1);
                glow.setAlpha(0.09);
            }
        );

        button.on(
            "pointerout",
            (pointer: Phaser.Input.Pointer) => {

                if ((pointer as any).pointerType === "touch") {
                    return;
                }

                this.tweens.killTweensOf(button);

                this.tweens.add({
                    targets: button,
                    scale: 1,
                    duration: CONFIG.animation.hoverDuration,
                    ease: "Quad.easeOut",
                });

                bg.setStrokeStyle(1, primaryColor, 0.72);
                glow.setAlpha(0.025);
            }
        );

        // Main action: execute immediately on pointerdown.
        // The press animation is visual only and must never gate the callback.
        button.on(
            "pointerdown",
            (pointer: Phaser.Input.Pointer) => {

                if (actionLocked) {
                    return;
                }

                actionLocked = true;

                if (
                    typeof navigator !== "undefined" &&
                    navigator.vibrate
                ) {
                    navigator.vibrate(12);
                }

                AudioSystem.click();

                this.tweens.killTweensOf(button);

                this.tweens.add({
                    targets: button,
                    scale: CONFIG.animation.pressScale,
                    duration: CONFIG.animation.pressDuration,
                    yoyo: true,
                    ease: "Quad.easeOut",
                    onComplete: () => {
                        // Restore the visual state only.
                        button.setScale(1);
                        bg.setStrokeStyle(
                            1,
                            primaryColor,
                            0.72
                        );
                        glow.setAlpha(0.025);
                    },
                });

                // IMPORTANT: do not wait for the tween.
                // This makes touch activation reliable on mobile.
                callback();

                // Safety release for accidental duplicate pointer events.
                this.time.delayedCall(350, resetActionLock);
            }
        );
    }

    // =========================================================
    // FOOTER
    // =========================================================

    private createFooter(): void {

        this.add.text(
            200,
            658,
            "SYSTEM AWAITING USER INPUT",
            {
                fontFamily: "Arial Black",
                fontSize: "7px",
                color: "#426b76",
                letterSpacing: 2,
            } as Phaser.Types.GameObjects.Text.TextStyle
        )
            .setOrigin(0.5)
            .setDepth(15);

        const footerLine = this.add.rectangle(
            200,
            676,
            180,
            1,
            CONFIG.colors.cyan,
            0.18
        );

        footerLine.setDepth(15);

        this.add.text(
            200,
            695,
            "ESC  //  RESUME",
            {
                fontFamily: "Arial Black",
                fontSize: "7px",
                color: "#527985",
                letterSpacing: 1,
            } as Phaser.Types.GameObjects.Text.TextStyle
        )
            .setOrigin(0.5)
            .setDepth(15);
    }

    // =========================================================
    // ENTRANCE ANIMATION
    // =========================================================

    private animateEntrance(): void {

        const objects = [
            this.title,
            this.subtitle,
            this.resumeButton,
            this.restartButton,
            this.menuButton,
        ];

        objects.forEach(
            (object, index) => {

                object.setAlpha(0);
                object.setScale(0.92);

                this.tweens.add({
                    targets: object,
                    alpha: 1,
                    scale: 1,
                    duration: 260,
                    delay: 80 + index * 55,
                    ease: "Back.easeOut",
                });
            }
        );
    }

    // =========================================================
    // SHUTDOWN
    // =========================================================

    shutdown(): void {

        this.tweens.killAll();
    }
}