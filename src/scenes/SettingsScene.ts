import Phaser from "phaser";
import AudioSystem from "../systems/AudioSystem";
import SaveSystem from "../systems/SaveSystem";

// ============================================================
// NIGHT ROAD
// PREMIUM CYBERPUNK SETTINGS
// Phaser 4 + TypeScript
// 400 x 800 Mobile Composition
// ============================================================

const CONFIG = {
    colors: {
        bg: 0x02060b,
        bgDeep: 0x010308,

        cyan: 0x00ffff,
        cyanBright: 0x8fffff,
        cyanSoft: 0x36dfe8,
        cyanDark: 0x006b76,

        magenta: 0xff00d9,
        magentaSoft: 0xff4de5,

        white: 0xffffff,
        text: 0xe9fbff,
        muted: 0x688894,
        muted2: 0x42636e,
        dim: 0x203740,

        panel: 0x07131c,
        panel2: 0x091923,
        panel3: 0x0b202b,
        panelDark: 0x030a10,

        track: 0x0b1a22,
        trackDark: 0x061016,

        off: 0x101c23,
        black: 0x000000,
    },

    layout: {
        centerX: 200,

        headerY: 48,

        mainX: 200,
        mainY: 440,
        mainWidth: 374,
        mainHeight: 646,

        contentLeft: 42,
        contentRight: 358,

        musicHeaderY: 170,
        musicSliderY: 225,
        musicToggleY: 276,

        separator1Y: 316,

        sfxHeaderY: 352,
        sfxSliderY: 407,
        sfxToggleY: 458,

        separator2Y: 500,

        controlHeaderY: 532,

        controlY: 620,

        backY: 718,

        sliderWidth: 250,
        sliderHeight: 8,

        knobRadius: 11,

        switchWidth: 136,
        switchHeight: 40,

        controlCardWidth: 148,
        controlCardHeight: 82,

        backWidth: 250,
        backHeight: 48,
    },

    animation: {
        hoverScale: 1.025,
        clickScale: 0.965,

        hoverDuration: 120,
        clickDuration: 70,

        ambient: 1800,
        titlePulse: 1700,
    },

    volume: {
        step: 0.05,
        doubleClickThreshold: 300,
        muteValue: 0.5,
    },
};

export default class SettingsScene extends Phaser.Scene {

    // =========================================================
    // BACKGROUND
    // =========================================================

    private backgroundGlow!: Phaser.GameObjects.Ellipse;
    private backgroundGlow2!: Phaser.GameObjects.Ellipse;

    // =========================================================
    // HEADER
    // =========================================================

    private title!: Phaser.GameObjects.Text;

    // =========================================================
    // MUSIC
    // =========================================================

    private musicValue!: Phaser.GameObjects.Text;

    private musicSlider!: Phaser.GameObjects.Container;
    private musicBarBg!: Phaser.GameObjects.Rectangle;
    private musicBar!: Phaser.GameObjects.Rectangle;
    private musicKnob!: Phaser.GameObjects.Arc;

    private musicToggle!: Phaser.GameObjects.Container;
    private musicToggleBg!: Phaser.GameObjects.Rectangle;
    private musicToggleLabel!: Phaser.GameObjects.Text;

    // =========================================================
    // SFX
    // =========================================================

    private sfxValue!: Phaser.GameObjects.Text;

    private sfxSlider!: Phaser.GameObjects.Container;
    private sfxBarBg!: Phaser.GameObjects.Rectangle;
    private sfxBar!: Phaser.GameObjects.Rectangle;
    private sfxKnob!: Phaser.GameObjects.Arc;

    private sfxToggle!: Phaser.GameObjects.Container;
    private sfxToggleBg!: Phaser.GameObjects.Rectangle;
    private sfxToggleLabel!: Phaser.GameObjects.Text;

    // =========================================================
    // CONTROL
    // =========================================================

    private mobileButton!: Phaser.GameObjects.Container;
    private keyboardButton!: Phaser.GameObjects.Container;

    private mobileBg!: Phaser.GameObjects.Rectangle;
    private keyboardBg!: Phaser.GameObjects.Rectangle;

    private mobileLabel!: Phaser.GameObjects.Text;
    private keyboardLabel!: Phaser.GameObjects.Text;

    // =========================================================
    // BACK
    // =========================================================

    private backButton!: Phaser.GameObjects.Container;

    // =========================================================
    // STATE
    // =========================================================

    private isDragging = false;

    private lastDraggedKnob:
        Phaser.GameObjects.Arc | null = null;

    private lastClickTime = 0;

    private volumeToast:
        Phaser.GameObjects.Text | null = null;

    private valuePopTweens:
        Map<
            Phaser.GameObjects.Text,
            Phaser.Tweens.Tween
        > = new Map();

    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    constructor() {
        super("SettingsScene");
    }

    // =========================================================
    // CREATE
    // =========================================================

    create(): void {

        SaveSystem.load();

        AudioSystem.init(this);

        this.cameras.main.setBackgroundColor(
            CONFIG.colors.bg
        );

        this.setupBackground();
        this.setupHeader();
        this.setupMainFrame();

        this.setupMusic();
        this.setupSfx();
        this.setupControls();
        this.setupBackButton();

        this.setupEvents();

        this.refresh();
    }

    // =========================================================
    // BACKGROUND
    // =========================================================

