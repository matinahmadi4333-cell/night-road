import Phaser from "phaser";
import SaveSystem from "../systems/SaveSystem";
import AudioSystem from "../systems/AudioSystem";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

export default class MenuScene extends Phaser.Scene {

    title!: Phaser.GameObjects.Text;

    private W = 400;
    private H = 800;

    // ============================================================
    // COLORS
    // ============================================================

    private readonly CYAN = 0x00ffff;
    private readonly CYAN_DARK = 0x007f91;
    private readonly MAGENTA = 0xff00e6;
    private readonly BLUE = 0x168cff;
    private readonly WHITE = 0xffffff;
    private readonly PANEL = 0x050d16;
    private readonly PANEL_2 = 0x07131d;

    constructor() {
        super("MenuScene");
    }

    // ============================================================
    // PRELOAD
    // ============================================================

    preload() {

        this.load.image(
            "menu_bg",
            "/assets/menu_bg.jpg"
        );

    }

    // ============================================================
    // CREATE
    // ============================================================

    create() {

        AudioSystem.init(this);
        AudioSystem.playMenuMusic();
        SaveSystem.load();

        this.W = this.scale.width;
        this.H = this.scale.height;

        const W = this.W;
        const H = this.H;

        // ========================================================
        // BACKGROUND
        // ========================================================

        const bg = this.add.image(
            W / 2,
            H / 2,
            "menu_bg"
        );

        bg
            .setDisplaySize(W, H)
            .setDepth(0);

        // Main cinematic overlay
        const dark = this.add.rectangle(
            W / 2,
            H / 2,
            W,
            H,
            0x01050a,
            0.34
        );

        dark.setDepth(1);

        // Side vignette
        const vignette = this.add.graphics();

        vignette.setDepth(2);

        vignette.fillStyle(
            0x000000,
            0.38
        );

        vignette.fillRect(
            0,
            0,
            18,
            H
        );

        vignette.fillRect(
            W - 18,
            0,
            18,
            H
        );

        // Bottom shadow
        const bottomShadow = this.add.graphics();

        bottomShadow.setDepth(2);

        bottomShadow.fillStyle(
            0x000000,
            0.50
        );

        bottomShadow.fillRect(
            0,
            H * 0.58,
            W,
            H * 0.42
        );

        // ========================================================
        // BACKGROUND HUD DETAILS
        // ========================================================

        this.createCityHUD();
        this.createScanlines();
        this.createParticles();

        // ========================================================
        // TITLE
        // ========================================================

        this.createTitle();

        // ========================================================
        // TAGLINE
        // ========================================================

        this.createTagline();

        // ========================================================
        // STATS
        // ========================================================

        this.createStatsPanel(
            W / 2,
            237
        );

        // ========================================================
        // MAIN PLAY
        // ========================================================

        this.makeButton(
            W / 2,
            370,
            "PLAY",
            () => {
                this.scene.start("GameScene");
            },
            true
        );

        // ========================================================
        // SECONDARY BUTTONS
        // ========================================================

        this.makeButton(
            W / 2,
            470,
            "GARAGE",
            () => {
                this.scene.start("GarageScene");
            }
        );

        this.makeButton(
            W / 2,
            555,
            "SETTINGS",
            () => {
                this.scene.start("SettingsScene");
            }
        );

        this.makeButton(
            W / 2,
            640,
            "EXIT",
            () => {
                this.exitApp();
            }
        );

        // ========================================================
        // FOOTER
        // ========================================================

        this.createFooter(
            W / 2,
            H - 48
        );
    }

    // ============================================================
    // EXIT APP
    // ============================================================
    //
    // window.location.reload() is NOT an exit - it just reloads
    // the page, which is why the button did nothing useful on
    // an installed APK. Browsers/webviews don't let plain JS
    // close themselves for security reasons, so this tries the
    // native bridges real APK wrappers expose, in order, and
    // only falls back to window.close() (which mostly only works
    // if the page was opened by script) if none of them exist.
    // ============================================================

    private exitApp(): void {

        // Proper way for this project (Capacitor 8):
        // once @capacitor/app is installed and synced,
        // this is the reliable path on a real device/APK.
        if (Capacitor.isNativePlatform()) {
            App.exitApp();
            return;
        }

        const w = window as any;

        // Cordova (kept as a fallback, harmless if unused)
        if (w.navigator?.app?.exitApp) {
            w.navigator.app.exitApp();
            return;
        }

        // Generic Android WebView bridge some custom
        // wrappers expose via addJavascriptInterface.
        if (w.Android?.exitApp) {
            w.Android.exitApp();
            return;
        }

        // Last resort - only works for windows opened by script.
        // If none of the above worked, there's nothing more JS
        // can legally do (browsers/webviews block scripted exit
        // for security). We intentionally show nothing here.
        window.close();
    }

    // ============================================================
    // TITLE
    // ============================================================

