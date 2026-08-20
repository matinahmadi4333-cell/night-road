import Phaser from "phaser";
import AudioSystem from "../systems/AudioSystem";

// ============================================================
// NOVA OVERDRIVE
// PREMIUM CYBERPUNK GAME HUD
// 400 x 800 MOBILE PORTRAIT
//
// FINAL VERSION
// ------------------------------------------------------------
// • ONE Nitro Bar
// • Full Nitro mobile touch area
// • Nitro NEVER activates automatically from HUD
// • HUD emits: "hud-nitro-pressed"
// • 5 Dynamic Zones
// • LEVEL displayed separately from ZONE
// • Crystal counter stays inside frame
// • Velocity layout fixed
// • Premium Pause button
// • Armor separated from Pause
// • Crystal pickup FX
// • Nitro FX
// • Damage FX
// • Combo HUD
// • Mobile friendly
// ============================================================

export default class GameHUD {

    // ============================================================
    // SCENE
    // ============================================================

    private scene: Phaser.Scene;

    // ============================================================
    // ROOT
    // ============================================================

    private root!: Phaser.GameObjects.Container;

    // ============================================================
    // PUBLIC REFERENCES
    // ============================================================

    scoreText!: Phaser.GameObjects.Text;
    crystalText!: Phaser.GameObjects.Text;
    speedText!: Phaser.GameObjects.Text;
    nitroText!: Phaser.GameObjects.Text;
    healthText!: Phaser.GameObjects.Text;
    levelText!: Phaser.GameObjects.Text;
    comboText!: Phaser.GameObjects.Text;

    pauseButton!: Phaser.GameObjects.Container;

    // ============================================================
    // DEPTH
    // ============================================================

    private readonly DEPTH = 300;

    // ============================================================
    // COLORS
    // ============================================================

    private readonly CYAN = 0x00F6FF;
    private readonly CYAN_DARK = 0x007C88;
    private readonly BLUE = 0x1677FF;
    private readonly PURPLE = 0x8B4DFF;
    private readonly WHITE = 0xFFFFFF;
    private readonly RED = 0xFF315C;
    private readonly ORANGE = 0xFF8A3D;
    private readonly GREEN = 0x00FFB3;
    private readonly DARK = 0x02070C;
    private readonly PANEL = 0x06131A;
    private readonly GRID = 0x17343D;

    // ============================================================
    // 5 ZONES
    // ============================================================

    private readonly ZONES = [
        {
            name: "NEON DISTRICT",
            sector: "SECTOR // NEON",
            color: 0x00F6FF
        },
        {
            name: "CYBER CORE",
            sector: "SECTOR // CORE",
            color: 0x8B4DFF
        },
        {
            name: "NIGHT MARKET",
            sector: "SECTOR // MARKET",
            color: 0xFF315C
        },
        {
            name: "INDUSTRIAL GRID",
            sector: "SECTOR // GRID",
            color: 0xFF8A3D
        },
        {
            name: "VOID SECTOR",
            sector: "SECTOR // VOID",
            color: 0x1677FF
        }
    ];

    // ============================================================
    // TOP
    // ============================================================

    private topGlow!: Phaser.GameObjects.Graphics;
    private topFrame!: Phaser.GameObjects.Graphics;
    private topLines!: Phaser.GameObjects.Graphics;

    private scoreLabel!: Phaser.GameObjects.Text;

    private zoneLabel!: Phaser.GameObjects.Text;
    private levelLabel!: Phaser.GameObjects.Text;
    private sectorLabel!: Phaser.GameObjects.Text;

    private crystalLabel!: Phaser.GameObjects.Text;
    private crystalIcon!: Phaser.GameObjects.Graphics;

    // ============================================================
    // SPEED
    // ============================================================

    private speedFrame!: Phaser.GameObjects.Graphics;
    private speedGlow!: Phaser.GameObjects.Graphics;
    private speedMeterBack!: Phaser.GameObjects.Graphics;
    private speedMeter!: Phaser.GameObjects.Graphics;
    private speedNeedle!: Phaser.GameObjects.Graphics;

    private speedLabel!: Phaser.GameObjects.Text;
    private speedUnit!: Phaser.GameObjects.Text;

    // ============================================================
    // ARMOR
    // ============================================================

    private armorFrame!: Phaser.GameObjects.Graphics;
    private armorLabel!: Phaser.GameObjects.Text;
    private armorSegments: Phaser.GameObjects.Graphics[] = [];

    private armorWarning!: Phaser.GameObjects.Graphics;

    // ============================================================
    // COMBO
    // ============================================================

    private comboFrame!: Phaser.GameObjects.Graphics;
    private comboLabel!: Phaser.GameObjects.Text;
    private comboValue!: Phaser.GameObjects.Text;
    private comboBarBack!: Phaser.GameObjects.Graphics;
    private comboBar!: Phaser.GameObjects.Graphics;

    // ============================================================
    // NITRO
    // ============================================================

    private nitroBar!: Phaser.GameObjects.Container;

    private nitroBarGlow!: Phaser.GameObjects.Graphics;
    private nitroBarOuter!: Phaser.GameObjects.Graphics;
    private nitroBarInner!: Phaser.GameObjects.Graphics;
    private nitroBarBack!: Phaser.GameObjects.Graphics;
    private nitroBarFill!: Phaser.GameObjects.Graphics;
    private nitroBarHighlight!: Phaser.GameObjects.Graphics;
    private nitroBarEnergy!: Phaser.GameObjects.Graphics;
    private nitroBarTicks!: Phaser.GameObjects.Graphics;

    private nitroBarText!: Phaser.GameObjects.Text;
    private nitroBarState!: Phaser.GameObjects.Text;

    private nitroTouchZone!: Phaser.GameObjects.Rectangle;

    private nitroPressed = false;

    // ============================================================
    // AMBIENT
    // ============================================================

    private ambient!: Phaser.GameObjects.Graphics;
    private scan!: Phaser.GameObjects.Graphics;
    private particles!: Phaser.GameObjects.Graphics;

    // ============================================================
    // EFFECTS
    // ============================================================

    private flash!: Phaser.GameObjects.Rectangle;

    private pulseTimer = 0;
    private nitroTimer = 0;

    // ============================================================
    // STATE
    // ============================================================

    private lastScore = 0;
    private lastCrystals = 0;
    private lastCombo = 0;
    private lastHealth = 3;
    private lastNitro = false;
    private lastZoneIndex = -1;

    private destroyed = false;

    // ============================================================
    // SIZE
    // ============================================================

