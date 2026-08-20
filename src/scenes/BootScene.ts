
import Phaser from "phaser";

/**
 * ================================================================
 * NIGHT ROAD
 * Cinematic Boot / Intro Scene
 *
 * Game title: NIGHT ROAD
 * Creator: MATIN AHMADI
 * Telegram: @jensenhuang1963
 * ================================================================
 */

export default class BootScene extends Phaser.Scene {

    // ============================================================
    // CORE
    // ============================================================

    private loadingBar!: Phaser.GameObjects.Graphics;
    private loadingBarGlow!: Phaser.GameObjects.Graphics;
    private progressTrack!: Phaser.GameObjects.Graphics;

    private loadingText!: Phaser.GameObjects.Text;
    private percentText!: Phaser.GameObjects.Text;

    private title!: Phaser.GameObjects.Text;
    private titleGhost!: Phaser.GameObjects.Text;
    private subtitle!: Phaser.GameObjects.Text;

    private creator!: Phaser.GameObjects.Text;
    private telegram!: Phaser.GameObjects.Text;

    private skipButton!: Phaser.GameObjects.Container;

    private introMusicStarted = false;
    private transitionStarted = false;

    private particles: Phaser.GameObjects.Arc[] = [];
    private streaks: Phaser.GameObjects.Rectangle[] = [];

    private cinematicObjects: Phaser.GameObjects.GameObject[] = [];

    // ============================================================
    // CONFIG
    // ============================================================

    private readonly WIDTH = 400;
    private readonly HEIGHT = 800;

    private readonly COLORS = {
        bg: 0x020309,
        black: 0x000000,

        cyan: 0x00FFFF,
        cyanDark: 0x007C91,
        blue: 0x0088FF,

        purple: 0x7A2CFF,
        magenta: 0xFF1EDB,

        white: 0xFFFFFF,
        softWhite: 0xDDF8FF,

        panel: 0x07131D,
        panel2: 0x091B27,

        green: 0x00FF99,
        red: 0xFF315A
    };

    // ============================================================
    // CONSTRUCTOR
    // ============================================================

    constructor() {
        super("BootScene");
    }

    // ============================================================
    // PRELOAD
    // ============================================================

    preload() {

        // --------------------------------------------------------
        // CORE VEHICLES
        // --------------------------------------------------------
        // ASSET ROOT

        this.load.setPath("assets");
        this.load.image(
            "sport1",
            "assets/cars/sport1.webp"
        );

        this.load.image(
            "taxi1",
            "assets/cars/taxi1.webp"
        );

        this.load.image(
            "truck1",
            "assets/cars/truck1.webp"
        );

        this.load.image(
            "bus1",
            "assets/cars/bus1.webp"
        );

        this.load.image(
            "super1",
            "assets/cars/super1.webp"
        );

        this.load.image(
            "enemy11",
            "assets/cars/enemy11.webp"
        );

        this.load.image(
            "enemy21",
            "assets/cars/enemy21.webp"
        );

        this.load.image(
            "enemy31",
            "assets/cars/enemy31.webp"
        );

        this.load.audio(
            "enemy_pursuit",
            "assets/audio/enemy_pursuit.mp3"
        );

        

        // --------------------------------------------------------
        // ZONE VOICES
        // --------------------------------------------------------

        for (let zone = 1; zone <= 5; zone++) {

            this.load.audio(
                `zone_voice_${zone}`,
                `assets/audio/zone_voice_${zone}.mp3`
            );
        }

        // --------------------------------------------------------
        // CAMERA
        // --------------------------------------------------------

        this.cameras.main.setBackgroundColor(
            "#020309"
        );

        // --------------------------------------------------------
        // LOADING UI
        // --------------------------------------------------------

        this.createLoadingInterface();

        // --------------------------------------------------------
        // LOADER PROGRESS
        // --------------------------------------------------------

        this.load.on(
            "progress",
            (value: number) => {

                this.updateLoadingProgress(
                    Phaser.Math.Clamp(value, 0, 1)
                );
            }
        );

        // --------------------------------------------------------
        // FILE PROGRESS
        // --------------------------------------------------------

        this.load.on(
            "fileprogress",
            (file: Phaser.Loader.File) => {

                if (!this.loadingText) {
                    return;
                }

                const key = file.key
                    .replace(/_/g, " ")
                    .toUpperCase();

                this.loadingText.setText(
                    `SYSTEM LOAD  //  ${key}`
                );
            }
        );

        // --------------------------------------------------------
        // LOAD ERROR
        // --------------------------------------------------------

        this.load.on(
            "loaderror",
            (file: Phaser.Loader.File) => {

                console.warn(
                    `[BootScene] Failed to load: ${file.key}`
                );

                if (this.loadingText) {

                    this.loadingText.setText(
                        `RECOVERY MODE  //  ${file.key}`
                    );
                }
            }
        );

        // --------------------------------------------------------
        // LOAD COMPLETE
        // --------------------------------------------------------

        this.load.on(
            "complete",
            () => {

                this.updateLoadingProgress(1);

                if (this.loadingText) {

                    this.loadingText.setText(
                        "SYSTEM ONLINE  //  NIGHT ROAD"
                    );
                }
            }
        );

        // ========================================================
        // ASSET ROOT
        // ========================================================
        
        

        // ========================================================
        // INTRO
        // ========================================================

        this.load.image(
            "intro_bg",
            "intro_bg.jpg"
        );

        this.load.audio(
            "intro_music",
            "audio/intro_music.mp3"
        );

        // ========================================================
        // UI AUDIO
        // ========================================================

        this.load.audio(
            "ui_click",
            "audio/ui_click.wav"
        );

        this.load.audio(
            "purchase",
            "audio/purchase.wav"
        );

        this.load.audio(
            "crystal",
            "audio/crystal.mp3"
        );

        this.load.audio(
            "crash",
            "audio/crash.wav"
        );

        this.load.audio(
            "nitro",
            "audio/nitro.wav"
        );

        this.load.audio(
            "menu_theme",
            "audio/menu_theme.mp3"
        );

        this.load.audio(
            "game_theme",
            "audio/game_theme.mp3"
        );

        this.load.audio(
            "magnet",
            "audio/magnet.wav"
        );

        // ========================================================
        // PLAYER CARS
        // ========================================================

        this.load.image(
            "player",
            "cars/player.webp"
        );

        this.load.image(
            "taxi",
            "cars/taxi.webp"
        );

        this.load.image(
            "sport",
            "cars/sport.webp"
        );

        this.load.image(
            "super",
            "cars/super.webp"
        );

        this.load.image(
            "truck",
            "cars/truck.webp"
        );

        this.load.image(
            "bus",
            "cars/bus.webp"
        );

        // ========================================================
        // ROAD
        // ========================================================



        // ========================================================
        // ENEMY VEHICLES
        // ========================================================

        this.load.image(
            "enemy1",
            "cars/enemy1.webp"
        );

        this.load.image(
            "enemy2",
            "cars/enemy2.webp"
        );

        this.load.image(
            "enemy3",
            "cars/enemy3.webp"
        );

        // ========================================================
        // ITEMS
        // ========================================================

        this.load.image(
            "crystal",
            "items/crystal.webp"
        );

        this.load.image(
            "gold_crystal",
            "items/gold_crystal.webp"
        );

        this.load.image(
            "red_crystal",
            "items/red_crystal.webp"
        );

        this.load.image(
            "magnet",
            "items/magnet.webp"
        );
    }