    private createTitle() {

        const x = this.W / 2;

        // Large atmospheric glow
        const glow = this.add.text(
            x,
            79,
            "NIGHT ROAD",
            {
                fontFamily: "Arial Black",
                fontSize: "48px",
                color: "#00ffff"
            }
        );

        glow
            .setOrigin(0.5)
            .setAlpha(0.10)
            .setScale(1.04)
            .setDepth(8);

        // Main title
        this.title = this.add.text(
            x,
            79,
            "NIGHT ROAD",
            {
                fontFamily: "Arial Black",
                fontSize: "48px",
                color: "#ffffff",
                stroke: "#00ffff",
                strokeThickness: 5,
                shadow: {
                    color: "#00ffff",
                    blur: 24,
                    fill: true
                }
            }
        );

        this.title
            .setOrigin(0.5)
            .setDepth(12);

        // Magenta glitch copy
        const glitch = this.add.text(
            x + 2,
            79,
            "NIGHT ROAD",
            {
                fontFamily: "Arial Black",
                fontSize: "48px",
                color: "#ff00e6"
            }
        );

        glitch
            .setOrigin(0.5)
            .setAlpha(0)
            .setDepth(11);

        // Random glitch animation
        this.time.addEvent({
            delay: 1800,
            loop: true,
            callback: () => {

                if (Math.random() > 0.45) {

                    glitch
                        .setAlpha(0.65)
                        .setX(
                            x +
                            Phaser.Math.Between(-4, 4)
                        );

                    this.time.delayedCall(
                        55,
                        () => {
                            glitch.setAlpha(0);
                            glitch.setX(x);
                        }
                    );
                }
            }
        });

        // Horizontal cyber streaks
        for (let i = 0; i < 6; i++) {

            const streak = this.add.rectangle(
                x +
                Phaser.Math.Between(-100, 100),
                58 +
                Phaser.Math.Between(-18, 35),
                Phaser.Math.Between(15, 85),
                Phaser.Math.Between(1, 2),
                i % 2 === 0
                    ? this.CYAN
                    : this.MAGENTA,
                0.35
            );

            streak.setDepth(10);

            this.tweens.add({
                targets: streak,
                x: streak.x +
                    Phaser.Math.Between(-25, 25),
                alpha: 0,
                duration: Phaser.Math.Between(500, 1100),
                delay: Phaser.Math.Between(200, 1800),
                repeat: -1,
                yoyo: true
            });
        }

        // Small upper technical line
        this.drawHUDLine(
            x - 135,
            48,
            x + 135,
            48,
            this.CYAN,
            0.30,
            1
        );

        // Small lower technical line
        this.drawHUDLine(
            x - 100,
            111,
            x + 100,
            111,
            this.MAGENTA,
            0.30,
            1
        );
    }

    // ============================================================
    // TAGLINE
    // ============================================================

    private createTagline() {

        const text = this.add.text(
            this.W / 2,
            143,
            "DRIVE  •  SURVIVE  •  DOMINATE",
            {
                fontFamily: "Arial",
                fontSize: "14px",
                color: "#00ffff"
            }
        );

        text
            .setOrigin(0.5)
            .setDepth(15);

        // Side technical marks
        this.drawHUDLine(
            25,
            143,
            62,
            143,
            this.CYAN,
            0.45,
            1
        );

        this.drawHUDLine(
            this.W - 62,
            143,
            this.W - 25,
            143,
            this.CYAN,
            0.45,
            1
        );

        this.add.rectangle(
            22,
            143,
            3,
            3,
            this.MAGENTA,
            0.8
        ).setDepth(15);

        this.add.rectangle(
            this.W - 22,
            143,
            3,
            3,
            this.MAGENTA,
            0.8
        ).setDepth(15);
    }

    // ============================================================
    // STATS PANEL
    // ============================================================