    private readonly W = 400;
    private readonly H = 800;

    // ============================================================
    // NITRO POSITION
    // ============================================================

    private readonly NITRO_X = 200;
    private readonly NITRO_Y = 718;

    // ============================================================
    // CONSTRUCTOR
    // ============================================================

    constructor(scene: Phaser.Scene) {

        this.scene = scene;

        this.create();
    }

    // ============================================================
    // CREATE
    // ============================================================

    private create(): void {

        this.root =
            this.scene.add.container(
                0,
                0
            );

        this.root.setDepth(
            this.DEPTH
        );

        this.createAmbient();

        this.createTopHUD();

        this.createSpeedHUD();

        this.createArmorHUD();

        this.createComboHUD();

        this.createNitroBar();

        this.createDamageFlash();

        this.createPauseButton();
    }

    // ============================================================
    // AMBIENT
    // ============================================================

    private createAmbient(): void {

        this.ambient =
            this.scene.add.graphics();

        this.ambient.setDepth(
            this.DEPTH - 20
        );

        this.ambient.lineStyle(
            1,
            this.CYAN,
            0.045
        );

        this.ambient.lineBetween(
            9,
            88,
            9,
            748
        );

        this.ambient.lineBetween(
            391,
            88,
            391,
            748
        );

        this.ambient.lineStyle(
            1,
            this.PURPLE,
            0.025
        );

        this.ambient.lineBetween(
            18,
            170,
            18,
            680
        );

        this.ambient.lineBetween(
            382,
            170,
            382,
            680
        );

        for (
            let y = 130;
            y < 700;
            y += 70
        ) {

            this.ambient.fillStyle(
                this.CYAN,
                0.25
            );

            this.ambient.fillRect(
                6,
                y,
                3,
                1
            );

            this.ambient.fillRect(
                391,
                y,
                3,
                1
            );
        }

        this.root.add(
            this.ambient
        );

        // ========================================================
        // SCAN
        // ========================================================

        this.scan =
            this.scene.add.graphics();

        this.scan.setDepth(
            this.DEPTH - 10
        );

        this.scan.lineStyle(
            1,
            this.CYAN,
            0.05
        );

        this.scan.lineBetween(
            20,
            90,
            380,
            90
        );

        this.root.add(
            this.scan
        );

        this.scene.tweens.add({

            targets:
                this.scan,

            y:
                610,

            alpha:
                0,

            duration:
                3800,

            repeat:
                -1,

            yoyo:
                true,

            ease:
                "Sine.easeInOut"
        });

        // ========================================================
        // PARTICLES
        // ========================================================

        this.particles =
            this.scene.add.graphics();

        this.particles.setDepth(
            this.DEPTH - 5
        );

        this.root.add(
            this.particles
        );
    }

    // ============================================================
    // TOP HUD
    // ============================================================

    private createTopHUD(): void {

        // ========================================================
        // GLOW
        // ========================================================

        this.topGlow =
            this.scene.add.graphics();

        this.drawTopFrame(
            this.topGlow,
            true
        );

        this.root.add(
            this.topGlow
        );

        // ========================================================
        // FRAME
        // ========================================================

        this.topFrame =
            this.scene.add.graphics();

        this.drawTopFrame(
            this.topFrame,
            false
        );

        this.root.add(
            this.topFrame
        );

        // ========================================================
        // SCORE
        // ========================================================

        this.scoreLabel =
            this.createText(
                22,
                14,
                "SCORE",
                "#6C8994",
                "8px"
            );

        this.scoreLabel.setLetterSpacing(
            2
        );

        this.scoreText =
            this.createText(
                22,
                27,
                "000000",
                "#FFFFFF",
                "26px"
            );

        this.scoreText.setLetterSpacing(
            1
        );

        // ========================================================
        // ZONE NAME
        // ========================================================

        this.zoneLabel =
            this.createText(
                200,
                12,
                "NEON DISTRICT",
                "#00F6FF",
                "10px"
            );

        this.zoneLabel.setOrigin(
            0.5
        );

        this.zoneLabel.setLetterSpacing(
            1.5
        );

        // ========================================================
        // LEVEL
        // ========================================================

        this.levelLabel =
            this.createText(
                200,
                29,
                "LEVEL 01",
                "#FFFFFF",
                "13px"
            );

        this.levelLabel.setOrigin(
            0.5
        );

        this.levelLabel.setLetterSpacing(
            2
        );

        // PUBLIC REFERENCE

        this.levelText =
            this.levelLabel;

        // ========================================================
        // SECTOR
        // ========================================================

        this.sectorLabel =
            this.createText(
                200,
                47,
                "SECTOR // NEON",
                "#66818B",
                "6px"
            );

        this.sectorLabel.setOrigin(
            0.5
        );

        this.sectorLabel.setLetterSpacing(
            1.4
        );

        // ========================================================
        // CRYSTAL ICON
        // ========================================================

        this.crystalIcon =
            this.scene.add.graphics();

        this.drawCrystalIcon(
            326,
            30,
            6
        );

        this.root.add(
            this.crystalIcon
        );

        // ========================================================
        // CRYSTAL NUMBER
        // ========================================================

        this.crystalText =
            this.createText(
                377,
                14,
                "0",
                "#FFFFFF",
                "20px"
            );

        this.crystalText.setOrigin(
            1,
            0
        );

        this.crystalLabel =
            this.createText(
                377,
                42,
                "CRYSTALS",
                "#00F6FF",
                "6px"
            );

        this.crystalLabel.setOrigin(
            1,
            0
        );

        this.crystalLabel.setLetterSpacing(
            1.2
        );

        // ========================================================
        // DIVIDERS
        // ========================================================

        this.topLines =
            this.scene.add.graphics();

        this.topLines.lineStyle(
            1,
            this.CYAN,
            0.15
        );

        this.topLines.lineBetween(
            20,
            59,
            118,
            59
        );

        this.topLines.lineBetween(
            282,
            59,
            380,
            59
        );

        this.root.add(
            this.topLines
        );
    }

    // ============================================================
    // TOP FRAME
    // ============================================================