    // ============================================================
    // LOADING INTERFACE
    // ============================================================

    private createLoadingInterface() {

        // --------------------------------------------------------
        // BACKGROUND
        // --------------------------------------------------------

        const bg = this.add.rectangle(
            this.WIDTH / 2,
            this.HEIGHT / 2,
            this.WIDTH,
            this.HEIGHT,
            this.COLORS.bg
        );

        bg.setDepth(0);

        // --------------------------------------------------------
        // GRID
        // --------------------------------------------------------

        const grid = this.add.graphics();

        grid.setDepth(1);

        grid.lineStyle(
            1,
            this.COLORS.cyan,
            0.035
        );

        for (let x = 0; x <= this.WIDTH; x += 32) {

            grid.lineBetween(
                x,
                0,
                x,
                this.HEIGHT
            );
        }

        for (let y = 0; y <= this.HEIGHT; y += 32) {

            grid.lineBetween(
                0,
                y,
                this.WIDTH,
                y
            );
        }

        // --------------------------------------------------------
        // TOP LIGHT
        // --------------------------------------------------------

        const glow = this.add.rectangle(
            200,
            80,
            400,
            220,
            this.COLORS.cyan,
            0.018
        );

        glow.setDepth(2);

        // --------------------------------------------------------
        // SIDE LINES
        // --------------------------------------------------------

        const lines = this.add.graphics();

        lines.setDepth(4);

        lines.lineStyle(
            2,
            this.COLORS.cyan,
            0.28
        );

        lines.lineBetween(
            18,
            80,
            18,
            720
        );

        lines.lineBetween(
            382,
            80,
            382,
            720
        );

        lines.lineStyle(
            1,
            this.COLORS.blue,
            0.22
        );

        lines.lineBetween(
            25,
            160,
            25,
            640
        );

        lines.lineBetween(
            375,
            160,
            375,
            640
        );

        // --------------------------------------------------------
        // TOP LABEL
        // --------------------------------------------------------

        const label = this.add.text(
            200,
            48,
            "NIGHT ROAD  //  SYSTEM",
            {
                fontFamily: "Arial Black",
                fontSize: "11px",
                color: "#00FFFF",
                letterSpacing: 3
            }
        );

        label
            .setOrigin(0.5)
            .setAlpha(0.65)
            .setDepth(10);

        // --------------------------------------------------------
        // STATUS
        // --------------------------------------------------------

        this.loadingText = this.add.text(
            200,
            675,
            "INITIALIZING NIGHT ROAD...",
            {
                fontFamily: "Arial Black",
                fontSize: "10px",
                color: "#00FFFF",
                letterSpacing: 1.5
            }
        );

        this.loadingText
            .setOrigin(0.5)
            .setDepth(20);

        // --------------------------------------------------------
        // TRACK
        // --------------------------------------------------------

        this.progressTrack = this.add.graphics();

        this.progressTrack.setDepth(20);

        this.progressTrack.fillStyle(
            0x07131D,
            0.96
        );

        this.progressTrack.fillRoundedRect(
            40,
            705,
            320,
            24,
            12
        );

        this.progressTrack.lineStyle(
            1,
            this.COLORS.cyan,
            0.35
        );

        this.progressTrack.strokeRoundedRect(
            40,
            705,
            320,
            24,
            12
        );

        // --------------------------------------------------------
        // GLOW BAR
        // --------------------------------------------------------

        this.loadingBarGlow =
            this.add.graphics();

        this.loadingBarGlow.setDepth(21);

        // --------------------------------------------------------
        // MAIN BAR
        // --------------------------------------------------------

        this.loadingBar =
            this.add.graphics();

        this.loadingBar.setDepth(22);

        // --------------------------------------------------------
        // PERCENT
        // --------------------------------------------------------

        this.percentText = this.add.text(
            200,
            745,
            "0%",
            {
                fontFamily: "Arial Black",
                fontSize: "14px",
                color: "#FFFFFF",
                letterSpacing: 2
            }
        );

        this.percentText
            .setOrigin(0.5)
            .setDepth(20);

        // --------------------------------------------------------
        // BUILD
        // --------------------------------------------------------

        const build = this.add.text(
            200,
            772,
            "BUILD 01.00  //  NIGHT ROAD",
            {
                fontFamily: "Arial",
                fontSize: "8px",
                color: "#58717D",
                letterSpacing: 2
            }
        );

        build
            .setOrigin(0.5)
            .setDepth(20);

        // --------------------------------------------------------
        // INITIAL
        // --------------------------------------------------------

        this.updateLoadingProgress(0);
    }