    private createStatsPanel(
        x: number,
        y: number
    ) {

        const width = 350;
        const height = 94;

        // ---------------------------------------------
        // Outer atmospheric glow
        // ---------------------------------------------

        const glow = this.add.graphics();

        glow.setDepth(4);

        glow.fillStyle(
            this.CYAN,
            0.045
        );

        this.drawCutRect(
            glow,
            x,
            y,
            width + 16,
            height + 16,
            14
        );

        // ---------------------------------------------
        // Main panel
        // ---------------------------------------------

        const panel = this.add.graphics();

        panel.setDepth(7);

        panel.fillStyle(
            this.PANEL,
            0.88
        );

        this.drawCutRect(
            panel,
            x,
            y,
            width,
            height,
            13
        );

        // Outer cyan frame
        panel.lineStyle(
            2,
            this.CYAN,
            0.95
        );

        this.drawCutRectStroke(
            panel,
            x,
            y,
            width,
            height,
            13
        );

        // Inner frame
        panel.lineStyle(
            1,
            this.CYAN,
            0.18
        );

        this.drawCutRectStroke(
            panel,
            x,
            y,
            width - 8,
            height - 8,
            9
        );

        // ---------------------------------------------
        // Magenta accent
        // ---------------------------------------------

        this.drawHUDLine(
            x + 112,
            y - height / 2,
            x + 145,
            y - height / 2,
            this.MAGENTA,
            0.85,
            2
        );

        this.drawHUDLine(
            x - 145,
            y + height / 2,
            x - 112,
            y + height / 2,
            this.MAGENTA,
            0.65,
            2
        );

        // ---------------------------------------------
        // Central divider
        // ---------------------------------------------

        const divider = this.add.graphics();

        divider.setDepth(12);

        divider.lineStyle(
            1,
            this.CYAN,
            0.38
        );

        divider.beginPath();

        divider.moveTo(
            x,
            y - 28
        );

        divider.lineTo(
            x,
            y + 28
        );

        divider.strokePath();

        // ---------------------------------------------
        // BEST ICON
        // ---------------------------------------------

        this.drawTrophyIcon(
            x - 130,
            y - 18
        );

        this.add.text(
            x - 95,
            y - 22,
            "BEST",
            {
                fontFamily: "Arial",
                fontSize: "12px",
                color: "#a5adb7"
            }
        )
        .setOrigin(0.5)
        .setDepth(15);

        // Best value
        const best = this.add.text(
            x - 87,
            y + 20,
            String(
                SaveSystem.saveData.bestScore
            ),
            {
                fontFamily: "Arial Black",
                fontSize: "27px",
                color: "#ffffff",
                shadow: {
                    color: "#00ffff",
                    blur: 15,
                    fill: true
                }
            }
        );

        best
            .setOrigin(0.5)
            .setDepth(15);

        // ---------------------------------------------
        // CRYSTAL ICON
        // ---------------------------------------------

        this.drawCrystalIcon(
            x + 70,
            y - 18
        );

        this.add.text(
            x + 110,
            y - 22,
            "CRYSTALS",
            {
                fontFamily: "Arial",
                fontSize: "12px",
                color: "#a5adb7"
            }
        )
        .setOrigin(0.5)
        .setDepth(15);

        const crystals = this.add.text(
            x + 105,
            y + 20,
            String(
                SaveSystem.getCrystals()
            ),
            {
                fontFamily: "Arial Black",
                fontSize: "28px",
                color: "#00ffff",
                shadow: {
                    color: "#00ffff",
                    blur: 18,
                    fill: true
                }
            }
        );

        crystals
            .setOrigin(0.5)
            .setDepth(15);

        // Crystal animation
        this.tweens.add({
            targets: crystals,
            alpha: {
                from: 0.78,
                to: 1
            },
            scale: {
                from: 1,
                to: 1.045
            },
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut"
        });

        // ---------------------------------------------
        // Tiny HUD marks
        // ---------------------------------------------

        this.drawSmallBrackets(
            x - width / 2 + 9,
            y,
            this.CYAN
        );

        this.drawSmallBrackets(
            x + width / 2 - 9,
            y,
            this.MAGENTA
        );
    }

    // ============================================================
    // BUTTON
    // ============================================================