    private drawTopFrame(
        g: Phaser.GameObjects.Graphics,
        glow: boolean
    ): void {

        g.clear();

        // SCORE

        g.lineStyle(
            glow ? 5 : 1,
            this.CYAN,
            glow ? 0.035 : 0.25
        );

        g.beginPath();

        g.moveTo(14, 8);
        g.lineTo(118, 8);
        g.lineTo(125, 14);
        g.lineTo(125, 64);
        g.lineTo(14, 64);

        g.closePath();

        g.strokePath();

        // CENTER

        g.lineStyle(
            glow ? 5 : 1,
            this.PURPLE,
            glow ? 0.03 : 0.2
        );

        g.beginPath();

        g.moveTo(143, 8);
        g.lineTo(257, 8);
        g.lineTo(263, 14);
        g.lineTo(263, 64);
        g.lineTo(137, 64);
        g.lineTo(137, 14);

        g.closePath();

        g.strokePath();

        // CRYSTALS

        g.lineStyle(
            glow ? 5 : 1,
            this.CYAN,
            glow ? 0.03 : 0.2
        );

        g.beginPath();

        g.moveTo(275, 8);
        g.lineTo(386, 8);
        g.lineTo(386, 64);
        g.lineTo(275, 64);

        g.closePath();

        g.strokePath();
    }

    // ============================================================
    // SPEED HUD
    // ============================================================

    private createSpeedHUD(): void {

        this.speedGlow =
            this.scene.add.graphics();

        this.drawSpeedPanel(
            this.speedGlow,
            true
        );

        this.root.add(
            this.speedGlow
        );

        this.speedFrame =
            this.scene.add.graphics();

        this.drawSpeedPanel(
            this.speedFrame,
            false
        );

        this.root.add(
            this.speedFrame
        );

        // ========================================================
        // VELOCITY LABEL
        // ========================================================

        this.speedLabel =
            this.createText(
                27,
                88,
                "VELOCITY",
                "#00F6FF",
                "7px"
            );

        this.speedLabel.setLetterSpacing(
            1.5
        );

        // ========================================================
        // SPEED NUMBER
        //
        // FIXED:
        // smaller and lower so it cannot overlap VELOCITY
        // ========================================================

        this.speedText =
            this.createText(
                26,
                103,
                "000",
                "#FFFFFF",
                "29px"
            );

        this.speedText.setLetterSpacing(
            1
        );

        // ========================================================
        // UNIT
        // ========================================================

        this.speedUnit =
            this.createText(
                28,
                139,
                "KM/H",
                "#66818B",
                "6px"
            );

        this.speedUnit.setLetterSpacing(
                1.8
        );

        // ========================================================
        // METER BACK
        // ========================================================

        this.speedMeterBack =
            this.scene.add.graphics();

        this.speedMeterBack.lineStyle(
            2,
            0x263B44,
            0.8
        );

        this.speedMeterBack.lineBetween(
            29,
            161,
            121,
            161
        );

        this.root.add(
            this.speedMeterBack
        );

        this.speedMeter =
            this.scene.add.graphics();

        this.root.add(
            this.speedMeter
        );

        this.speedNeedle =
            this.scene.add.graphics();

        this.root.add(
            this.speedNeedle
        );
    }

    // ============================================================
    // SPEED PANEL
    // ============================================================

    private drawSpeedPanel(
        g: Phaser.GameObjects.Graphics,
        glow: boolean
    ): void {

        g.clear();

        g.lineStyle(
            glow ? 5 : 1,
            this.CYAN,
            glow ? 0.035 : 0.35
        );

        if (!glow) {

            g.fillStyle(
                this.DARK,
                0.58
            );
        }

        g.beginPath();

        g.moveTo(17, 82);
        g.lineTo(110, 82);
        g.lineTo(126, 96);
        g.lineTo(126, 156);
        g.lineTo(114, 170);
        g.lineTo(17, 170);

        g.closePath();

        if (!glow) {
            g.fillPath();
        }

        g.strokePath();

        if (!glow) {

            g.lineStyle(
                1,
                this.PURPLE,
                0.3
            );

            g.lineBetween(
                22,
                88,
                22,
                164
            );
        }
    }

    // ============================================================
    // SPEED METER
    // ============================================================

    private updateSpeedMeter(
        speed: number
    ): void {

        const amount =
            Phaser.Math.Clamp(
                speed / 650,
                0,
                1
            );

        this.speedMeter.clear();

        this.speedMeter.lineStyle(
            4,
            this.CYAN,
            0.9
        );

        this.speedMeter.lineBetween(
            29,
            161,
            29 + 92 * amount,
            161
        );

        this.speedMeter.fillStyle(
            this.WHITE,
            0.9
        );

        this.speedMeter.fillCircle(
            29 + 92 * amount,
            161,
            2
        );

        this.speedMeter.lineStyle(
            1,
            this.CYAN,
            0.18
        );

        for (
            let i = 0;
            i <= 8;
            i++
        ) {

            const x =
                29 +
                i * 11.5;

            this.speedMeter.lineBetween(
                x,
                156,
                x,
                166
            );
        }

        this.speedNeedle.clear();

        this.speedNeedle.lineStyle(
            1,
            this.WHITE,
            0.75
        );

        this.speedNeedle.lineBetween(
            29 + 92 * amount,
            156,
            29 + 92 * amount,
            166
        );
    }

    // ============================================================
    // ARMOR
    // ============================================================

    private createArmorHUD(): void {

        this.armorFrame =
            this.scene.add.graphics();

        this.drawArmorFrame();

        this.root.add(
            this.armorFrame
        );

        this.armorLabel =
            this.createText(
                282,
                88,
                "ARMOR",
                "#6C8994",
                "8px"
            );

        this.armorLabel.setLetterSpacing(
            2
        );

        this.armorWarning =
            this.scene.add.graphics();

        this.root.add(
            this.armorWarning
        );

        this.armorSegments = [];

        for (
            let i = 0;
            i < 4;
            i++
        ) {

            const segment =
                this.scene.add.graphics();

            this.armorSegments.push(
                segment
            );

            this.root.add(
                segment
            );
        }

        this.drawArmor(
            3
        );
    }

    // ============================================================
    // ARMOR FRAME
    // ============================================================

    private drawArmorFrame(): void {

        this.armorFrame.clear();

        this.armorFrame.lineStyle(
            1,
            this.CYAN,
            0.25
        );

        this.armorFrame.beginPath();

        this.armorFrame.moveTo(278, 82);
        this.armorFrame.lineTo(384, 82);
        this.armorFrame.lineTo(384, 129);
        this.armorFrame.lineTo(278, 129);

        this.armorFrame.closePath();

        this.armorFrame.strokePath();

        this.armorFrame.lineStyle(
            1,
            this.PURPLE,
            0.25
        );

        this.armorFrame.lineBetween(
            280,
            126,
            378,
            126
        );
    }