    // ============================================================
    // PROGRESS
    // ============================================================

    private updateLoadingProgress(
        value: number
    ) {

        if (
            !this.loadingBar ||
            !this.loadingBarGlow
        ) {
            return;
        }

        const progress =
            Phaser.Math.Clamp(
                value,
                0,
                1
            );

        const width =
            310 * progress;

        // --------------------------------------------------------
        // GLOW
        // --------------------------------------------------------

        this.loadingBarGlow.clear();

        if (width > 0) {

            this.loadingBarGlow.fillStyle(
                this.COLORS.cyan,
                0.10
            );

            this.loadingBarGlow.fillRoundedRect(
                45,
                699,
                width + 10,
                36,
                18
            );
        }

        // --------------------------------------------------------
        // MAIN
        // --------------------------------------------------------

        this.loadingBar.clear();

        if (width > 0) {

            this.loadingBar.fillStyle(
                this.COLORS.cyan,
                0.92
            );

            this.loadingBar.fillRoundedRect(
                45,
                708,
                width,
                18,
                9
            );

            if (width > 10) {

                this.loadingBar.fillStyle(
                    0xFFFFFF,
                    0.8
                );

                this.loadingBar.fillRoundedRect(
                    45 + width - 6,
                    709,
                    6,
                    16,
                    8
                );
            }
        }

        // --------------------------------------------------------
        // TEXT
        // --------------------------------------------------------

        if (this.percentText) {

            this.percentText.setText(
                `${Math.floor(progress * 100)}%`
            );
        }
    }

    // ============================================================
    // CREATE
    // ============================================================