    private setupBackground(): void {

        this.add.rectangle(
            200,
            400,
            400,
            800,
            CONFIG.colors.bg
        ).setDepth(-50);

        // -----------------------------------------------------
        // Cyan atmosphere
        // -----------------------------------------------------

        this.backgroundGlow = this.add.ellipse(
            45,
            260,
            340,
            340,
            CONFIG.colors.cyan,
            0.045
        ).setDepth(-45);

        this.tweens.add({
            targets: this.backgroundGlow,
            scale: 1.18,
            alpha: 0.07,
            duration: CONFIG.animation.ambient,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        });

        // -----------------------------------------------------
        // Magenta atmosphere
        // -----------------------------------------------------

        this.backgroundGlow2 = this.add.ellipse(
            365,
            630,
            310,
            310,
            CONFIG.colors.magenta,
            0.028
        ).setDepth(-44);

        this.tweens.add({
            targets: this.backgroundGlow2,
            scale: 1.2,
            alpha: 0.055,
            duration: 2400,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        });

        // -----------------------------------------------------
        // Technical grid
        // -----------------------------------------------------

        const grid = this.add.graphics()
            .setDepth(-40);

        grid.lineStyle(
            1,
            CONFIG.colors.cyan,
            0.018
        );

        for (let x = 0; x <= 400; x += 25) {
            grid.lineBetween(
                x,
                0,
                x,
                800
            );
        }

        for (let y = 0; y <= 800; y += 25) {
            grid.lineBetween(
                0,
                y,
                400,
                y
            );
        }

        // -----------------------------------------------------
        // Scanlines
        // -----------------------------------------------------

        const scanlines = this.add.graphics()
            .setDepth(-35);

        scanlines.lineStyle(
            1,
            CONFIG.colors.cyan,
            0.009
        );

        for (let y = 0; y < 800; y += 6) {
            scanlines.lineBetween(
                0,
                y,
                400,
                y
            );
        }

        // -----------------------------------------------------
        // HUD side lines
        // -----------------------------------------------------

        const hud = this.add.graphics()
            .setDepth(-30);

        hud.lineStyle(
            1,
            CONFIG.colors.cyan,
            0.16
        );

        hud.lineBetween(
            14,
            125,
            64,
            125
        );

        hud.lineBetween(
            336,
            125,
            386,
            125
        );

        hud.lineStyle(
            1,
            CONFIG.colors.magenta,
            0.12
        );

        hud.lineBetween(
            18,
            134,
            44,
            134
        );

        hud.lineBetween(
            356,
            134,
            382,
            134
        );

        this.createScreenCorners();
    }

    // =========================================================
    // SCREEN CORNERS
    // =========================================================

    private createScreenCorners(): void {

        const g = this.add.graphics()
            .setDepth(-10);

        g.lineStyle(
            2,
            CONFIG.colors.cyan,
            0.5
        );

        // Top left

        g.lineBetween(
            14,
            16,
            48,
            16
        );

        g.lineBetween(
            14,
            16,
            14,
            48
        );

        // Top right

        g.lineBetween(
            352,
            16,
            386,
            16
        );

        g.lineBetween(
            386,
            16,
            386,
            48
        );

        // Bottom left

        g.lineBetween(
            14,
            752,
            14,
            784
        );

        g.lineBetween(
            14,
            784,
            48,
            784
        );

        // Bottom right

        g.lineBetween(
            352,
            784,
            386,
            784
        );

        g.lineBetween(
            386,
            752,
            386,
            784
        );

        // Magenta details

        g.lineStyle(
            1,
            CONFIG.colors.magenta,
            0.5
        );

        g.lineBetween(
            25,
            27,
            43,
            27
        );

        g.lineBetween(
            357,
            27,
            375,
            27
        );
    }

    // =========================================================
    // HEADER
    // =========================================================

    private setupHeader(): void {

        // Magenta ghost

        this.add.text(
            204,
            CONFIG.layout.headerY,
            "SETTINGS",
            {
                fontFamily: "Arial Black",
                fontSize: "40px",
                color: "#ff00d9",
            }
        )
            .setOrigin(0.5)
            .setDepth(2);

        // Main title

        this.title = this.add.text(
            200,
            CONFIG.layout.headerY,
            "SETTINGS",
            {
                fontFamily: "Arial Black",
                fontSize: "40px",
                color: "#ffffff",
                stroke: "#00ffff",
                strokeThickness: 2,
                shadow: {
                    color: "#00ffff",
                    blur: 18,
                    fill: true,
                },
            }
        )
            .setOrigin(0.5)
            .setDepth(5);

        this.tweens.add({
            targets: this.title,
            alpha: 0.9,
            scaleX: 1.012,
            scaleY: 1.012,
            duration: CONFIG.animation.titlePulse,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        });

        // Subtitle

        this.add.text(
            200,
            87,
            "SYSTEM CONFIGURATION",
            {
                fontFamily: "Arial",
                fontSize: "8px",
                color: "#00ffff",
                letterSpacing: 4,
            } as Phaser.Types.GameObjects.Text.TextStyle
        )
            .setOrigin(0.5)
            .setDepth(6);

        // Status

        this.add.rectangle(
            78,
            106,
            5,
            5,
            CONFIG.colors.cyan
        ).setDepth(6);

        this.add.text(
            88,
            101,
            "ONLINE",
            {
                fontFamily: "Arial Black",
                fontSize: "7px",
                color: "#5f8d99",
                letterSpacing: 1,
            } as Phaser.Types.GameObjects.Text.TextStyle
        ).setDepth(6);

        this.add.text(
            322,
            101,
            "NOVA // 01",
            {
                fontFamily: "Arial Black",
                fontSize: "7px",
                color: "#5f8d99",
                letterSpacing: 1,
            } as Phaser.Types.GameObjects.Text.TextStyle
        )
            .setOrigin(0.5, 0)
            .setDepth(6);
    }

    // =========================================================
    // MAIN FRAME
    // =========================================================