    // ============================================================
    // DRAW ARMOR
    // ============================================================

    private drawArmor(
        health: number
    ): void {

        const amount =
            Phaser.Math.Clamp(
                Math.floor(health),
                0,
                4
            );

        for (
            let i = 0;
            i < 4;
            i++
        ) {

            const g =
                this.armorSegments[i];

            g.clear();

            const x =
                282 +
                i * 24;

            const active =
                i < amount;

            g.fillStyle(
                active
                    ? this.CYAN
                    : 0x18262D,
                active
                    ? 0.88
                    : 0.7
            );

            g.lineStyle(
                1,
                active
                    ? this.CYAN
                    : 0x455760,
                active
                    ? 0.9
                    : 0.4
            );

            g.beginPath();

            g.moveTo(
                x,
                106
            );

            g.lineTo(
                x + 17,
                106
            );

            g.lineTo(
                x + 21,
                111
            );

            g.lineTo(
                x + 17,
                121
            );

            g.lineTo(
                x - 3,
                121
            );

            g.closePath();

            g.fillPath();

            g.strokePath();

            if (active) {

                g.lineStyle(
                    1,
                    this.WHITE,
                    0.35
                );

                g.lineBetween(
                    x + 2,
                    109,
                    x + 15,
                    109
                );
            }
        }
    }

    // ============================================================
    // COMBO
    // ============================================================

    private createComboHUD(): void {

        this.comboFrame =
            this.scene.add.graphics();

        this.root.add(
            this.comboFrame
        );

        this.comboLabel =
            this.createText(
                22,
                592,
                "COMBO",
                "#8B4DFF",
                "8px"
            );

        this.comboLabel.setLetterSpacing(
            2
        );

        this.comboValue =
            this.createText(
                22,
                605,
                "x1",
                "#FFFFFF",
                "28px"
            );

        this.comboBarBack =
            this.scene.add.graphics();

        this.root.add(
            this.comboBarBack
        );

        this.comboBar =
            this.scene.add.graphics();

        this.root.add(
            this.comboBar
        );

        this.comboFrame.setVisible(false);
        this.comboLabel.setVisible(false);
        this.comboValue.setVisible(false);
        this.comboBarBack.setVisible(false);
        this.comboBar.setVisible(false);
    }

    // ============================================================
    // SHOW COMBO
    // ============================================================

    private showCombo(
        combo: number
    ): void {

        const visible =
            combo > 1;

        this.comboFrame.setVisible(
            visible
        );

        this.comboLabel.setVisible(
            visible
        );

        this.comboValue.setVisible(
            visible
        );

        this.comboBarBack.setVisible(
            visible
        );

        this.comboBar.setVisible(
            visible
        );

        if (!visible) {
            return;
        }

        this.comboFrame.clear();

        this.comboFrame.lineStyle(
            1,
            this.PURPLE,
            0.65
        );

        this.comboFrame.beginPath();

        this.comboFrame.moveTo(16, 584);
        this.comboFrame.lineTo(105, 584);
        this.comboFrame.lineTo(116, 595);
        this.comboFrame.lineTo(116, 640);
        this.comboFrame.lineTo(105, 651);
        this.comboFrame.lineTo(16, 651);

        this.comboFrame.closePath();

        this.comboFrame.strokePath();

        this.comboValue.setText(
            `x${combo}`
        );

        this.comboBarBack.clear();

        this.comboBarBack.lineStyle(
            2,
            0x2A3941,
            0.8
        );

        this.comboBarBack.lineBetween(
            22,
            643,
            106,
            643
        );

        this.comboBar.clear();

        const amount =
            Phaser.Math.Clamp(
                combo / 20,
                0,
                1
            );

        this.comboBar.lineStyle(
            3,
            this.PURPLE,
            0.95
        );

        this.comboBar.lineBetween(
            22,
            643,
            22 + amount * 84,
            643
        );

        if (
            combo !==
            this.lastCombo
        ) {

            this.comboValue.setScale(
                1.25
            );

            this.scene.tweens.add({

                targets:
                    this.comboValue,

                scale:
                    1,

                duration:
                    180,

                ease:
                    "Back.out"
            });
        }
    }

    // ============================================================
    // NITRO BAR
    // ============================================================