    create() {

        this.transitionStarted = false;

        this.cameras.main.fadeIn(
            450,
            0,
            0,
            0
        );

        // ========================================================
        // BACKGROUND
        // ========================================================

        const bg = this.add.image(
            200,
            400,
            "intro_bg"
        );

        bg.setDepth(30);


        const texture = this.textures.get("intro_bg");

        const source = texture.getSourceImage();


        const scale = Math.max(
            400 / source.width,
            800 / source.height
        );


        bg.setScale(scale);


        bg.setAlpha(0);


        this.tweens.add({

            targets: bg,

            alpha: 1,

            duration: 1500,

            ease: "Power2.out"

        });

        // ========================================================
        // COLOR TINT
        // ========================================================

        const colorOverlay =
            this.add.rectangle(
                200,
                400,
                400,
                800,
                this.COLORS.cyan,
                0.035
            );

        colorOverlay.setDepth(31);
        colorOverlay.setAlpha(0);

        this.cinematicObjects.push(
            colorOverlay
        );

        // ========================================================
        // DARK CINEMATIC VIGNETTE
        // ========================================================

        const darkOverlay =
            this.add.rectangle(
                200,
                400,
                400,
                800,
                this.COLORS.black,
                0.58
            );

        darkOverlay.setDepth(32);
        darkOverlay.setAlpha(0);

        this.cinematicObjects.push(
            darkOverlay
        );

        // ========================================================
        // TOP / BOTTOM CINEMA BARS
        // ========================================================

        const topBar =
            this.add.rectangle(
                200,
                -35,
                400,
                70,
                0x000000,
                0.95
            );

        const bottomBar =
            this.add.rectangle(
                200,
                835,
                400,
                70,
                0x000000,
                0.95
            );

        topBar.setDepth(90);
        bottomBar.setDepth(90);

        this.cinematicObjects.push(
            topBar,
            bottomBar
        );

        // ========================================================
        // DIGITAL GRID
        // ========================================================

        const grid =
            this.createCinematicGrid();

        grid.setDepth(33);
        grid.setAlpha(0);

        this.cinematicObjects.push(grid);

        // ========================================================
        // HORIZONTAL NEON SCANNERS
        // ========================================================

        const scanner =
            this.add.rectangle(
                200,
                120,
                390,
                2,
                this.COLORS.cyan,
                0.45
            );

        scanner.setDepth(60);
        scanner.setAlpha(0);

        this.cinematicObjects.push(
            scanner
        );

        this.tweens.add({

            targets: scanner,

            y: 700,

            duration: 1900,

            repeat: -1,

            ease: "Linear",

            delay: 1000
        });

        // ========================================================
        // PARTICLES
        // ========================================================

        this.createParticles();

        // ========================================================
        // SPEED STREAKS
        // ========================================================

        this.createSpeedStreaks();

        // ========================================================
        // CORNER HUD
        // ========================================================

        this.createHUD();

        // ========================================================
        // GLITCH TITLE
        // ========================================================

        this.titleGhost =
            this.add.text(
                200,
                292,
                "NIGHT ROAD",
                {
                    fontFamily: "Arial Black",
                    fontSize: "47px",
                    color: "#FF1EDB",
                    stroke: "#FF1EDB",
                    strokeThickness: 2,
                    letterSpacing: 2
                }
            );

        this.titleGhost
            .setOrigin(0.5)
            .setDepth(45)
            .setAlpha(0);

        this.title =
            this.add.text(
                200,
                286,
                "NIGHT ROAD",
                {
                    fontFamily: "Arial Black",
                    fontSize: "47px",
                    color: "#FFFFFF",
                    stroke: "#00141C",
                    strokeThickness: 7,
                    letterSpacing: 2,
                    shadow: {
                        color: "#00FFFF",
                        blur: 28,
                        fill: true,
                        offsetX: 0,
                        offsetY: 0
                    }
                }
            );

        this.title
            .setOrigin(0.5)
            .setDepth(50)
            .setAlpha(0)
            .setScale(0.55);

        // ========================================================
        // TITLE CYAN SHADOW
        // ========================================================

        const cyanShadow =
            this.add.text(
                200,
                291,
                "NIGHT ROAD",
                {
                    fontFamily: "Arial Black",
                    fontSize: "47px",
                    color: "#00FFFF",
                    
                    letterSpacing: 2
                }
            );

        cyanShadow
            .setOrigin(0.5)
            .setDepth(44)
            .setAlpha(0);

        // ========================================================
        // TITLE UNDERLINE
        // ========================================================

        const titleLine =
            this.add.graphics();

        titleLine.setDepth(48);
        titleLine.setAlpha(0);

        titleLine.lineStyle(
            2,
            this.COLORS.cyan,
            0.9
        );

        titleLine.lineBetween(
            55,
            330,
            345,
            330
        );

        titleLine.lineStyle(
            1,
            this.COLORS.magenta,
            0.65
        );

        titleLine.lineBetween(
            105,
            336,
            295,
            336
        );

        // ========================================================
        // SUBTITLE
        // ========================================================

        this.subtitle =
            this.add.text(
                200,
                356,
                "DRIVE BEYOND THE NEON",
                {
                    fontFamily: "Arial Black",
                    fontSize: "11px",
                    color: "#00FFFF",
                    letterSpacing: 4,
                    shadow: {
                        color: "#00FFFF",
                        blur: 10,
                        fill: true
                    }
                }
            );

        this.subtitle
            .setOrigin(0.5)
            .setDepth(50)
            .setAlpha(0);

        // ========================================================
        // CREATOR PANEL
        // ========================================================

        const creatorPanel =
            this.createPanel(
                200,
                440,
                300,
                92,
                this.COLORS.cyan
            );

        creatorPanel.setDepth(45);
        creatorPanel.setAlpha(0);

        // ========================================================
        // CREATOR LABEL
        // ========================================================

        const creatorLabel =
            this.add.text(
                200,
                415,
                "CREATED BY",
                {
                    fontFamily: "Arial Black",
                    fontSize: "9px",
                    color: "#00FFFF",
                    letterSpacing: 3
                }
            );

        creatorLabel
            .setOrigin(0.5)
            .setDepth(52)
            .setAlpha(0);

        // ========================================================
        // CREATOR
        // ========================================================

        this.creator =
            this.add.text(
                200,
                448,
                "MATIN AHMADI",
                {
                    fontFamily: "Arial Black",
                    fontSize: "19px",
                    color: "#FFFFFF",
                    letterSpacing: 3,
                    shadow: {
                        color: "#00FFFF",
                        blur: 18,
                        fill: true
                    }
                }
            );

        this.creator
            .setOrigin(0.5)
            .setDepth(52)
            .setAlpha(0)
            .setScale(0.85);

        // ========================================================
        // TELEGRAM PANEL
        // ========================================================

        const telegramPanel =
            this.createPanel(
                200,
                550,
                300,
                74,
                this.COLORS.blue
            );

        telegramPanel.setDepth(45);
        telegramPanel.setAlpha(0);

        // ========================================================
        // TELEGRAM LABEL
        // ========================================================

        const telegramLabel =
            this.add.text(
                200,
                533,
                "CONTACT // TELEGRAM",
                {
                    fontFamily: "Arial Black",
                    fontSize: "8px",
                    color: "#5CBFFF",
                    letterSpacing: 2
                }
            );

        telegramLabel
            .setOrigin(0.5)
            .setDepth(52)
            .setAlpha(0);

        // ========================================================
        // TELEGRAM
        // ========================================================

        this.telegram =
            this.add.text(
                200,
                565,
                "@jensenhuang1963",
                {
                    fontFamily: "Arial Black",
                    fontSize: "15px",
                    color: "#FFFFFF",
                    letterSpacing: 2,
                    shadow: {
                        color: "#0088FF",
                        blur: 14,
                        fill: true
                    }
                }
            );

        this.telegram
            .setOrigin(0.5)
            .setDepth(52)
            .setAlpha(0)
            .setScale(0.85);

        // ========================================================
        // SYSTEM STATUS
        // ========================================================

        const status =
            this.add.text(
                200,
                620,
                "SYSTEM STATUS  ●  ONLINE",
                {
                    fontFamily: "Arial Black",
                    fontSize: "9px",
                    color: "#00FF99",
                    letterSpacing: 2
                }
            );

        status
            .setOrigin(0.5)
            .setDepth(52)
            .setAlpha(0);

        // ========================================================
        // SKIP
        // ========================================================

        this.createSkipButton();

        // ========================================================
        // LOADING UI FADE
        // ========================================================

        this.tweens.add({

            targets: [
                this.progressTrack,
                this.loadingBar,
                this.loadingBarGlow,
                this.loadingText,
                this.percentText
            ],

            alpha: 0,

            duration: 400,

            ease: "Power2.in"
        });

        // ========================================================
        // BACKGROUND REVEAL
        // ========================================================

        this.tweens.add({

            targets: bg,

            alpha: 1,

            scale: 1,

            duration: 1500,

            ease: "Power2.out"
        });

        // ========================================================
        // COLOR
        // ========================================================

        this.tweens.add({

            targets: colorOverlay,

            alpha: 1,

            duration: 1600
        });

        // ========================================================
        // DARK
        // ========================================================

        this.tweens.add({

            targets: darkOverlay,

            alpha: 1,

            duration: 1100
        });

        // ========================================================
        // CINEMA BARS
        // ========================================================

        this.tweens.add({

            targets: topBar,

            y: 20,

            duration: 800,

            ease: "Power3.out"
        });

        this.tweens.add({

            targets: bottomBar,

            y: 780,

            duration: 800,

            ease: "Power3.out"
        });

        // ========================================================
        // GRID
        // ========================================================

        this.tweens.add({

            targets: grid,

            alpha: 1,

            duration: 1200
        });

        // ========================================================
        // TITLE GHOST
        // ========================================================

        this.tweens.add({

            targets: this.titleGhost,

            alpha: 0.32,

            x: 203,

            duration: 120,

            delay: 500,

            ease: "Power2.out"
        });

        this.time.delayedCall(
            650,
            () => {

                if (this.titleGhost) {

                    this.tweens.add({

                        targets: this.titleGhost,

                        x: 200,

                        alpha: 0.12,

                        duration: 180
                    });
                }
            }
        );

        // ========================================================
        // MAIN TITLE
        // ========================================================

        this.tweens.add({

            targets: this.title,

            alpha: 1,

            scale: 1,

            duration: 1100,

            delay: 450,

            ease: "Back.out"
        });

        // ========================================================
        // TITLE SHADOW PULSE
        // ========================================================

        this.tweens.add({

            targets: cyanShadow,

            alpha: 0.22,

            duration: 800,

            delay: 700,

            yoyo: true,

            repeat: -1,

            ease: "Sine.easeInOut"
        });

        // ========================================================
        // TITLE LINE
        // ========================================================

        this.tweens.add({

            targets: titleLine,

            alpha: 1,

            duration: 600,

            delay: 1100,

            ease: "Power2.out"
        });

        // ========================================================
        // SUBTITLE
        // ========================================================

        this.tweens.add({

            targets: this.subtitle,

            alpha: 1,

            y: 352,

            duration: 700,

            delay: 1250,

            ease: "Power2.out"
        });

        // ========================================================
        // CREATOR PANEL
        // ========================================================

        this.tweens.add({

            targets: creatorPanel,

            alpha: 1,

            y: 438,

            duration: 700,

            delay: 1500,

            ease: "Power3.out"
        });

        // ========================================================
        // CREATOR LABEL
        // ========================================================

        this.tweens.add({

            targets: creatorLabel,

            alpha: 1,

            duration: 500,

            delay: 1600
        });

        // ========================================================
        // CREATOR
        // ========================================================

        this.tweens.add({

            targets: this.creator,

            alpha: 1,

            scale: 1,

            duration: 750,

            delay: 1650,

            ease: "Back.out"
        });

        // ========================================================
        // TELEGRAM PANEL
        // ========================================================

        this.tweens.add({

            targets: telegramPanel,

            alpha: 1,

            duration: 700,

            delay: 1900,

            ease: "Power3.out"
        });

        // ========================================================
        // TELEGRAM LABEL
        // ========================================================

        this.tweens.add({

            targets: telegramLabel,

            alpha: 1,

            duration: 500,

            delay: 1980
        });

        // ========================================================
        // TELEGRAM
        // ========================================================

        this.tweens.add({

            targets: this.telegram,

            alpha: 1,

            scale: 1,

            duration: 700,

            delay: 2020,

            ease: "Back.out"
        });

        // ========================================================
        // STATUS
        // ========================================================

        this.tweens.add({

            targets: status,

            alpha: 1,

            duration: 600,

            delay: 2300
        });

        // ========================================================
        // TITLE BREATHING
        // ========================================================

        this.tweens.add({

            targets: this.title,

            scaleX: 1.018,

            scaleY: 1.018,

            duration: 1500,

            repeat: -1,

            yoyo: true,

            ease: "Sine.easeInOut"
        });

        // ========================================================
        // RANDOM GLITCH
        // ========================================================

        this.createTitleGlitch();

        // ========================================================
        // MUSIC
        // ========================================================

        this.startIntroMusic();

        // ========================================================
        // AUTO TRANSITION
        // ========================================================

        this.time.delayedCall(
            6500,
            () => {

                this.goToMenu();
            }
        );

        // ========================================================
        // POINTER
        // ========================================================

        this.input.once(
            "pointerdown",
            () => {

                this.unlockAudio();
            }
        );

        // ========================================================
        // KEYBOARD
        // ========================================================

        this.input.keyboard?.once(
            "keydown-SPACE",
            () => {

                this.unlockAudio();
                this.goToMenu();
            }
        );

        this.input.keyboard?.once(
            "keydown-ENTER",
            () => {

                this.unlockAudio();
                this.goToMenu();
            }
        );
    }