    private setupMainFrame(): void {

        const x = CONFIG.layout.mainX;
        const y = CONFIG.layout.mainY;

        // Outer glow

        const glow = this.add.rectangle(
            x,
            y,
            CONFIG.layout.mainWidth + 14,
            CONFIG.layout.mainHeight + 14,
            CONFIG.colors.cyan,
            0.025
        ).setDepth(0);

        this.tweens.add({
            targets: glow,
            alpha: 0.045,
            scaleX: 1.01,
            scaleY: 1.01,
            duration: 2100,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        });

        // Main panel

        const panel = this.add.rectangle(
            x,
            y,
            CONFIG.layout.mainWidth,
            CONFIG.layout.mainHeight,
            CONFIG.colors.panel,
            0.975
        ).setDepth(1);

        panel.setStrokeStyle(
            2,
            CONFIG.colors.cyan,
            0.58
        );

        // Inner frame

        const inner = this.add.rectangle(
            x,
            y,
            CONFIG.layout.mainWidth - 10,
            CONFIG.layout.mainHeight - 10,
            CONFIG.colors.panelDark,
            0.2
        ).setDepth(2);

        inner.setStrokeStyle(
            1,
            CONFIG.colors.cyan,
            0.1
        );

        // Top technical strip

        this.add.rectangle(
            200,
            133,
            344,
            24,
            CONFIG.colors.cyan,
            0.025
        ).setDepth(3);

        this.add.rectangle(
            200,
            133,
            344,
            1,
            CONFIG.colors.cyan,
            0.22
        ).setDepth(4);

        this.add.text(
            35,
            126,
            "NIGHT ROAD // SETTINGS",
            {
                fontFamily: "Arial Black",
                fontSize: "7px",
                color: "#5f8d99",
                letterSpacing: 2,
            } as Phaser.Types.GameObjects.Text.TextStyle
        ).setDepth(5);

        this.add.text(
            365,
            126,
            "SYS.01",
            {
                fontFamily: "Arial Black",
                fontSize: "7px",
                color: "#00ffff",
            }
        )
            .setOrigin(1, 0)
            .setDepth(5);

        // Frame corners

        const corners = this.add.graphics()
            .setDepth(6);

        corners.lineStyle(
            2,
            CONFIG.colors.cyan,
            0.65
        );

        corners.lineBetween(
            25,
            116,
            42,
            116
        );

        corners.lineBetween(
            25,
            116,
            25,
            133
        );

        corners.lineBetween(
            358,
            116,
            375,
            116
        );

        corners.lineBetween(
            375,
            116,
            375,
            133
        );

        corners.lineBetween(
            25,
            724,
            25,
            741
        );

        corners.lineBetween(
            25,
            741,
            42,
            741
        );

        corners.lineBetween(
            358,
            741,
            375,
            741
        );

        corners.lineBetween(
            375,
            724,
            375,
            741
        );
    }

    // =========================================================
    // MUSIC
    // =========================================================

    private setupMusic(): void {

        this.createSectionHeader(
            CONFIG.layout.contentLeft,
            CONFIG.layout.musicHeaderY,
            "01",
            "MUSIC",
            "BACKGROUND AUDIO"
        );

        this.musicValue = this.createValue(
            356,
            CONFIG.layout.musicHeaderY + 3
        );

        this.addVolumeLabel(
            48,
            201
        );

        this.musicSlider = this.createSlider(
            200,
            CONFIG.layout.musicSliderY,
            AudioSystem.musicVolume,
            true
        );

        this.musicBarBg =
            this.musicSlider.getData(
                "barBg"
            ) as Phaser.GameObjects.Rectangle;

        this.musicBar =
            this.musicSlider.getData(
                "bar"
            ) as Phaser.GameObjects.Rectangle;

        this.musicKnob =
            this.musicSlider.getData(
                "knob"
            ) as Phaser.GameObjects.Arc;

        this.musicToggle = this.createSwitch(
            200,
            CONFIG.layout.musicToggleY,
            AudioSystem.musicEnabled,
            true,
            () => {
                AudioSystem.toggleMusic();
                this.refresh();
                this.saveSettings();
            }
        );

        this.musicToggleBg =
            this.musicToggle.getData(
                "bg"
            ) as Phaser.GameObjects.Rectangle;

        this.musicToggleLabel =
            this.musicToggle.getData(
                "label"
            ) as Phaser.GameObjects.Text;

        this.createSeparator(
            CONFIG.layout.separator1Y
        );
    }

    // =========================================================
    // SFX
    // =========================================================

    private setupSfx(): void {

        this.createSectionHeader(
            CONFIG.layout.contentLeft,
            CONFIG.layout.sfxHeaderY,
            "02",
            "EFFECTS",
            "GAME SOUND EFFECTS"
        );

        this.sfxValue = this.createValue(
            356,
            CONFIG.layout.sfxHeaderY + 3
        );

        this.addVolumeLabel(
            48,
            383
        );

        this.sfxSlider = this.createSlider(
            200,
            CONFIG.layout.sfxSliderY,
            AudioSystem.sfxVolume,
            false
        );

        this.sfxBarBg =
            this.sfxSlider.getData(
                "barBg"
            ) as Phaser.GameObjects.Rectangle;

        this.sfxBar =
            this.sfxSlider.getData(
                "bar"
            ) as Phaser.GameObjects.Rectangle;

        this.sfxKnob =
            this.sfxSlider.getData(
                "knob"
            ) as Phaser.GameObjects.Arc;

        this.sfxToggle = this.createSwitch(
            200,
            CONFIG.layout.sfxToggleY,
            AudioSystem.sfxEnabled,
            false,
            () => {
                AudioSystem.toggleSfx();
                this.refresh();
                this.saveSettings();
            }
        );

        this.sfxToggleBg =
            this.sfxToggle.getData(
                "bg"
            ) as Phaser.GameObjects.Rectangle;

        this.sfxToggleLabel =
            this.sfxToggle.getData(
                "label"
            ) as Phaser.GameObjects.Text;

        this.createSeparator(
            CONFIG.layout.separator2Y
        );
    }

    // =========================================================
    // VALUE
    // =========================================================

    private createValue(
        x: number,
        y: number
    ): Phaser.GameObjects.Text {

        return this.add.text(
            x,
            y,
            "100%",
            {
                fontFamily: "Arial Black",
                fontSize: "19px",
                color: "#00ffff",
                shadow: {
                    color: "#00ffff",
                    blur: 14,
                    fill: true,
                },
            }
        )
            .setOrigin(1, 0.5)
            .setDepth(15);
    }

    // =========================================================
    // VOLUME LABEL
    // =========================================================

    private addVolumeLabel(
        x: number,
        y: number
    ): void {

        this.add.text(
            x,
            y,
            "VOLUME",
            {
                fontFamily: "Arial Black",
                fontSize: "7px",
                color: "#496c78",
                letterSpacing: 1.5,
            } as Phaser.Types.GameObjects.Text.TextStyle
        ).setDepth(12);
    }

    // =========================================================
    // SECTION HEADER
    // =========================================================