    private makeButton(
        x: number,
        y: number,
        text: string,
        callback: Function,
        main = false
    ) {

        const width = main
            ? 306
            : 278;

        const height = main
            ? 88
            : 67;

        const cut = main
            ? 17
            : 13;

        const primaryColor = main
            ? this.MAGENTA
            : this.CYAN;

        const secondaryColor = main
            ? this.CYAN
            : this.BLUE;

        // ========================================================
        // OUTER GLOW LAYERS
        // ========================================================

        const outerGlow = this.add.graphics();

        outerGlow.setDepth(5);

        outerGlow.fillStyle(
            primaryColor,
            main ? 0.075 : 0.045
        );

        this.drawCutRect(
            outerGlow,
            x,
            y,
            width + 22,
            height + 22,
            cut + 4
        );

        const midGlow = this.add.graphics();

        midGlow.setDepth(6);

        midGlow.fillStyle(
            secondaryColor,
            main ? 0.055 : 0.035
        );

        this.drawCutRect(
            midGlow,
            x,
            y,
            width + 11,
            height + 11,
            cut + 2
        );

        // ========================================================
        // MAIN BODY
        // ========================================================

        const panel = this.add.graphics();

        panel.setDepth(8);

        panel.fillStyle(
            this.PANEL_2,
            0.91
        );

        this.drawCutRect(
            panel,
            x,
            y,
            width,
            height,
            cut
        );

        // Outer frame
        panel.lineStyle(
            main ? 3 : 2,
            primaryColor,
            0.98
        );

        this.drawCutRectStroke(
            panel,
            x,
            y,
            width,
            height,
            cut
        );

        // Inner frame
        panel.lineStyle(
            1,
            secondaryColor,
            0.28
        );

        this.drawCutRectStroke(
            panel,
            x,
            y,
            width - 9,
            height - 9,
            Math.max(5, cut - 5)
        );

        // ========================================================
        // INTERNAL GRID
        // ========================================================

        this.drawPanelGrid(
            x,
            y,
            width,
            height
        );

        // ========================================================
        // TOP TECH BAR
        // ========================================================

        this.drawHUDLine(
            x - width / 2 + 38,
            y - height / 2,
            x + width / 2 - 65,
            y - height / 2,
            secondaryColor,
            0.75,
            main ? 2 : 1
        );

        // Small top notch
        this.drawHUDLine(
            x + width / 2 - 65,
            y - height / 2,
            x + width / 2 - 47,
            y - height / 2 + 7,
            primaryColor,
            0.75,
            1
        );

        // ========================================================
        // BOTTOM ACCENT
        // ========================================================

        this.drawHUDLine(
            x - width / 2 + 60,
            y + height / 2,
            x + width / 2 - 32,
            y + height / 2,
            primaryColor,
            0.58,
            2
        );

        // ========================================================
        // SIDE BRACKETS
        // ========================================================

        this.drawButtonBrackets(
            x,
            y,
            width,
            height,
            primaryColor,
            main
        );

        // ========================================================
        // ICON
        // ========================================================

        if (!main) {

            if (text === "GARAGE") {

                this.drawGarageIcon(
                    x - width / 2 + 36,
                    y,
                    primaryColor
                );

            } else if (text === "SETTINGS") {

                this.drawGearIcon(
                    x - width / 2 + 36,
                    y,
                    primaryColor
                );

            } else if (text === "EXIT") {

                this.drawExitIcon(
                    x - width / 2 + 36,
                    y,
                    primaryColor
                );
            }
        }

        // ========================================================
        // LABEL
        // ========================================================

        const label = this.add.text(
            x + (main ? 0 : 10),
            y,
            text,
            {
                fontFamily: "Arial Black",
                fontSize: main
                    ? "37px"
                    : "24px",
                color: "#ffffff",
                shadow: {
                    color: "#00ffff",
                    blur: main ? 20 : 13,
                    fill: true
                }
            }
        );

        label
            .setOrigin(0.5)
            .setDepth(16);

        // ========================================================
        // PLAY CHEVRONS
        // ========================================================

        let leftChevron:
            Phaser.GameObjects.Text | null = null;

        let rightChevron:
            Phaser.GameObjects.Text | null = null;

        if (main) {

            leftChevron = this.add.text(
                x - 118,
                y,
                "»",
                {
                    fontFamily: "Arial Black",
                    fontSize: "29px",
                    color: "#ff00e6",
                    shadow: {
                        color: "#ff00e6",
                        blur: 15,
                        fill: true
                    }
                }
            );

            leftChevron
                .setOrigin(0.5)
                .setDepth(16);

            rightChevron = this.add.text(
                x + 118,
                y,
                "«",
                {
                    fontFamily: "Arial Black",
                    fontSize: "29px",
                    color: "#ff00e6",
                    shadow: {
                        color: "#ff00e6",
                        blur: 15,
                        fill: true
                    }
                }
            );

            rightChevron
                .setOrigin(0.5)
                .setDepth(16);

            // PLAY pulse
            this.tweens.add({
                targets: [
                    label,
                    leftChevron,
                    rightChevron
                ],
                alpha: {
                    from: 0.84,
                    to: 1
                },
                duration: 850,
                yoyo: true,
                repeat: -1,
                ease: "Sine.easeInOut"
            });

            // Glow pulse
            this.tweens.add({
                targets: [
                    outerGlow,
                    midGlow
                ],
                alpha: {
                    from: 0.55,
                    to: 1
                },
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: "Sine.easeInOut"
            });
        }

        // ========================================================
        // HIT AREA
        // ========================================================

        const hit = this.add.rectangle(
            x,
            y,
            width,
            height,
            0xffffff,
            0
        );

        hit
            .setDepth(30)
            .setInteractive({
                useHandCursor: true
            });

        // ========================================================
        // HOVER
        // ========================================================

        hit.on(
            "pointerover",
            () => {

                panel.clear();

                panel.fillStyle(
                    main
                        ? 0x160b1c
                        : 0x06202a,
                    0.96
                );

                this.drawCutRect(
                    panel,
                    x,
                    y,
                    width,
                    height,
                    cut
                );

                panel.lineStyle(
                    main ? 3 : 2,
                    this.WHITE,
                    1
                );

                this.drawCutRectStroke(
                    panel,
                    x,
                    y,
                    width,
                    height,
                    cut
                );

                this.tweens.add({
                    targets: [
                        label,
                        leftChevron,
                        rightChevron
                    ].filter(Boolean),
                    scale: 1.055,
                    duration: 120,
                    ease: "Quad.easeOut"
                });

                this.tweens.add({
                    targets: [
                        outerGlow,
                        midGlow
                    ],
                    scaleX: 1.035,
                    scaleY: 1.035,
                    alpha: 1,
                    duration: 130
                });
            }
        );

        // ========================================================
        // OUT
        // ========================================================

        hit.on(
            "pointerout",
            () => {

                panel.clear();

                panel.fillStyle(
                    this.PANEL_2,
                    0.91
                );

                this.drawCutRect(
                    panel,
                    x,
                    y,
                    width,
                    height,
                    cut
                );

                panel.lineStyle(
                    main ? 3 : 2,
                    primaryColor,
                    0.98
                );

                this.drawCutRectStroke(
                    panel,
                    x,
                    y,
                    width,
                    height,
                    cut
                );

                panel.lineStyle(
                    1,
                    secondaryColor,
                    0.28
                );

                this.drawCutRectStroke(
                    panel,
                    x,
                    y,
                    width - 9,
                    height - 9,
                    Math.max(5, cut - 5)
                );

                this.tweens.add({
                    targets: [
                        label,
                        leftChevron,
                        rightChevron
                    ].filter(Boolean),
                    scale: 1,
                    duration: 150
                });

                this.tweens.add({
                    targets: [
                        outerGlow,
                        midGlow
                    ],
                    scaleX: 1,
                    scaleY: 1,
                    duration: 150
                });
            }
        );

        // ========================================================
        // PRESS
        // ========================================================

        hit.on(
            "pointerdown",
            () => {

                AudioSystem.click();

                this.tweens.add({
                    targets: [
                        label,
                        leftChevron,
                        rightChevron
                    ].filter(Boolean),
                    scale: 0.92,
                    duration: 65,
                    yoyo: true,
                    ease: "Quad.easeOut",
                    onComplete: () => {
                        callback();
                    }
                });
            }
        );
    }