    // ============================================================
    // CINEMATIC GRID
    // ============================================================

    private createCinematicGrid():
        Phaser.GameObjects.Graphics {

        const grid =
            this.add.graphics();

        grid.lineStyle(
            1,
            this.COLORS.cyan,
            0.045
        );

        for (
            let x = 0;
            x <= this.WIDTH;
            x += 25
        ) {

            grid.lineBetween(
                x,
                0,
                x,
                this.HEIGHT
            );
        }

        for (
            let y = 0;
            y <= this.HEIGHT;
            y += 25
        ) {

            grid.lineBetween(
                0,
                y,
                this.WIDTH,
                y
            );
        }

        return grid;
    }

    // ============================================================
    // PARTICLES
    // ============================================================

    private createParticles() {

        for (let i = 0; i < 42; i++) {

            const x =
                Phaser.Math.Between(
                    8,
                    392
                );

            const y =
                Phaser.Math.Between(
                    60,
                    750
                );

            const radius =
                Phaser.Math.FloatBetween(
                    0.6,
                    2.4
                );

            const color =
                i % 5 === 0
                    ? this.COLORS.magenta
                    : i % 2 === 0
                        ? this.COLORS.cyan
                        : this.COLORS.white;

            const particle =
                this.add.circle(
                    x,
                    y,
                    radius,
                    color,
                    Phaser.Math.FloatBetween(
                        0.15,
                        0.65
                    )
                );

            particle.setDepth(38);

            this.particles.push(
                particle
            );

            const distance =
                Phaser.Math.Between(
                    70,
                    190
                );

            const duration =
                Phaser.Math.Between(
                    1400,
                    3000
                );

            this.tweens.add({

                targets: particle,

                y: y - distance,

                alpha: 0,

                duration,

                repeat: -1,

                delay:
                    Phaser.Math.Between(
                        0,
                        1800
                    ),

                ease: "Linear",

                onRepeat: () => {

                    particle.x =
                        Phaser.Math.Between(
                            8,
                            392
                        );

                    particle.y =
                        Phaser.Math.Between(
                            100,
                            760
                        );

                    particle.alpha =
                        Phaser.Math.FloatBetween(
                            0.15,
                            0.65
                        );
                }
            });
        }
    }