    private createSectionHeader(
        x: number,
        y: number,
        number: string,
        title: string,
        subtitle: string
    ): void {

        // Number box

        const box = this.add.rectangle(
            x,
            y,
            26,
            26,
            CONFIG.colors.cyan,
            0.07
        );

        box.setStrokeStyle(
            1,
            CONFIG.colors.cyan,
            0.5
        );

        box.setDepth(12);

        // Number

        this.add.text(
            x,
            y,
            number,
            {
                fontFamily: "Arial Black",
                fontSize: "9px",
                color: "#00ffff",
            }
        )
            .setOrigin(0.5)
            .setDepth(13);

        // Main title

        this.add.text(
            x + 23,
            y - 7,
            title,
            {
                fontFamily: "Arial Black",
                fontSize: "20px",
                color: "#ffffff",
            }
        ).setDepth(13);

        // Subtitle with proper spacing

        this.add.text(
            x + 23,
            y + 16,
            subtitle,
            {
                fontFamily: "Arial",
                fontSize: "7px",
                color: "#557782",
                letterSpacing: 1.2,
            } as Phaser.Types.GameObjects.Text.TextStyle
        ).setDepth(13);
    }

    // =========================================================
    // SLIDER
    // =========================================================

    private createSlider(
        x: number,
        y: number,
        initialValue: number,
        isMusic: boolean
    ): Phaser.GameObjects.Container {

        const container = this.add.container(
            x,
            y
        ).setDepth(15);

        const half =
            CONFIG.layout.sliderWidth / 2;

        // Shadow

        const shadow = this.add.rectangle(
            0,
            3,
            CONFIG.layout.sliderWidth + 8,
            10,
            CONFIG.colors.black,
            0.55
        );

        // Track

        const bg = this.add.rectangle(
            0,
            0,
            CONFIG.layout.sliderWidth,
            CONFIG.layout.sliderHeight,
            CONFIG.colors.track
        );

        bg.setStrokeStyle(
            1,
            CONFIG.colors.cyan,
            0.22
        );

        // Fill

        const bar = this.add.rectangle(
            -half,
            0,
            CONFIG.layout.sliderWidth *
            initialValue,
            CONFIG.layout.sliderHeight,
            CONFIG.colors.cyan
        )
            .setOrigin(0, 0.5);

        // Segment separators

        for (let i = 1; i < 10; i++) {

            const sx =
                -half +
                (CONFIG.layout.sliderWidth / 10) * i;

            const separator = this.add.rectangle(
                sx,
                0,
                1,
                10,
                CONFIG.colors.bg,
                0.45
            );

            container.add(separator);
        }

        // Glow

        const glow = this.add.circle(
            -half +
            CONFIG.layout.sliderWidth *
            initialValue,
            0,
            18,
            CONFIG.colors.cyan,
            0.08
        );

        // Knob

        const knob = this.add.circle(
            -half +
            CONFIG.layout.sliderWidth *
            initialValue,
            0,
            CONFIG.layout.knobRadius,
            CONFIG.colors.white
        );

        knob.setStrokeStyle(
            3,
            CONFIG.colors.cyan,
            1
        );

        container.add([
            shadow,
            bg,
            bar,
            glow,
            knob,
        ]);

        container.setData(
            "barBg",
            bg
        );

        container.setData(
            "bar",
            bar
        );

        container.setData(
            "knob",
            knob
        );

        container.setData(
            "glow",
            glow
        );

        // Knob interaction

        knob.setInteractive({
            draggable: true,
            useHandCursor: true,
        });

        this.input.setDraggable(
            knob
        );

        // Track click

        bg.setInteractive({
            useHandCursor: true,
        });

        bg.on(
            "pointerdown",
            (
                pointer: Phaser.Input.Pointer
            ) => {

                const value =
                    this.getSliderValue(
                        pointer,
                        container
                    );

                this.updateSlider(
                    knob,
                    bar,
                    value,
                    isMusic
                        ? AudioSystem.setMusicVolume.bind(
                            AudioSystem
                        )
                        : AudioSystem.setSfxVolume.bind(
                            AudioSystem
                        )
                );

                AudioSystem.click();

                this.saveSettings();
            }
        );

        // Knob pointer

        knob.on(
            "pointerdown",
            () => {

                this.isDragging = true;

                this.lastDraggedKnob =
                    knob;

                this.highlightKnob(
                    knob,
                    true
                );
            }
        );

        // Double click

        this.setupKnobDoubleClick(
            knob,
            bar,
            isMusic
                ? AudioSystem.setMusicVolume.bind(
                    AudioSystem
                )
                : AudioSystem.setSfxVolume.bind(
                    AudioSystem
                ),
            isMusic
        );

        return container;
    }

    // =========================================================
    // SLIDER VALUE
    // =========================================================

    private getSliderValue(
        pointer: Phaser.Input.Pointer,
        slider: Phaser.GameObjects.Container
    ): number {

        const half =
            CONFIG.layout.sliderWidth / 2;

        const localX =
            pointer.x - slider.x;

        return Phaser.Math.Clamp(
            (
                localX + half
            ) /
            CONFIG.layout.sliderWidth,
            0,
            1
        );
    }

    // =========================================================
    // DOUBLE CLICK
    // =========================================================

    private setupKnobDoubleClick(
        knob: Phaser.GameObjects.Arc,
        bar: Phaser.GameObjects.Rectangle,
        setVolume: (value: number) => void,
        isMusic: boolean
    ): void {

        knob.on(
            "pointerdown",
            () => {

                const now = Date.now();

                if (
                    now -
                    this.lastClickTime <
                    CONFIG.volume.doubleClickThreshold
                ) {

                    const current =
                        isMusic
                            ? AudioSystem.musicVolume
                            : AudioSystem.sfxVolume;

                    const value =
                        current >
                        CONFIG.volume.muteValue
                            ? 0
                            : CONFIG.volume.muteValue;

                    this.updateSlider(
                        knob,
                        bar,
                        value,
                        setVolume
                    );

                    this.saveSettings();

                    this.showVolumeToast(
                        value === 0
                            ? "MUTED"
                            : "VOLUME 50%"
                    );
                }

                this.lastClickTime = now;
            }
        );
    }