    // ============================================================
    // PANEL GRID
    // ============================================================

    private drawPanelGrid(
        x: number,
        y: number,
        width: number,
        height: number
    ) {

        const grid = this.add.graphics();

        grid.setDepth(9);

        grid.lineStyle(
            1,
            this.CYAN,
            0.045
        );

        // Vertical
        for (
            let gx = x - width / 2 + 30;
            gx < x + width / 2;
            gx += 28
        ) {

            grid.beginPath();

            grid.moveTo(
                gx,
                y - height / 2 + 10
            );

            grid.lineTo(
                gx,
                y + height / 2 - 10
            );

            grid.strokePath();
        }

        // Horizontal
        for (
            let gy = y - height / 2 + 15;
            gy < y + height / 2;
            gy += 15
        ) {

            grid.beginPath();

            grid.moveTo(
                x - width / 2 + 15,
                gy
            );

            grid.lineTo(
                x + width / 2 - 15,
                gy
            );

            grid.strokePath();
        }
    }

    // ============================================================
    // BUTTON BRACKETS
    // ============================================================

    private drawButtonBrackets(
        x: number,
        y: number,
        width: number,
        height: number,
        color: number,
        main: boolean
    ) {

        const g = this.add.graphics();

        g.setDepth(14);

        g.lineStyle(
            main ? 2 : 1,
            color,
            0.9
        );

        const side = width / 2;

        // Left upper
        g.beginPath();

        g.moveTo(
            x - side + 10,
            y - 16
        );

        g.lineTo(
            x - side + 10,
            y - 6
        );

        g.lineTo(
            x - side + 20,
            y - 6
        );

        g.strokePath();

        // Left lower
        g.beginPath();

        g.moveTo(
            x - side + 10,
            y + 16
        );

        g.lineTo(
            x - side + 10,
            y + 6
        );

        g.lineTo(
            x - side + 20,
            y + 6
        );

        g.strokePath();

        // Right upper
        g.beginPath();

        g.moveTo(
            x + side - 10,
            y - 16
        );

        g.lineTo(
            x + side - 10,
            y - 6
        );

        g.lineTo(
            x + side - 20,
            y - 6
        );

        g.strokePath();

        // Right lower
        g.beginPath();

        g.moveTo(
            x + side - 10,
            y + 16
        );

        g.lineTo(
            x + side - 10,
            y + 6
        );

        g.lineTo(
            x + side - 20,
            y + 6
        );

        g.strokePath();
    }

    // ============================================================
    // FOOTER
    // ============================================================