    // ============================================================
    // SPEED STREAKS
    // ============================================================

    private createSpeedStreaks() {

        for (let i = 0; i < 16; i++) {

            const x =
                Phaser.Math.Between(
                    15,
                    385
                );

            const y =
                Phaser.Math.Between(
                    80,
                    740
                );

            const width =
                Phaser.Math.Between(
                    1,
                    3
                );

            const height =
                Phaser.Math.Between(
                    20,
                    100
                );

            const streak =
                this.add.rectangle(
                    x,
                    y,
                    width,
                    height,
                    i % 3 === 0
                        ? this.COLORS.magenta
                        : this.COLORS.cyan,
                    Phaser.Math.FloatBetween(
                        0.08,
                        0.28
                    )
                );

            streak.setDepth(37);

            this.streaks.push(
                streak
            );

            this.tweens.add({

                targets: streak,

                y: y + Phaser.Math.Between(
                    100,
                    260
                ),

                alpha: 0,

                duration: Phaser.Math.Between(
                    700,
                    1500
                ),

                repeat: -1,

                delay: Phaser.Math.Between(
                    0,
                    1200
                ),

                ease: "Power2.in",

                onRepeat: () => {

                    streak.x =
                        Phaser.Math.Between(
                            10,
                            390
                        );

                    streak.y =
                        Phaser.Math.Between(
                            -100,
                            650
                        );

                    streak.alpha =
                        Phaser.Math.FloatBetween(
                            0.08,
                            0.28
                        );
                }
            });
        }
    }

    // ============================================================
    // HUD
    // ============================================================