    // =========================================================
    // UPDATE SLIDER
    // =========================================================

    private updateSlider(
        knob: Phaser.GameObjects.Arc,
        bar: Phaser.GameObjects.Rectangle,
        value: number,
        setVolume: (value: number) => void
    ): void {

        const v =
            Phaser.Math.Clamp(
                value,
                0,
                1
            );

        const half =
            CONFIG.layout.sliderWidth / 2;

        knob.x =
            -half +
            CONFIG.layout.sliderWidth *
            v;

        bar.width =
            CONFIG.layout.sliderWidth *
            v;

        setVolume(v);

        this.refresh();
    }

    // =========================================================
    // SWITCH
    // =========================================================

    private createSwitch(
        x: number,
        y: number,
        enabled: boolean,
        isMusic: boolean,
        callback: () => void
    ): Phaser.GameObjects.Container {

        const bg = this.add.rectangle(
            0,
            0,
            CONFIG.layout.switchWidth,
            CONFIG.layout.switchHeight,
            enabled
                ? CONFIG.colors.cyan
                : CONFIG.colors.off,
            enabled
                ? 0.11
                : 0.95
        );

        bg.setStrokeStyle(
            1,
            enabled
                ? CONFIG.colors.cyan
                : CONFIG.colors.dim,
            0.9
        );

        // Left accent

        const leftAccent =
            this.add.rectangle(
                -60,
                0,
                3,
                25,
                enabled
                    ? CONFIG.colors.cyan
                    : CONFIG.colors.dim,
                0.9
            );

        // Right accent

        const rightAccent =
            this.add.rectangle(
                60,
                0,
                2,
                18,
                enabled
                    ? CONFIG.colors.cyan
                    : CONFIG.colors.magenta,
                0.65
            );

        // Label

        const label = this.add.text(
            0,
            0,
            enabled
                ? "SYSTEM  ON"
                : "SYSTEM  OFF",
            {
                fontFamily: "Arial Black",
                fontSize: "11px",
                color: enabled
                    ? "#ffffff"
                    : "#58717b",
                letterSpacing: 1.2,
            } as Phaser.Types.GameObjects.Text.TextStyle
        )
            .setOrigin(0.5);

        // Tiny category

        const category = this.add.text(
            0,
            22,
            isMusic
                ? "AUDIO CHANNEL 01"
                : "AUDIO CHANNEL 02",
            {
                fontFamily: "Arial",
                fontSize: "5px",
                color: "#365762",
                letterSpacing: 1,
            } as Phaser.Types.GameObjects.Text.TextStyle
        )
            .setOrigin(0.5);

        const container =
            this.add.container(
                x,
                y,
                [
                    bg,
                    leftAccent,
                    rightAccent,
                    label,
                    category,
                ]
            ).setDepth(15);

        container.setData(
            "bg",
            bg
        );

        container.setData(
            "label",
            label
        );

        container.setData(
            "leftAccent",
            leftAccent
        );

        bg.setInteractive({
            useHandCursor: true,
        });

        bg.on(
            "pointerover",
            () => {

                this.tweens.killTweensOf(
                    container
                );

                this.tweens.add({
                    targets: container,
                    scale:
                        CONFIG.animation.hoverScale,
                    duration:
                        CONFIG.animation.hoverDuration,
                });

                bg.setStrokeStyle(
                    2,
                    CONFIG.colors.magenta,
                    0.95
                );
            }
        );

        bg.on(
            "pointerout",
            () => {

                this.tweens.killTweensOf(
                    container
                );

                this.tweens.add({
                    targets: container,
                    scale: 1,
                    duration:
                        CONFIG.animation.hoverDuration,
                });

                bg.setStrokeStyle(
                    1,
                    enabled
                        ? CONFIG.colors.cyan
                        : CONFIG.colors.dim,
                    0.9
                );
            }
        );

        bg.on(
            "pointerdown",
            () => {

                AudioSystem.click();

                callback();
            }
        );

        return container;
    }

    // =========================================================
    // CONTROL
    // =========================================================

    private setupControls(): void {

        this.createSectionHeader(
            CONFIG.layout.contentLeft,
            CONFIG.layout.controlHeaderY,
            "03",
            "CONTROL",
            "INPUT CONFIGURATION"
        );

        this.mobileButton =
            this.createControlCard(
                118,
                CONFIG.layout.controlY,
                "▣",
                "MOBILE",
                "TOUCH INPUT",
                () => {

                    SaveSystem.setControl(
                        "mobile"
                    );

                    AudioSystem.click();

                    this.refresh();
                    this.saveSettings();
                }
            );

        this.keyboardButton =
            this.createControlCard(
                282,
                CONFIG.layout.controlY,
                "⌨",
                "KEYBOARD",
                "DESKTOP INPUT",
                () => {

                    SaveSystem.setControl(
                        "keyboard"
                    );

                    AudioSystem.click();

                    this.refresh();
                    this.saveSettings();
                }
            );

        this.mobileBg =
            this.mobileButton.getData(
                "bg"
            ) as Phaser.GameObjects.Rectangle;

        this.keyboardBg =
            this.keyboardButton.getData(
                "bg"
            ) as Phaser.GameObjects.Rectangle;

        this.mobileLabel =
            this.mobileButton.getData(
                "label"
            ) as Phaser.GameObjects.Text;

        this.keyboardLabel =
            this.keyboardButton.getData(
                "label"
            ) as Phaser.GameObjects.Text;
    }

    // =========================================================
    // CONTROL CARD
    // =========================================================