    private createNitroBar(): void {

        this.nitroBar =
            this.scene.add.container(
                this.NITRO_X,
                this.NITRO_Y
            );

        this.nitroBar.setDepth(
            this.DEPTH + 40
        );

        // ========================================================
        // GLOW
        // ========================================================

        this.nitroBarGlow =
            this.scene.add.graphics();

        this.nitroBarGlow.lineStyle(
            8,
            this.CYAN,
            0.045
        );

        this.nitroBarGlow.strokeRoundedRect(
            -88,
            -20,
            176,
            40,
            10
        );

        this.nitroBar.add(
            this.nitroBarGlow
        );

        // ========================================================
        // OUTER
        // ========================================================

        this.nitroBarOuter =
            this.scene.add.graphics();

        this.nitroBarOuter.lineStyle(
            1.5,
            this.CYAN,
            0.85
        );

        this.nitroBarOuter.fillStyle(
            this.DARK,
            0.94
        );

        this.nitroBarOuter.fillRoundedRect(
            -82,
            -15,
            164,
            30,
            7
        );

        this.nitroBarOuter.strokeRoundedRect(
            -82,
            -15,
            164,
            30,
            7
        );

        this.nitroBar.add(
            this.nitroBarOuter
        );

        // ========================================================
        // INNER
        // ========================================================

        this.nitroBarInner =
            this.scene.add.graphics();

        this.nitroBarInner.lineStyle(
            1,
            this.PURPLE,
            0.45
        );

        this.nitroBarInner.strokeRoundedRect(
            -77,
            -10,
            154,
            20,
            4
        );

        this.nitroBar.add(
            this.nitroBarInner
        );

        // ========================================================
        // BACK
        // ========================================================

        this.nitroBarBack =
            this.scene.add.graphics();

        this.nitroBarBack.fillStyle(
            0x08141B,
            0.95
        );

        this.nitroBarBack.fillRoundedRect(
            -73,
            -7,
            146,
            14,
            3
        );

        this.nitroBar.add(
            this.nitroBarBack
        );

        // ========================================================
        // FILL
        // ========================================================

        this.nitroBarFill =
            this.scene.add.graphics();

        this.nitroBar.add(
            this.nitroBarFill
        );

        // ========================================================
        // HIGHLIGHT
        // ========================================================

        this.nitroBarHighlight =
            this.scene.add.graphics();

        this.nitroBar.add(
            this.nitroBarHighlight
        );

        // ========================================================
        // ENERGY
        // ========================================================

        this.nitroBarEnergy =
            this.scene.add.graphics();

        this.nitroBar.add(
            this.nitroBarEnergy
        );

        // ========================================================
        // TICKS
        // ========================================================

        this.nitroBarTicks =
            this.scene.add.graphics();

        this.nitroBar.add(
            this.nitroBarTicks
        );

        this.drawNitroBar(
            false,
            false
        );

        // ========================================================
        // NITRO LABEL
        // ========================================================

        this.nitroBarText =
            this.createText(
                0,
                -27,
                "NITRO",
                "#00F6FF",
                "8px"
            );

        this.nitroBarText.setOrigin(
            0.5
        );

        this.nitroBarText.setLetterSpacing(
            3
        );

        this.nitroBar.add(
            this.nitroBarText
        );

        // PUBLIC REFERENCE

        this.nitroText =
            this.nitroBarText;

        // ========================================================
        // STATE
        // ========================================================

        this.nitroBarState =
            this.createText(
                0,
                27,
                "READY",
                "#5C7B86",
                "6px"
            );

        this.nitroBarState.setOrigin(
            0.5
        );

        this.nitroBarState.setLetterSpacing(
            2
        );

        this.nitroBar.add(
            this.nitroBarState
        );

        // ========================================================
        // MOBILE TOUCH AREA
        // ========================================================

        this.nitroTouchZone =
            this.scene.add.rectangle(
                this.NITRO_X,
                this.NITRO_Y,
                200,
                64,
                0x000000,
                0
            );

        this.nitroTouchZone.setDepth(
            this.DEPTH + 50
        );

        this.nitroTouchZone.setInteractive({
            useHandCursor: true
        });

        // ========================================================
        // POINTER DOWN
        // ========================================================

        this.nitroTouchZone.on(
            "pointerdown",
            () => {

                if (
                    this.destroyed ||
                    this.nitroPressed
                ) {
                    return;
                }

                this.nitroPressed =
                    true;

                AudioSystem.click();

                this.activateNitroBarVisual();

                this.scene.events.emit(
                    "hud-nitro-pressed"
                );
            }
        );

        // ========================================================
        // POINTER UP
        // ========================================================

        this.nitroTouchZone.on(
            "pointerup",
            () => {

                this.nitroPressed =
                    false;

                this.scene.tweens.add({

                    targets:
                        this.nitroBar,

                    scale:
                        1,

                    duration:
                        100,

                    ease:
                        "Back.out"
                });
            }
        );

        // ========================================================
        // POINTER OUT
        // ========================================================

        this.nitroTouchZone.on(
            "pointerout",
            () => {

                this.nitroPressed =
                    false;

                this.scene.tweens.add({

                    targets:
                        this.nitroBar,

                    scale:
                        1,

                    duration:
                        100
                });
            }
        );

        this.root.add(
            this.nitroTouchZone
        );
    }

    // ============================================================
    // DRAW NITRO BAR
    // ============================================================

    private drawNitroBar(
        active: boolean,
        cooldown: boolean
    ): void {

        const fillColor =
            active
                ? this.WHITE
                : cooldown
                    ? this.ORANGE
                    : this.CYAN;

        const glowColor =
            active
                ? this.CYAN
                : cooldown
                    ? this.ORANGE
                    : this.CYAN;

        // ========================================================
        // FILL
        // ========================================================

        this.nitroBarFill.clear();

        this.nitroBarFill.fillStyle(
            fillColor,
            active
                ? 0.9
                : 0.72
        );

        this.nitroBarFill.fillRoundedRect(
            -70,
            -5,
            140,
            10,
            2
        );

        // ========================================================
        // HIGHLIGHT
        // ========================================================

        this.nitroBarHighlight.clear();

        this.nitroBarHighlight.lineStyle(
            2,
            glowColor,
            active
                ? 0.8
                : 0.35
        );

        this.nitroBarHighlight.lineBetween(
            -68,
            -5,
            68,
            -5
        );

        // ========================================================
        // SEGMENTS
        // ========================================================

        this.nitroBarEnergy.clear();

        this.nitroBarEnergy.lineStyle(
            1,
            this.DARK,
            0.28
        );

        for (
            let i = -60;
            i <= 60;
            i += 12
        ) {

            this.nitroBarEnergy.lineBetween(
                i,
                -5,
                i,
                5
            );
        }

        // ========================================================
        // TICKS
        // ========================================================

        this.nitroBarTicks.clear();

        this.nitroBarTicks.lineStyle(
            1,
            glowColor,
            0.35
        );

        for (
            let i = -70;
            i <= 70;
            i += 14
        ) {

            this.nitroBarTicks.lineBetween(
                i,
                9,
                i + 6,
                9
            );
        }
    }

    // ============================================================
    // NITRO PRESS FX
    // ============================================================

    private activateNitroBarVisual(): void {

        this.nitroBar.setScale(
            0.96
        );

        this.scene.tweens.add({

            targets:
                this.nitroBar,

            scale:
                1.04,

            duration:
                140,

            ease:
                "Back.out"
        });

        this.nitroBarFill.setAlpha(
            1
        );

        this.scene.tweens.add({

            targets:
                this.nitroBarFill,

            alpha:
                0.35,

            duration:
                110,

            yoyo:
                true,

            repeat:
                2
        });

        // ========================================================
        // SHOCKWAVE
        // ========================================================

        const shock =
            this.scene.add.graphics();

        shock.setDepth(
            this.DEPTH + 35
        );

        shock.lineStyle(
            2,
            this.CYAN,
            0.85
        );

        shock.strokeRoundedRect(
            this.NITRO_X - 82,
            this.NITRO_Y - 15,
            164,
            30,
            7
        );

        this.root.add(
            shock
        );

        this.scene.tweens.add({

            targets:
                shock,

            scaleX:
                1.12,

            scaleY:
                1.45,

            alpha:
                0,

            duration:
                260,

            ease:
                "Cubic.out",

            onComplete:
                () => {

                    shock.destroy();
                }
        });

        // ========================================================
        // FLASH
        // ========================================================

        this.flash.setAlpha(
            0.055
        );

        this.scene.tweens.add({

            targets:
                this.flash,

            alpha:
                0,

            duration:
                150
        });

        // ========================================================
        // PARTICLES
        // ========================================================

        for (
            let i = 0;
            i < 8;
            i++
        ) {

            const p =
                this.scene.add.graphics();

            p.setDepth(
                this.DEPTH + 30
            );

            p.fillStyle(
                i % 2 === 0
                    ? this.CYAN
                    : this.WHITE,
                0.9
            );

            p.fillCircle(
                this.NITRO_X +
                Phaser.Math.Between(
                    -65,
                    65
                ),
                this.NITRO_Y +
                Phaser.Math.Between(
                    -4,
                    4
                ),
                Phaser.Math.Between(
                    1,
                    2
                )
            );

            this.root.add(
                p
            );

            this.scene.tweens.add({

                targets:
                    p,

                x:
                    p.x +
                    Phaser.Math.Between(
                        -30,
                        30
                    ),

                y:
                    p.y +
                    Phaser.Math.Between(
                        -18,
                        18
                    ),

                alpha:
                    0,

                scale:
                    0,

                duration:
                    Phaser.Math.Between(
                        180,
                        320
                    ),

                ease:
                    "Cubic.out",

                onComplete:
                    () => {

                        p.destroy();
                    }
            });
        }
    }