    private createHUD() {

        const hud =
            this.add.graphics();

        hud.setDepth(42);
        hud.setAlpha(0);

        // Top left
        hud.lineStyle(
            1,
            this.COLORS.cyan,
            0.45
        );

        hud.lineBetween(
            30,
            90,
            95,
            90
        );

        hud.lineBetween(
            30,
            90,
            30,
            115
        );

        // Top right
        hud.lineBetween(
            305,
            90,
            370,
            90
        );

        hud.lineBetween(
            370,
            90,
            370,
            115
        );

        // Bottom left
        hud.lineBetween(
            30,
            685,
            85,
            685
        );

        hud.lineBetween(
            30,
            660,
            30,
            685
        );

        // Bottom right
        hud.lineBetween(
            315,
            685,
            370,
            685
        );

        hud.lineBetween(
            370,
            660,
            370,
            685
        );

        const leftText =
            this.add.text(
                38,
                98,
                "NR // 01",
                {
                    fontFamily: "Arial Black",
                    fontSize: "7px",
                    color: "#00FFFF",
                    letterSpacing: 2
                }
            );

        leftText
            .setDepth(43)
            .setAlpha(0);

        const rightText =
            this.add.text(
                362,
                98,
                "ONLINE",
                {
                    fontFamily: "Arial Black",
                    fontSize: "7px",
                    color: "#00FF99",
                    letterSpacing: 2
                }
            );

        rightText
            .setOrigin(1, 0)
            .setDepth(43)
            .setAlpha(0);

        this.tweens.add({

            targets: [
                hud,
                leftText,
                rightText
            ],

            alpha: 1,

            duration: 1000,

            delay: 700
        });
    }

    // ============================================================
    // PANEL
    // ============================================================

    private createPanel(
        x: number,
        y: number,
        width: number,
        height: number,
        accent: number
    ): Phaser.GameObjects.Container {

        const container =
            this.add.container(
                x,
                y
            );

        const bg =
            this.add.rectangle(
                0,
                0,
                width,
                height,
                this.COLORS.panel,
                0.86
            );

        bg.setStrokeStyle(
            1,
            accent,
            0.35
        );

        const glow =
            this.add.rectangle(
                0,
                -height / 2 + 2,
                width - 22,
                2,
                accent,
                0.55
            );

        const left =
            this.add.rectangle(
                -width / 2 + 5,
                0,
                3,
                height - 18,
                accent,
                0.55
            );

        const right =
            this.add.rectangle(
                width / 2 - 5,
                0,
                3,
                height - 18,
                accent,
                0.25
            );

        container.add([
            bg,
            glow,
            left,
            right
        ]);

        return container;
    }

    // ============================================================
    // TITLE GLITCH
    // ============================================================

    private createTitleGlitch() {

        this.time.addEvent({

            delay: 1700,

            loop: true,

            callback: () => {

                if (
                    this.transitionStarted ||
                    !this.title ||
                    !this.titleGhost
                ) {
                    return;
                }

                const offset =
                    Phaser.Math.Between(
                        2,
                        6
                    );

                this.titleGhost.setAlpha(
                    Phaser.Math.FloatBetween(
                        0.15,
                        0.38
                    )
                );

                this.titleGhost.x =
                    200 - offset;

                this.title.x =
                    200 + offset;

                this.time.delayedCall(
                    Phaser.Math.Between(
                        50,
                        120
                    ),
                    () => {

                        if (!this.title) {
                            return;
                        }

                        this.title.x = 200;

                        if (this.titleGhost) {

                            this.titleGhost.x = 200;

                            this.titleGhost.setAlpha(
                                0.08
                            );
                        }
                    }
                );
            }
        });
    }

    // ============================================================
    // SKIP BUTTON
    // ============================================================

    private createSkipButton() {

        const container =
            this.add.container(
                200,
                735
            );

        container.setDepth(100);
        container.setAlpha(0);
        container.setScale(0.85);

        const glow =
            this.add.rectangle(
                0,
                0,
                154,
                48,
                this.COLORS.cyan,
                0.06
            );

        const bg =
            this.add.rectangle(
                0,
                0,
                145,
                42,
                this.COLORS.panel,
                0.95
            );

        bg.setStrokeStyle(
            1,
            this.COLORS.cyan,
            0.65
        );

        const left =
            this.add.rectangle(
                -68,
                0,
                3,
                26,
                this.COLORS.cyan,
                0.8
            );

        const right =
            this.add.rectangle(
                68,
                0,
                3,
                26,
                this.COLORS.cyan,
                0.8
            );

        const label =
            this.add.text(
                0,
                0,
                "SKIP  //  ENTER",
                {
                    fontFamily: "Arial Black",
                    fontSize: "10px",
                    color: "#FFFFFF",
                    letterSpacing: 2
                }
            );

        label.setOrigin(0.5);

        container.add([
            glow,
            bg,
            left,
            right,
            label
        ]);

        this.skipButton =
            container;

        this.tweens.add({

            targets: container,

            alpha: 1,

            scale: 1,

            duration: 650,

            delay: 2600,

            ease: "Back.out"
        });

        // --------------------------------------------------------
        // INTERACTION
        // --------------------------------------------------------

        bg.setInteractive({
            useHandCursor: true
        });

        bg.on(
            "pointerover",
            () => {

                bg.setFillStyle(
                    0x00313D,
                    0.98
                );

                this.tweens.add({

                    targets: container,

                    scale: 1.06,

                    duration: 120,

                    ease: "Power2.out"
                });
            }
        );

        bg.on(
            "pointerout",
            () => {

                bg.setFillStyle(
                    this.COLORS.panel,
                    0.95
                );

                this.tweens.add({

                    targets: container,

                    scale: 1,

                    duration: 120
                });
            }
        );

        bg.on(
            "pointerdown",
            () => {

                this.unlockAudio();

                this.playClick();

                this.goToMenu();
            }
        );

        // --------------------------------------------------------
        // PULSE
        // --------------------------------------------------------

        this.tweens.add({

            targets: glow,

            alpha: 0.18,

            scaleX: 1.06,

            scaleY: 1.08,

            duration: 1000,

            repeat: -1,

            yoyo: true,

            ease: "Sine.easeInOut"
        });
    }