    private createFooter(
        x: number,
        y: number
    ) {

        const width = 205;
        const height = 48;

        const glow = this.add.graphics();

        glow.setDepth(4);

        glow.fillStyle(
            this.MAGENTA,
            0.06
        );

        this.drawCutRect(
            glow,
            x,
            y,
            width + 10,
            height + 10,
            10
        );

        const panel = this.add.graphics();

        panel.setDepth(7);

        panel.fillStyle(
            0x050912,
            0.82
        );

        this.drawCutRect(
            panel,
            x,
            y,
            width,
            height,
            9
        );

        panel.lineStyle(
            1,
            this.MAGENTA,
            0.65
        );

        this.drawCutRectStroke(
            panel,
            x,
            y,
            width,
            height,
            9
        );

        // Side lines
        this.drawHUDLine(
            x - width / 2 - 20,
            y,
            x - width / 2,
            y,
            this.MAGENTA,
            0.7,
            1
        );

        this.drawHUDLine(
            x + width / 2,
            y,
            x + width / 2 + 20,
            y,
            this.MAGENTA,
            0.7,
            1
        );

        this.add.text(
            x,
            y - 8,
            "CREATED BY",
            {
                fontFamily: "Arial",
                fontSize: "9px",
                color: "#8c8f9b"
            }
        )
        .setOrigin(0.5)
        .setDepth(14);

        this.add.text(
            x,
            y + 11,
            "MATIN AHMADI",
            {
                fontFamily: "Arial Black",
                fontSize: "16px",
                color: "#ffffff",
                shadow: {
                    color: "#ff00e6",
                    blur: 14,
                    fill: true
                }
            }
        )
        .setOrigin(0.5)
        .setDepth(14);
    }

    // ============================================================
    // TROPHY ICON
    // ============================================================

    private drawTrophyIcon(
        x: number,
        y: number
    ) {

        const g = this.add.graphics();

        g.setDepth(16);

        g.lineStyle(
            2,
            0xffd447,
            0.95
        );

        // Cup
        g.beginPath();

        g.moveTo(x - 6, y - 7);
        g.lineTo(x + 6, y - 7);
        g.lineTo(x + 4, y + 2);
        g.lineTo(x, y + 5);
        g.lineTo(x - 4, y + 2);
        g.closePath();

        g.strokePath();

        // Stem
        g.beginPath();

        g.moveTo(x, y + 5);
        g.lineTo(x, y + 10);

        g.strokePath();

        // Base
        g.beginPath();

        g.moveTo(x - 6, y + 10);
        g.lineTo(x + 6, y + 10);

        g.strokePath();

        // Handles
        g.beginPath();

        g.moveTo(x - 6, y - 4);
        g.lineTo(x - 10, y - 4);
        g.lineTo(x - 8, y + 2);
        g.lineTo(x - 4, y + 2);

        g.strokePath();

        g.beginPath();

        g.moveTo(x + 6, y - 4);
        g.lineTo(x + 10, y - 4);
        g.lineTo(x + 8, y + 2);
        g.lineTo(x + 4, y + 2);

        g.strokePath();
    }

    // ============================================================
    // CRYSTAL ICON
    // ============================================================

    private drawCrystalIcon(
        x: number,
        y: number
    ) {

        const g = this.add.graphics();

        g.setDepth(16);

        // Glow
        g.fillStyle(
            this.CYAN,
            0.08
        );

        g.fillCircle(
            x,
            y,
            14
        );

        // Diamond
        g.fillStyle(
            0x32e8ff,
            0.95
        );

        g.beginPath();

        g.moveTo(x, y - 10);
        g.lineTo(x + 8, y - 3);
        g.lineTo(x + 5, y + 8);
        g.lineTo(x, y + 12);
        g.lineTo(x - 5, y + 8);
        g.lineTo(x - 8, y - 3);
        g.closePath();

        g.fillPath();

        // Diamond outline
        g.lineStyle(
            1,
            this.WHITE,
            0.85
        );

        g.beginPath();

        g.moveTo(x, y - 10);
        g.lineTo(x + 8, y - 3);
        g.lineTo(x + 5, y + 8);
        g.lineTo(x, y + 12);
        g.lineTo(x - 5, y + 8);
        g.lineTo(x - 8, y - 3);
        g.closePath();

        g.strokePath();

        // Internal facets
        g.lineStyle(
            1,
            0xffffff,
            0.45
        );

        g.beginPath();

        g.moveTo(x - 8, y - 3);
        g.lineTo(x + 8, y - 3);

        g.moveTo(x, y - 10);
        g.lineTo(x - 1, y + 11);

        g.moveTo(x, y - 10);
        g.lineTo(x + 5, y + 8);

        g.strokePath();
    }

    // ============================================================
    // GARAGE ICON
    // ============================================================

    private drawGarageIcon(
        x: number,
        y: number,
        color: number
    ) {

        const g = this.add.graphics();

        g.setDepth(16);

        g.lineStyle(
            2,
            color,
            0.95
        );

        // Building
        g.beginPath();

        g.moveTo(x - 10, y - 4);
        g.lineTo(x, y - 12);
        g.lineTo(x + 10, y - 4);
        g.lineTo(x + 10, y + 11);
        g.lineTo(x - 10, y + 11);
        g.closePath();

        g.strokePath();

        // Garage door
        g.strokeRect(
            x - 6,
            y - 1,
            12,
            9
        );

        // Car silhouette
        g.beginPath();

        g.moveTo(x - 5, y + 6);
        g.lineTo(x - 3, y + 3);
        g.lineTo(x + 3, y + 3);
        g.lineTo(x + 5, y + 6);

        g.strokePath();
    }