    // ============================================================
    // PAUSE BUTTON
    // ============================================================

    private createPauseButton(): void {

        this.pauseButton =
            this.scene.add.container(
                350,
                160
            );

        this.pauseButton.setDepth(
            this.DEPTH + 45
        );

        // ========================================================
        // OUTER GLOW
        // ========================================================

        const glow =
            this.scene.add.graphics();

        glow.lineStyle(
            5,
            this.PURPLE,
            0.035
        );

        glow.strokeRoundedRect(
            -25,
            -20,
            50,
            40,
            8
        );

        this.pauseButton.add(
            glow
        );

        // ========================================================
        // FRAME
        // ========================================================

        const frame =
            this.scene.add.graphics();

        frame.lineStyle(
            1.3,
            this.PURPLE,
            0.9
        );

        frame.fillStyle(
            this.DARK,
            0.94
        );

        frame.beginPath();

        frame.moveTo(-21, -17);
        frame.lineTo(15, -17);
        frame.lineTo(21, -11);
        frame.lineTo(21, 11);
        frame.lineTo(15, 17);
        frame.lineTo(-21, 17);
        frame.lineTo(-21, -17);

        frame.closePath();

        frame.fillPath();
        frame.strokePath();

        this.pauseButton.add(
            frame
        );

        // ========================================================
        // LEFT ACCENT
        // ========================================================

        const accent =
            this.scene.add.graphics();

        accent.lineStyle(
            2,
            this.CYAN,
            0.8
        );

        accent.lineBetween(
            -17,
            -10,
            -17,
            10
        );

        this.pauseButton.add(
            accent
        );

        // ========================================================
        // PAUSE ICON
        // ========================================================

        const pauseIcon =
            this.scene.add.graphics();

        pauseIcon.fillStyle(
            this.WHITE,
            0.95
        );

        pauseIcon.fillRoundedRect(
            -7,
            -8,
            4,
            16,
            1
        );

        pauseIcon.fillRoundedRect(
            3,
            -8,
            4,
            16,
            1
        );

        this.pauseButton.add(
            pauseIcon
        );

        // ========================================================
        // TEXT
        // ========================================================

        const pauseText =
            this.scene.add.text(
                0,
                27,
                "PAUSE",
                {
                    fontFamily:
                        "Arial Black",

                    fontSize:
                        "6px",

                    color:
                        "#7F96A0",

                    stroke:
                        "#02070C",

                    strokeThickness:
                        2
                }
            );

        pauseText.setOrigin(
            0.5
        );

        pauseText.setLetterSpacing(
            1.5
        );

        this.pauseButton.add(
            pauseText
        );

        // ========================================================
        // TOUCH SIZE
        // ========================================================

        this.pauseButton.setSize(
            54,
            54
        );

        this.pauseButton.setInteractive({
            useHandCursor:
                true
        });

        // ========================================================
        // HOVER
        // ========================================================

        this.pauseButton.on(
            "pointerover",
            () => {

                this.pauseButton.setScale(
                    1.08
                );
            }
        );

        this.pauseButton.on(
            "pointerout",
            () => {

                this.pauseButton.setScale(
                    1
                );
            }
        );

        // ========================================================
        // PRESS
        // ========================================================

        this.pauseButton.on(
            "pointerdown",
            () => {

                if (
                    this.destroyed
                ) {
                    return;
                }

                AudioSystem.click();

                this.pauseButton.setScale(
                    0.9
                );

                this.scene.time.delayedCall(
                    90,
                    () => {

                        if (
                            this.pauseButton &&
                            this.pauseButton.active
                        ) {

                            this.pauseButton.setScale(
                                1
                            );
                        }
                    }
                );

                this.scene.scene.pause();

                this.scene.scene.launch(
                    "PauseScene"
                );
            }
        );

        this.root.add(
            this.pauseButton
        );
    }

    // ============================================================
    // DAMAGE FLASH
    // ============================================================

    private createDamageFlash(): void {

        this.flash =
            this.scene.add.rectangle(
                200,
                400,
                this.W,
                this.H,
                this.RED,
                0
            );

        this.flash.setDepth(
            this.DEPTH + 100
        );

        this.root.add(
            this.flash
        );
    }

    // ============================================================
    // TEXT FACTORY
    // ============================================================

    private createText(
        x: number,
        y: number,
        text: string,
        color: string,
        fontSize: string
    ): Phaser.GameObjects.Text {

        const t =
            this.scene.add.text(
                x,
                y,
                text,
                {
                    fontFamily:
                        "Arial Black",

                    fontSize,

                    color,

                    stroke:
                        "#02070C",

                    strokeThickness:
                        3,

                    shadow: {
                        offsetX: 0,
                        offsetY: 0,
                        color,
                        blur: 5,
                        stroke: false,
                        fill: false
                    }
                }
            );

        t.setDepth(
            this.DEPTH
        );

        this.root.add(
            t
        );

        return t;
    }

    // ============================================================
    // CRYSTAL ICON
    // ============================================================