    // ============================================================
    // AUDIO
    // ============================================================

    private startIntroMusic() {

        if (this.introMusicStarted) {
            return;
        }

        try {

            if (
                this.sound &&
                this.cache.audio.exists(
                    "intro_music"
                )
            ) {

                this.sound.play(
                    "intro_music",
                    {
                        volume: 0.55,
                        loop: false
                    }
                );

                this.introMusicStarted = true;
            }

        } catch {

            console.warn(
                "[BootScene] Intro music waiting for user interaction."
            );
        }
    }

    // ============================================================
    // AUDIO UNLOCK
    // ============================================================

    private unlockAudio() {

        try {

            const soundManager =
                this.sound as
                    Phaser.Sound.BaseSoundManager & {
                        context?: AudioContext
                    };

            if (
                soundManager.context &&
                soundManager.context.state ===
                    "suspended"
            ) {

                soundManager.context
                    .resume()
                    .catch(() => {});
            }

        } catch {

            console.warn(
                "[BootScene] Audio unlock failed."
            );
        }

        if (!this.introMusicStarted) {

            this.startIntroMusic();
        }
    }

    // ============================================================
    // CLICK SOUND
    // ============================================================

    private playClick() {

        try {

            if (
                this.cache.audio.exists(
                    "ui_click"
                )
            ) {

                this.sound.play(
                    "ui_click",
                    {
                        volume: 0.45
                    }
                );
            }

        } catch {
            // Ignore UI sound errors.
        }
    }

    // ============================================================
    // TRANSITION
    // ============================================================

    private goToMenu() {

        if (this.transitionStarted) {
            return;
        }

        this.transitionStarted = true;

        // --------------------------------------------------------
        // DISABLE SKIP
        // --------------------------------------------------------

        if (this.skipButton) {

            this.skipButton.disableInteractive();
        }

        // --------------------------------------------------------
        // STOP PARTICLES
        // --------------------------------------------------------

        for (
            const particle of this.particles
        ) {

            this.tweens.killTweensOf(
                particle
            );
        }

        for (
            const streak of this.streaks
        ) {

            this.tweens.killTweensOf(
                streak
            );
        }

        // --------------------------------------------------------
        // FLASH
        // --------------------------------------------------------

        const flash =
            this.add.rectangle(
                200,
                400,
                400,
                800,
                0xFFFFFF,
                0
            );

        flash.setDepth(200);

        this.tweens.add({

            targets: flash,

            alpha: 0.3,

            duration: 110,

            yoyo: true,

            ease: "Power2.out"
        });

        // --------------------------------------------------------
        // DIGITAL WIPE
        // --------------------------------------------------------

        const wipe =
            this.add.rectangle(
                200,
                400,
                400,
                800,
                this.COLORS.cyan,
                0
            );

        wipe.setDepth(190);

        this.tweens.add({

            targets: wipe,

            alpha: 0.12,

            duration: 180,

            yoyo: true
        });

        // --------------------------------------------------------
        // TITLE EXIT
        // --------------------------------------------------------

        const exitObjects = [
            this.title,
            this.titleGhost,
            this.subtitle,
            this.creator,
            this.telegram,
            this.skipButton
        ];

        this.tweens.add({

            targets: exitObjects,

            alpha: 0,

            scale: 0.88,

            duration: 420,

            ease: "Power3.in"
        });

        // --------------------------------------------------------
        // CAMERA ZOOM
        // --------------------------------------------------------

        this.tweens.add({

            targets: this.cameras.main,

            zoom: 1.06,

            duration: 600,

            ease: "Power2.in"
        });

        // --------------------------------------------------------
        // CAMERA FADE
        // --------------------------------------------------------

        this.cameras.main.fadeOut(
            650,
            0,
            0,
            0
        );

        // --------------------------------------------------------
        // STOP MUSIC
        // --------------------------------------------------------

        this.time.delayedCall(
            500,
            () => {

                try {

                    this.sound.stopByKey(
                        "intro_music"
                    );

                } catch {
                    // Ignore.
                }
            }
        );

        // --------------------------------------------------------
        // MENU
        // --------------------------------------------------------

        this.time.delayedCall(
            720,
            () => {

                if (
                    this.scene.isActive(
                        "BootScene"
                    )
                ) {

                    this.scene.start(
                        "MenuScene"
                    );
                }
            }
        );
    }

    // ============================================================
    // SHUTDOWN
    // ============================================================

    shutdown() {

        this.transitionStarted = true;

        this.tweens.killAll();

        this.time.removeAllEvents();

        for (
            const particle of this.particles
        ) {

            if (particle.active) {
                particle.destroy();
            }
        }

        for (
            const streak of this.streaks
        ) {

            if (streak.active) {
                streak.destroy();
            }
        }

        this.particles = [];
        this.streaks = [];
        this.cinematicObjects = [];
    }

    // ============================================================
    // DESTROY
    // ============================================================

    destroy() {

        this.tweens.killAll();

        this.time.removeAllEvents();

        this.particles = [];
        this.streaks = [];
        this.cinematicObjects = [];
    }
}