    // ============================================================
    // GEAR ICON
    // ============================================================

    private drawGearIcon(
        x: number,
        y: number,
        color: number
    ) {

        const g = this.add.graphics();

        g.setDepth(16);

        g.lineStyle(
            2,
            color,
            0.95
        );

        // Main ring
        g.strokeCircle(
            x,
            y,
            8
        );

        g.strokeCircle(
            x,
            y,
            3
        );

        // Gear teeth
        for (
            let i = 0;
            i < 8;
            i++
        ) {

            const a =
                (Math.PI * 2 / 8) * i;

            const x1 =
                x +
                Math.cos(a) * 9;

            const y1 =
                y +
                Math.sin(a) * 9;

            const x2 =
                x +
                Math.cos(a) * 12;

            const y2 =
                y +
                Math.sin(a) * 12;

            g.beginPath();

            g.moveTo(x1, y1);
            g.lineTo(x2, y2);

            g.strokePath();
        }
    }

    // ============================================================
    // EXIT ICON
    // ============================================================

    private drawExitIcon(
        x: number,
        y: number,
        color: number
    ) {

        const g = this.add.graphics();

        g.setDepth(16);

        g.lineStyle(
            2,
            color,
            0.95
        );

        // Door
        g.strokeRect(
            x - 9,
            y - 11,
            9,
            22
        );

        // Arrow
        g.beginPath();

        g.moveTo(
            x - 2,
            y
        );

        g.lineTo(
            x + 10,
            y
        );

        g.lineTo(
            x + 6,
            y - 4
        );

        g.moveTo(
            x + 10,
            y
        );

        g.lineTo(
            x + 6,
            y + 4
        );

        g.strokePath();
    }

    // ============================================================
    // SMALL BRACKETS
    // ============================================================

    private drawSmallBrackets(
        x: number,
        y: number,
        color: number
    ) {

        const g = this.add.graphics();

        g.setDepth(15);

        g.lineStyle(
            1,
            color,
            0.75
        );

        g.beginPath();

        g.moveTo(x - 4, y - 9);
        g.lineTo(x, y - 9);
        g.lineTo(x, y + 9);
        g.lineTo(x - 4, y + 9);

        g.strokePath();

        g.beginPath();

        g.moveTo(x + 4, y - 9);
        g.lineTo(x, y - 9);
        g.lineTo(x, y + 9);
        g.lineTo(x + 4, y + 9);

        g.strokePath();
    }

    // ============================================================
    // HUD LINE
    // ============================================================

    private drawHUDLine(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        color: number,
        alpha: number,
        thickness: number
    ) {

        const g = this.add.graphics();

        g.setDepth(14);

        g.lineStyle(
            thickness,
            color,
            alpha
        );

        g.beginPath();

        g.moveTo(x1, y1);
        g.lineTo(x2, y2);

        g.strokePath();

        return g;
    }

    // ============================================================
    // CUT CORNER FILL
    // ============================================================

    private drawCutRect(
        g: Phaser.GameObjects.Graphics,
        x: number,
        y: number,
        width: number,
        height: number,
        cut: number
    ) {

        const left =
            x - width / 2;

        const right =
            x + width / 2;

        const top =
            y - height / 2;

        const bottom =
            y + height / 2;

        g.beginPath();

        g.moveTo(
            left + cut,
            top
        );

        g.lineTo(
            right - cut,
            top
        );

        g.lineTo(
            right,
            top + cut
        );

        g.lineTo(
            right,
            bottom - cut
        );

        g.lineTo(
            right - cut,
            bottom
        );

        g.lineTo(
            left + cut,
            bottom
        );

        g.lineTo(
            left,
            bottom - cut
        );

        g.lineTo(
            left,
            top + cut
        );

        g.lineTo(
            left + cut,
            top
        );

        g.closePath();

        g.fillPath();
    }

    // ============================================================
    // CUT CORNER STROKE
    // ============================================================

    private drawCutRectStroke(
        g: Phaser.GameObjects.Graphics,
        x: number,
        y: number,
        width: number,
        height: number,
        cut: number
    ) {

        const left =
            x - width / 2;

        const right =
            x + width / 2;

        const top =
            y - height / 2;

        const bottom =
            y + height / 2;

        g.beginPath();

        g.moveTo(
            left + cut,
            top
        );

        g.lineTo(
            right - cut,
            top
        );

        g.lineTo(
            right,
            top + cut
        );

        g.lineTo(
            right,
            bottom - cut
        );

        g.lineTo(
            right - cut,
            bottom
        );

        g.lineTo(
            left + cut,
            bottom
        );

        g.lineTo(
            left,
            bottom - cut
        );

        g.lineTo(
            left,
            top + cut
        );

        g.lineTo(
            left + cut,
            top
        );

        g.strokePath();
    }