    private createControlCard(
        x: number,
        y: number,
        icon: string,
        title: string,
        subtitle: string,
        callback: () => void
    ): Phaser.GameObjects.Container {

        const width =
            CONFIG.layout.controlCardWidth;

        const height =
            CONFIG.layout.controlCardHeight;

        const bg = this.add.rectangle(
            0,
            0,
            width,
            height,
            CONFIG.colors.panel2,
            0.96
        );

        bg.setStrokeStyle(
            1,
            CONFIG.colors.cyan,
            0.35
        );

        // Top cyan line

        const topLine = this.add.rectangle(
            0,
            -height / 2 + 3,
            width - 14,
            2,
            CONFIG.colors.cyan,
            0.4
        );

        // Bottom accent

        const bottomLine = this.add.rectangle(
            0,
            height / 2 - 3,
            width - 26,
            1,
            CONFIG.colors.magenta,
            0.3
        );

        // Icon

        const iconText = this.add.text(
            -45,
            0,
            icon,
            {
                fontFamily: "Arial",
                fontSize: "25px",
                color: "#00ffff",
                shadow: {
                    color: "#00ffff",
                    blur: 10,
                    fill: true,
                },
            }
        )
            .setOrigin(0.5);

        // Main label

        const label = this.add.text(
            22,
            -8,
            title,
            {
                fontFamily: "Arial Black",
                fontSize: "11px",
                color: "#ffffff",
                letterSpacing: 1,
            } as Phaser.Types.GameObjects.Text.TextStyle
        )
            .setOrigin(0.5);

        // Subtitle

        const sub = this.add.text(
            22,
            13,
            subtitle,
            {
                fontFamily: "Arial",
                fontSize: "6px",
                color: "#557782",
                letterSpacing: 1,
            } as Phaser.Types.GameObjects.Text.TextStyle
        )
            .setOrigin(0.5);

        // Selected indicator

        const selectedMark =
            this.add.rectangle(
                width / 2 - 9,
                -height / 2 + 9,
                5,
                5,
                CONFIG.colors.cyan,
                0.2
            );

        // Bottom technical label

        const technical =
            this.add.text(
                width / 2 - 10,
                height / 2 - 11,
                "READY",
                {
                    fontFamily: "Arial",
                    fontSize: "5px",
                    color: "#3e6873",
                    letterSpacing: 1,
                } as Phaser.Types.GameObjects.Text.TextStyle
            )
                .setOrigin(1, 0.5);

        const container =
            this.add.container(
                x,
                y,
                [
                    bg,
                    topLine,
                    bottomLine,
                    iconText,
                    label,
                    sub,
                    selectedMark,
                    technical,
                ]
            ).setDepth(15);

        container.setData(
            "bg",
            bg
        );

        container.setData(
            "label",
            label
        );

        bg.setInteractive({
            useHandCursor: true,
        });

        this.setupButtonInteractions(
            bg,
            container,
            callback
        );

        return container;
    }

    // =========================================================
    // SEPARATOR
    // =========================================================

    private createSeparator(
        y: number
    ): void {

        const g = this.add.graphics()
            .setDepth(8);

        g.lineStyle(
            1,
            CONFIG.colors.cyan,
            0.1
        );

        g.lineBetween(
            38,
            y,
            362,
            y
        );

        g.lineStyle(
            2,
            CONFIG.colors.cyan,
            0.4
        );

        g.lineBetween(
            38,
            y,
            72,
            y
        );

        g.lineStyle(
            2,
            CONFIG.colors.magenta,
            0.35
        );

        g.lineBetween(
            328,
            y,
            362,
            y
        );
    }

    // =========================================================
    // BACK BUTTON
    // =========================================================

    private setupBackButton(): void {

        this.backButton =
            this.createBackButton(
                200,
                CONFIG.layout.backY,
                () => {

                    this.saveSettings();

                    this.scene.start(
                        "MenuScene"
                    );
                }
            );
    }

    // =========================================================
    // BACK BUTTON UI
    // =========================================================

    private createBackButton(
        x: number,
        y: number,
        callback: () => void
    ): Phaser.GameObjects.Container {

        const width =
            CONFIG.layout.backWidth;

        const height =
            CONFIG.layout.backHeight;

        const bg = this.add.rectangle(
            0,
            0,
            width,
            height,
            CONFIG.colors.panelDark,
            0.98
        );

        bg.setStrokeStyle(
            1,
            CONFIG.colors.cyan,
            0.72
        );

        // Left cyan accent

        const left = this.add.rectangle(
            -width / 2 + 5,
            0,
            4,
            height - 12,
            CONFIG.colors.cyan,
            0.9
        );

        // Right magenta accent

        const right = this.add.rectangle(
            width / 2 - 5,
            0,
            4,
            height - 12,
            CONFIG.colors.magenta,
            0.75
        );

        // Main text

        const label = this.add.text(
            0,
            0,
            "←   BACK TO MENU",
            {
                fontFamily: "Arial Black",
                fontSize: "12px",
                color: "#ffffff",
                letterSpacing: 1.1,
                shadow: {
                    color: "#00ffff",
                    blur: 8,
                    fill: true,
                },
            } as Phaser.Types.GameObjects.Text.TextStyle
        )
            .setOrigin(0.5);

        // Tiny technical text

        const tech = this.add.text(
            0,
            18,
            "RETURN TO MAIN SYSTEM",
            {
                fontFamily: "Arial",
                fontSize: "5px",
                color: "#3f6974",
                letterSpacing: 1,
            } as Phaser.Types.GameObjects.Text.TextStyle
        )
            .setOrigin(0.5);

        const container =
            this.add.container(
                x,
                y,
                [
                    bg,
                    left,
                    right,
                    label,
                    tech,
                ]
            ).setDepth(20);

        bg.setInteractive({
            useHandCursor: true,
        });

        this.setupButtonInteractions(
            bg,
            container,
            callback
        );

        return container;
    }

    // =========================================================
    // BUTTON INTERACTIONS
    // =========================================================