    private drawCrystalIcon(
        x: number,
        y: number,
        size: number
    ): void {

        this.crystalIcon.clear();

        // Glow

        this.crystalIcon.fillStyle(
            this.CYAN,
            0.08
        );

        this.crystalIcon.fillCircle(
            x,
            y,
            size * 2
        );

        // Body

        this.crystalIcon.fillStyle(
            this.CYAN,
            0.9
        );

        this.crystalIcon.lineStyle(
            1,
            this.WHITE,
            0.8
        );

        this.crystalIcon.beginPath();

        this.crystalIcon.moveTo(
            x,
            y - size
        );

        this.crystalIcon.lineTo(
            x + size * 0.75,
            y - size * 0.2
        );

        this.crystalIcon.lineTo(
            x + size * 0.38,
            y + size
        );

        this.crystalIcon.lineTo(
            x - size * 0.38,
            y + size
        );

        this.crystalIcon.lineTo(
            x - size * 0.75,
            y - size * 0.2
        );

        this.crystalIcon.closePath();

        this.crystalIcon.fillPath();
        this.crystalIcon.strokePath();

        // Facets

        this.crystalIcon.lineStyle(
            1,
            this.WHITE,
            0.5
        );

        this.crystalIcon.lineBetween(
            x,
            y - size,
            x,
            y + size
        );

        this.crystalIcon.lineBetween(
            x - size * 0.75,
            y - size * 0.2,
            x,
            y + size
        );

        this.crystalIcon.lineBetween(
            x + size * 0.75,
            y - size * 0.2,
            x,
            y + size
        );
    }

    // ============================================================
    // GET ZONE
    // ============================================================

    private getZone(
        level: number
    ) {

        const safeLevel =
            Math.max(
                1,
                Math.floor(level)
            );

        // Every 10 levels = next zone

        const zoneIndex =
            Math.min(
                this.ZONES.length - 1,
                Math.floor(
                    (safeLevel - 1) / 10
                )
            );

        return {
            zoneIndex,
            zone:
                this.ZONES[zoneIndex]
        };
    }

    // ============================================================
    // UPDATE
    // ============================================================

    public update(
        data: {

            score: number;

            crystals: number;

            speed: number;

            level: number;

            combo: number;

            nitro: boolean;

            cooldown: boolean;

            health: number;

        }
    ): void {

        if (
            this.destroyed
        ) {

            return;
        }

        // ========================================================
        // SCORE
        // ========================================================

        const score =
            Math.floor(
                data.score
            );

        this.scoreText.setText(
            score
                .toString()
                .padStart(
                    6,
                    "0"
                )
        );

        if (
            score !==
            this.lastScore
        ) {

            this.scoreText.setScale(
                1.04
            );

            this.scene.tweens.add({

                targets:
                    this.scoreText,

                scale:
                    1,

                duration:
                    90,

                ease:
                    "Quad.out"
            });
        }

        // ========================================================
        // LEVEL
        // ========================================================

        const level =
            Math.max(
                1,
                Math.floor(
                    data.level
                )
            );

        this.levelLabel.setText(
            `LEVEL ${String(
                level
            ).padStart(
                2,
                "0"
            )}`
        );

        // ========================================================
        // ZONE
        // ========================================================

        const zoneData =
            this.getZone(
                level
            );

        const zoneIndex =
            zoneData.zoneIndex;

        const zone =
            zoneData.zone;

        this.zoneLabel.setText(
            zone.name
        );

        this.sectorLabel.setText(
            zone.sector
        );

        this.zoneLabel.setColor(
            Phaser.Display.Color.IntegerToColor(
                zone.color
            ).rgba
        );

        // ========================================================
        // ZONE CHANGE FX
        // ========================================================

        if (
            zoneIndex !==
            this.lastZoneIndex
        ) {

            this.zoneLabel.setScale(
                1.15
            );

            this.levelLabel.setScale(
                1.08
            );

            this.scene.tweens.add({

                targets:
                    [
                        this.zoneLabel,
                        this.levelLabel
                    ],

                scale:
                    1,

                duration:
                    260,

                ease:
                    "Back.out"
            });

            this.lastZoneIndex =
                zoneIndex;
        }

        // ========================================================
        // CRYSTALS
        // ========================================================

        const crystals =
            Math.max(
                0,
                Math.floor(
                    data.crystals
                )
            );

        const crystalString =
            crystals.toLocaleString();

        this.crystalText.setText(
            crystalString
        );

        // Keep crystal text INSIDE frame

        this.crystalText.setX(
            377
        );

        this.crystalText.setOrigin(
            1,
            0
        );

        if (
            crystals !==
            this.lastCrystals
        ) {

            this.crystalIcon.setScale(
                1.35
            );

            this.crystalText.setScale(
                1.15
            );

            this.scene.tweens.add({

                targets:
                    this.crystalIcon,

                scale:
                    1,

                duration:
                    260,

                ease:
                    "Back.out"
            });

            this.scene.tweens.add({

                targets:
                    this.crystalText,

                scale:
                    1,

                duration:
                    180,

                ease:
                    "Back.out"
            });

            this.createCrystalPickupFX();
        }

        // ========================================================
        // SPEED
        // ========================================================

        const speed =
            Math.max(
                0,
                Math.floor(
                    data.speed
                )
            );

        this.speedText.setText(
            speed
                .toString()
                .padStart(
                    3,
                    "0"
                )
        );

        this.updateSpeedMeter(
            speed
        );

        // ========================================================
        // ARMOR
        // ========================================================

        const health =
            Phaser.Math.Clamp(
                Math.floor(
                    data.health
                ),
                0,
                4
            );

        this.drawArmor(
            health
        );

        if (
            health <
            this.lastHealth
        ) {

            this.flashDamage();
        }

        // ========================================================
        // COMBO
        // ========================================================

        this.showCombo(
            data.combo
        );

        // ========================================================
        // NITRO
        // ========================================================

        this.updateNitro(
            data.nitro,
            data.cooldown
        );

        // ========================================================
        // AMBIENT
        // ========================================================

        this.pulseTimer +=
            this.scene.game.loop.delta;

        if (
            this.pulseTimer >
            50
        ) {

            this.pulseTimer = 0;

            this.updateAmbientPulse();
        }

        // ========================================================
        // ACTIVE NITRO
        // ========================================================

        if (
            data.nitro
        ) {

            this.nitroTimer +=
                this.scene.game.loop.delta;

            if (
                this.nitroTimer >
                100
            ) {

                this.nitroTimer = 0;

                this.nitroBarGlow.setAlpha(
                    0.4 +
                    Math.random() *
                    0.5
                );

                this.nitroBarHighlight.setAlpha(
                    0.5 +
                    Math.random() *
                    0.5
                );
            }
        }

        // ========================================================
        // SAVE STATE
        // ========================================================

        this.lastScore =
            score;

        this.lastCrystals =
            crystals;

        this.lastCombo =
            data.combo;

        this.lastHealth =
            health;

        this.lastNitro =
            data.nitro;
    }