    // ============================================================
    // BACKGROUND HUD
    // ============================================================

    private createCityHUD() {

        const W = this.W;
        const H = this.H;

        // Left vertical cyber line
        const left = this.add.graphics();

        left.setDepth(3);

        left.lineStyle(
            1,
            this.CYAN,
            0.18
        );

        left.beginPath();

        left.moveTo(14, 170);
        left.lineTo(14, H - 100);

        left.strokePath();

        // Right vertical line
        const right = this.add.graphics();

        right.setDepth(3);

        right.lineStyle(
            1,
            this.MAGENTA,
            0.16
        );

        right.beginPath();

        right.moveTo(W - 14, 170);
        right.lineTo(W - 14, H - 100);

        right.strokePath();

        // Side technical ticks
        for (
            let i = 0;
            i < 10;
            i++
        ) {

            const yy =
                190 + i * 55;

            this.drawHUDLine(
                14,
                yy,
                22,
                yy,
                this.CYAN,
                0.30,
                1
            );

            this.drawHUDLine(
                W - 22,
                yy,
                W - 14,
                yy,
                this.MAGENTA,
                0.25,
                1
            );
        }

        // Small central perspective lines
        const perspective = this.add.graphics();

        perspective.setDepth(3);

        perspective.lineStyle(
            1,
            this.CYAN,
            0.09
        );

        perspective.beginPath();

        perspective.moveTo(
            W / 2,
            H * 0.54
        );

        perspective.lineTo(
            30,
            H
        );

        perspective.moveTo(
            W / 2,
            H * 0.54
        );

        perspective.lineTo(
            W - 30,
            H
        );

        perspective.strokePath();
    }

    // ============================================================
    // SCANLINES
    // ============================================================

    private createScanlines() {

        const W = this.W;
        const H = this.H;

        for (
            let y = 0;
            y < H;
            y += 7
        ) {

            const line = this.add.rectangle(
                W / 2,
                y,
                W,
                1,
                0x00ffff,
                0.018
            );

            line.setDepth(3);
        }

        // Moving scanner
        const scanner = this.add.rectangle(
            W / 2,
            -10,
            W,
            1,
            this.CYAN,
            0.10
        );

        scanner.setDepth(5);

        this.tweens.add({
            targets: scanner,
            y: H + 10,
            duration: 5200,
            repeat: -1,
            ease: "Linear"
        });
    }

    // ============================================================
    // PARTICLES
    // ============================================================

    private createParticles() {

        const W = this.W;
        const H = this.H;

        for (
            let i = 0;
            i < 30;
            i++
        ) {

            const p = this.add.rectangle(
                Phaser.Math.Between(
                    5,
                    W - 5
                ),
                Phaser.Math.Between(
                    0,
                    H
                ),
                Phaser.Math.Between(
                    1,
                    2
                ),
                Phaser.Math.Between(
                    2,
                    8
                ),
                Math.random() > 0.5
                    ? this.CYAN
                    : this.MAGENTA,
                Phaser.Math.FloatBetween(
                    0.12,
                    0.38
                )
            );

            p.setDepth(4);

            this.tweens.add({
                targets: p,
                y: p.y +
                    Phaser.Math.Between(
                        25,
                        100
                    ),
                alpha: 0,
                duration: Phaser.Math.Between(
                    1200,
                    3200
                ),
                delay: Phaser.Math.Between(
                    0,
                    1500
                ),
                repeat: -1,
                yoyo: true,
                ease: "Sine.easeInOut"
            });
        }

        // Horizontal glitch fragments
        for (
            let i = 0;
            i < 12;
            i++
        ) {

            const fragment = this.add.rectangle(
                Phaser.Math.Between(
                    15,
                    W - 15
                ),
                Phaser.Math.Between(
                    170,
                    H - 80
                ),
                Phaser.Math.Between(
                    8,
                    35
                ),
                1,
                Math.random() > 0.5
                    ? this.CYAN
                    : this.MAGENTA,
                0.18
            );

            fragment.setDepth(4);

            this.tweens.add({
                targets: fragment,
                x: fragment.x +
                    Phaser.Math.Between(
                        -20,
                        20
                    ),
                alpha: 0,
                duration: Phaser.Math.Between(
                    700,
                    1800
                ),
                repeat: -1,
                yoyo: true
            });
        }
    }

    // ============================================================
    // UPDATE
    // ============================================================

    update() {

        if (!this.title) {
            return;
        }

        this.title.setScale(
            1 +
            Math.sin(
                this.time.now / 520
            ) * 0.016
        );
    }
}