    private setupButtonInteractions(
        bg: Phaser.GameObjects.Rectangle,
        container: Phaser.GameObjects.Container,
        callback: () => void
    ): void {

        bg.on(
            "pointerover",
            () => {

                this.tweens.killTweensOf(
                    container
                );

                this.tweens.add({
                    targets: container,
                    scale:
                        CONFIG.animation.hoverScale,
                    duration:
                        CONFIG.animation.hoverDuration,
                    ease: "Quad.easeOut",
                });

                bg.setStrokeStyle(
                    2,
                    CONFIG.colors.magenta,
                    0.95
                );
            }
        );

        bg.on(
            "pointerout",
            () => {

                this.tweens.killTweensOf(
                    container
                );

                this.tweens.add({
                    targets: container,
                    scale: 1,
                    duration:
                        CONFIG.animation.hoverDuration,
                    ease: "Quad.easeOut",
                });

                bg.setStrokeStyle(
                    1,
                    CONFIG.colors.cyan,
                    0.7
                );
            }
        );

        let actionLocked = false;

        bg.on(
            "pointerdown",
            () => {

                // Ignore duplicate touch/pointer events for a short window.
                if (actionLocked) {
                    return;
                }

                actionLocked = true;

                if (
                    typeof navigator !== "undefined" &&
                    navigator.vibrate
                ) {
                    navigator.vibrate(10);
                }

                AudioSystem.click();

                // Keep the press animation, but never wait for it before
                // executing the actual action. This is important on mobile.
                this.tweens.killTweensOf(container);

                this.tweens.add({
                    targets: container,
                    scale:
                        CONFIG.animation.clickScale,
                    duration:
                        CONFIG.animation.clickDuration,
                    yoyo: true,
                    ease: "Quad.easeOut",
                });

                // Execute immediately on pointerdown.
                callback();

                this.time.delayedCall(350, () => {
                    actionLocked = false;
                });
            }
        );
    }

    // =========================================================
    // EVENTS
    // =========================================================

    private setupEvents(): void {

        this.input.on(
            "pointermove",
            (
                pointer: Phaser.Input.Pointer
            ) => {

                if (
                    this.isDragging &&
                    pointer.isDown
                ) {
                    this.handleDragMove(
                        pointer
                    );
                }
            }
        );

        this.input.on(
            "pointerup",
            () => {

                if (!this.isDragging) {
                    return;
                }

                this.isDragging = false;

                if (this.lastDraggedKnob) {
                    this.highlightKnob(
                        this.lastDraggedKnob,
                        false
                    );
                }

                this.lastDraggedKnob = null;

                this.saveSettings();
            }
        );

        this.input.keyboard?.on(
            "keydown-ESC",
            this.handleEscape,
            this
        );

        this.input.keyboard?.on(
            "keydown-LEFT",
            () => {
                this.adjustVolume(
                    -CONFIG.volume.step
                );
            }
        );

        this.input.keyboard?.on(
            "keydown-RIGHT",
            () => {
                this.adjustVolume(
                    CONFIG.volume.step
                );
            }
        );

        this.events.once(
            "shutdown",
            this.removeEvents,
            this
        );
    }

    // =========================================================
    // ESC
    // =========================================================

    private handleEscape(): void {

        AudioSystem.click();

        this.saveSettings();

        this.scene.start(
            "MenuScene"
        );
    }

    // =========================================================
    // DRAG
    // =========================================================

    private handleDragMove(
        pointer: Phaser.Input.Pointer
    ): void {

        if (
            !this.isDragging ||
            !this.lastDraggedKnob
        ) {
            return;
        }

        const isMusic =
            this.lastDraggedKnob ===
            this.musicKnob;

        const slider =
            isMusic
                ? this.musicSlider
                : this.sfxSlider;

        const knob =
            isMusic
                ? this.musicKnob
                : this.sfxKnob;

        const bar =
            isMusic
                ? this.musicBar
                : this.sfxBar;

        const setter =
            isMusic
                ? AudioSystem.setMusicVolume.bind(
                    AudioSystem
                )
                : AudioSystem.setSfxVolume.bind(
                    AudioSystem
                );

        const value =
            this.getSliderValue(
                pointer,
                slider
            );

        this.updateSlider(
            knob,
            bar,
            value,
            setter
        );
    }

    // =========================================================
    // KNOB HIGHLIGHT
    // =========================================================

    private highlightKnob(
        knob: Phaser.GameObjects.Arc,
        active: boolean
    ): void {

        if (active) {

            knob.setStrokeStyle(
                4,
                CONFIG.colors.magenta
            );

            this.tweens.killTweensOf(
                knob
            );

            this.tweens.add({
                targets: knob,
                scale: 1.12,
                duration: 120,
                yoyo: true,
                ease: "Sine.easeOut",
            });

        } else {

            knob.setStrokeStyle(
                3,
                CONFIG.colors.cyan
            );

            this.tweens.add({
                targets: knob,
                scale: 1,
                duration: 100,
            });
        }
    }

    // =========================================================
    // KEYBOARD VOLUME
    // =========================================================

    private adjustVolume(
        delta: number
    ): void {

        if (!this.scene.isActive()) {
            return;
        }

        const music =
            Phaser.Math.Clamp(
                AudioSystem.musicVolume +
                delta,
                0,
                1
            );

        const sfx =
            Phaser.Math.Clamp(
                AudioSystem.sfxVolume +
                delta,
                0,
                1
            );

        this.updateSlider(
            this.musicKnob,
            this.musicBar,
            music,
            AudioSystem.setMusicVolume.bind(
                AudioSystem
            )
        );

        this.updateSlider(
            this.sfxKnob,
            this.sfxBar,
            sfx,
            AudioSystem.setSfxVolume.bind(
                AudioSystem
            )
        );

        this.saveSettings();
    }

    // =========================================================
    // REFRESH
    // =========================================================