    // ============================================================
    // NITRO UPDATE
    // ============================================================

    private updateNitro(
        active: boolean,
        cooldown: boolean
    ): void {

        if (
            active
        ) {

            this.nitroBarText.setColor(
                "#FFFFFF"
            );

            this.nitroBarState.setText(
                "OVERDRIVE"
            );

            this.nitroBarState.setColor(
                "#00F6FF"
            );

            this.nitroBarOuter.clear();

            this.nitroBarOuter.lineStyle(
                2.5,
                this.WHITE,
                0.95
            );

            this.nitroBarOuter.fillStyle(
                0x06212A,
                0.96
            );

            this.nitroBarOuter.fillRoundedRect(
                -82,
                -15,
                164,
                30,
                7
            );

            this.nitroBarOuter.strokeRoundedRect(
                -82,
                -15,
                164,
                30,
                7
            );

            this.drawNitroBar(
                true,
                false
            );

            this.nitroBar.setScale(
                1.015
            );

        } else if (
            cooldown
        ) {

            this.nitroBarText.setColor(
                "#FF8844"
            );

            this.nitroBarState.setText(
                "RECHARGING"
            );

            this.nitroBarState.setColor(
                "#FF8844"
            );

            this.nitroBarOuter.clear();

            this.nitroBarOuter.lineStyle(
                2,
                this.ORANGE,
                0.75
            );

            this.nitroBarOuter.fillStyle(
                this.DARK,
                0.94
            );

            this.nitroBarOuter.fillRoundedRect(
                -82,
                -15,
                164,
                30,
                7
            );

            this.nitroBarOuter.strokeRoundedRect(
                -82,
                -15,
                164,
                30,
                7
            );

            this.drawNitroBar(
                false,
                true
            );

            this.nitroBar.setScale(
                1
            );

        } else {

            this.nitroBarText.setColor(
                "#00F6FF"
            );

            this.nitroBarState.setText(
                "READY"
            );

            this.nitroBarState.setColor(
                "#607B85"
            );

            this.nitroBarOuter.clear();

            this.nitroBarOuter.lineStyle(
                1.5,
                this.CYAN,
                0.85
            );

            this.nitroBarOuter.fillStyle(
                this.DARK,
                0.94
            );

            this.nitroBarOuter.fillRoundedRect(
                -82,
                -15,
                164,
                30,
                7
            );

            this.nitroBarOuter.strokeRoundedRect(
                -82,
                -15,
                164,
                30,
                7
            );

            this.drawNitroBar(
                false,
                false
            );

            this.nitroBar.setScale(
                1
            );
        }
    }

    // ============================================================
    // CRYSTAL FX
    // ============================================================

    private createCrystalPickupFX(): void {

        const burst =
            this.scene.add.graphics();

        burst.setDepth(
            this.DEPTH + 20
        );

        const cx = 326;
        const cy = 30;

        burst.lineStyle(
            2,
            this.CYAN,
            0.85
        );

        burst.strokeCircle(
            cx,
            cy,
            8
        );

        for (
            let i = 0;
            i < 6;
            i++
        ) {

            const angle =
                (Math.PI * 2 / 6) *
                i;

            const x1 =
                cx +
                Math.cos(angle) *
                10;

            const y1 =
                cy +
                Math.sin(angle) *
                10;

            const x2 =
                cx +
                Math.cos(angle) *
                20;

            const y2 =
                cy +
                Math.sin(angle) *
                20;

            burst.lineStyle(
                1,
                this.CYAN,
                0.7
            );

            burst.lineBetween(
                x1,
                y1,
                x2,
                y2
            );
        }

        this.root.add(
            burst
        );

        this.scene.tweens.add({

            targets:
                burst,

            scale:
                1.6,

            alpha:
                0,

            duration:
                320,

            ease:
                "Cubic.out",

            onComplete:
                () => {

                    burst.destroy();
                }
        });
    }

    // ============================================================
    // DAMAGE
    // ============================================================

    private flashDamage(): void {

        this.flash.setAlpha(
            0.12
        );

        this.scene.tweens.add({

            targets:
                this.flash,

            alpha:
                0,

            duration:
                240
        });

        this.armorWarning.clear();

        this.armorWarning.lineStyle(
            3,
            this.RED,
            0.7
        );

        this.armorWarning.lineBetween(
            278,
            104,
            382,
            104
        );

        this.scene.tweens.add({

            targets:
                this.armorWarning,

            alpha:
                0,

            duration:
                350,

            onComplete:
                () => {

                    this.armorWarning.clear();

                    this.armorWarning.setAlpha(
                        1
                    );
                }
        });

        this.armorLabel.setColor(
            "#FF315C"
        );

        this.scene.tweens.add({

            targets:
                this.armorLabel,

            alpha:
                0.25,

            yoyo:
                true,

            repeat:
                3,

            duration:
                55,

            onComplete:
                () => {

                    if (
                        this.armorLabel &&
                        this.armorLabel.active
                    ) {

                        this.armorLabel.setColor(
                            "#6C8994"
                        );

                        this.armorLabel.setAlpha(
                            1
                        );
                    }
                }
        });
    }

    // ============================================================
    // AMBIENT PULSE
    // ============================================================

    private updateAmbientPulse(): void {

        const time =
            Date.now();

        const pulse =
            0.65 +
            Math.sin(
                time * 0.003
            ) *
            0.2;

        this.crystalIcon.setAlpha(
            pulse
        );

        this.topLines.setAlpha(
            0.7 +
            Math.sin(
                time * 0.002
            ) *
            0.2
        );

        this.speedGlow.setAlpha(
            0.7 +
            Math.sin(
                time * 0.0025
            ) *
            0.15
        );

        if (
            !this.lastNitro
        ) {

            this.nitroBarGlow.setAlpha(
                0.5 +
                Math.sin(
                    time * 0.004
                ) *
                0.18
            );
        }
    }

    // ============================================================
    // DESTROY
    // ============================================================

    public destroy(): void {

        if (
            this.destroyed
        ) {

            return;
        }

        this.destroyed =
            true;

        if (
            this.nitroTouchZone &&
            this.nitroTouchZone.active
        ) {

            this.nitroTouchZone.disableInteractive();
        }

        if (
            this.pauseButton &&
            this.pauseButton.active
        ) {

            this.pauseButton.disableInteractive();
        }

        if (
            this.root
        ) {

            this.root.destroy(
                true
            );
        }
    }
}