    public refresh(): void {

        const musicPercent =
            Math.round(
                AudioSystem.musicVolume * 100
            );

        const sfxPercent =
            Math.round(
                AudioSystem.sfxVolume * 100
            );

        // -----------------------------------------------------
        // Values
        // -----------------------------------------------------

        this.musicValue.setText(
            `${musicPercent}%`
        );

        this.sfxValue.setText(
            `${sfxPercent}%`
        );

        this.animateValuePop(
            this.musicValue
        );

        this.animateValuePop(
            this.sfxValue
        );

        // -----------------------------------------------------
        // Slider positions
        // -----------------------------------------------------

        const half =
            CONFIG.layout.sliderWidth / 2;

        this.musicKnob.x =
            -half +
            CONFIG.layout.sliderWidth *
            AudioSystem.musicVolume;

        this.musicBar.width =
            CONFIG.layout.sliderWidth *
            AudioSystem.musicVolume;

        this.sfxKnob.x =
            -half +
            CONFIG.layout.sliderWidth *
            AudioSystem.sfxVolume;

        this.sfxBar.width =
            CONFIG.layout.sliderWidth *
            AudioSystem.sfxVolume;

        // -----------------------------------------------------
        // Music toggle
        // -----------------------------------------------------

        this.updateToggle(
            this.musicToggleBg,
            this.musicToggleLabel,
            AudioSystem.musicEnabled
        );

        // -----------------------------------------------------
        // SFX toggle
        // -----------------------------------------------------

        this.updateToggle(
            this.sfxToggleBg,
            this.sfxToggleLabel,
            AudioSystem.sfxEnabled
        );

        // -----------------------------------------------------
        // Controls
        // -----------------------------------------------------

        const mobile =
            SaveSystem.getControl() ===
            "mobile";

        this.updateControlCard(
            this.mobileBg,
            this.mobileLabel,
            mobile
        );

        this.updateControlCard(
            this.keyboardBg,
            this.keyboardLabel,
            !mobile
        );
    }

    // =========================================================
    // TOGGLE STATE
    // =========================================================

    private updateToggle(
        bg: Phaser.GameObjects.Rectangle,
        label: Phaser.GameObjects.Text,
        enabled: boolean
    ): void {

        bg.setFillStyle(
            enabled
                ? CONFIG.colors.cyan
                : CONFIG.colors.off,
            enabled
                ? 0.11
                : 0.95
        );

        bg.setStrokeStyle(
            enabled
                ? 1
                : 1,
            enabled
                ? CONFIG.colors.cyan
                : CONFIG.colors.dim,
            0.9
        );

        label.setText(
            enabled
                ? "SYSTEM  ON"
                : "SYSTEM  OFF"
        );

        label.setColor(
            enabled
                ? "#ffffff"
                : "#58717b"
        );
    }

    // =========================================================
    // CONTROL STATE
    // =========================================================

    private updateControlCard(
        bg: Phaser.GameObjects.Rectangle,
        label: Phaser.GameObjects.Text,
        selected: boolean
    ): void {

        bg.setFillStyle(
            selected
                ? CONFIG.colors.cyan
                : CONFIG.colors.panel2,
            selected
                ? 0.13
                : 0.96
        );

        bg.setStrokeStyle(
            selected
                ? 2
                : 1,
            selected
                ? CONFIG.colors.cyan
                : CONFIG.colors.cyan,
            selected
                ? 1
                : 0.32
        );

        label.setColor(
            selected
                ? "#ffffff"
                : "#b7d0d6"
        );
    }

    // =========================================================
    // VALUE POP
    // =========================================================

    private animateValuePop(
        text: Phaser.GameObjects.Text
    ): void {

        const previous =
            this.valuePopTweens.get(
                text
            );

        if (previous) {
            previous.stop();
        }

        const tween =
            this.tweens.add({
                targets: text,
                scaleX: 1.07,
                scaleY: 1.07,
                duration: 85,
                yoyo: true,
                ease: "Quad.easeOut",
                onComplete: () => {

                    text.setScale(1);

                    this.valuePopTweens.delete(
                        text
                    );
                },
            });

        this.valuePopTweens.set(
            text,
            tween
        );
    }

    // =========================================================
    // VOLUME TOAST
    // =========================================================

    private showVolumeToast(
        message: string
    ): void {

        if (this.volumeToast) {
            this.volumeToast.destroy();
        }

        this.volumeToast =
            this.add.text(
                200,
                112,
                `[ ${message} ]`,
                {
                    fontFamily: "Arial Black",
                    fontSize: "10px",
                    color: "#00ffff",
                    backgroundColor: "#030a10",
                    padding: {
                        x: 12,
                        y: 6,
                    },
                }
            )
                .setOrigin(0.5)
                .setDepth(50);

        this.tweens.add({
            targets: this.volumeToast,
            alpha: 0,
            y: 103,
            duration: 450,
            delay: 700,
            ease: "Quad.easeOut",
            onComplete: () => {

                if (this.volumeToast) {
                    this.volumeToast.destroy();
                    this.volumeToast = null;
                }
            },
        });
    }

    // =========================================================
    // ERROR TOAST
    // =========================================================

    private showErrorToast(
        message: string
    ): void {

        if (this.volumeToast) {
            this.volumeToast.destroy();
        }

        this.volumeToast =
            this.add.text(
                200,
                112,
                message,
                {
                    fontFamily: "Arial Black",
                    fontSize: "10px",
                    color: "#ff315c",
                    backgroundColor: "#10030a",
                    padding: {
                        x: 12,
                        y: 6,
                    },
                }
            )
                .setOrigin(0.5)
                .setDepth(50);

        this.tweens.add({
            targets: this.volumeToast,
            alpha: 0,
            duration: 500,
            delay: 1600,
            onComplete: () => {

                if (this.volumeToast) {
                    this.volumeToast.destroy();
                    this.volumeToast = null;
                }
            },
        });
    }

    // =========================================================
    // SAVE
    // =========================================================

    private saveSettings(): void {

        try {

            SaveSystem.save();

                

        } catch (error) {

            console.error(
                "Failed to save settings:",
                error
            );

            this.showErrorToast(
                "ERROR // SAVE FAILED"
            );
        }
    }

    // =========================================================
    // REMOVE EVENTS
    // =========================================================

    private removeEvents(): void {

        this.input.off(
            "pointermove"
        );

        this.input.off(
            "pointerup"
        );

        this.input.keyboard?.off(
            "keydown-ESC",
            this.handleEscape,
            this
        );

        this.input.keyboard?.off(
            "keydown-LEFT"
        );

        this.input.keyboard?.off(
            "keydown-RIGHT"
        );
    }

    // =========================================================
    // SHUTDOWN
    // =========================================================

    shutdown(): void {

        this.removeEvents();

        this.tweens.killAll();

        this.valuePopTweens.clear();

        if (this.volumeToast) {
            this.volumeToast.destroy();
            this.volumeToast = null;
        }

        this.isDragging = false;
        this.lastDraggedKnob = null;
    }
}