import Phaser from "phaser";
import GarageSystem from "../systems/GarageSystem";
import SaveSystem from "../systems/SaveSystem";
import AudioSystem from "../systems/AudioSystem";

// ============================================================
// NOVA OVERDRIVE
// PREMIUM CYBERPUNK GARAGE
// UI REWORK + SAFER SCENE LIFECYCLE
// ============================================================

const CONFIG = {
    colors: {
        bg: 0x03070c,
        panel: 0x07131c,
        panelDark: 0x040b11,
        panelLight: 0x0a1c27,

        cyan: 0x00ffff,
        cyanSoft: 0x49ffff,
        cyanDark: 0x006b78,

        magenta: 0xff00d9,
        magentaDark: 0x76005f,

        green: 0x00ff88,
        orange: 0xff8a00,
        gold: 0xffd700,
        red: 0xff315c,

        white: 0xffffff,
        text: 0xe9fbff,
        muted: 0x63838e,
        dim: 0x29434d,

        black: 0x000000,
    },

    layout: {
        width: 400,
        height: 800,

        headerY: 52,

        carCenterX: 200,
        carCenterY: 272,

        panelX: 200,
        panelY: 505,
        panelWidth: 350,
        panelHeight: 270,

        statsLeft: 58,
        statsRight: 342,

        buttonY: 684,

        navY: 292,

        menuY: 764,
    },

    animation: {
        fast: 90,
        normal: 180,
        slow: 420,

        hoverScale: 1.035,
        pressScale: 0.94,
    },

    stats: {
        max: 200,
        barWidth: 210,
        barHeight: 7,
    },

    input: {
        clickLock: 180,
    },
};

type StatColor = "cyan" | "orange" | "green";

export default class GarageScene extends Phaser.Scene {

    // ========================================================
    // SYSTEMS
    // ========================================================

    private garage!: GarageSystem;

    private cars: any[] = [];

    private selectedIndex = 0;

    // ========================================================
    // MAIN CAR
    // ========================================================

    private carImage!: Phaser.GameObjects.Image;

    private carGlow!: Phaser.GameObjects.Ellipse;

    private carShadow!: Phaser.GameObjects.Ellipse;

    private lockIcon!: Phaser.GameObjects.Text;

    private priceCard!: Phaser.GameObjects.Rectangle;

    private priceLabel!: Phaser.GameObjects.Text;

    // ========================================================
    // HEADER
    // ========================================================

    private crystalText!: Phaser.GameObjects.Text;

    private title!: Phaser.GameObjects.Text;

    private subtitle!: Phaser.GameObjects.Text;

    // ========================================================
    // INFORMATION
    // ========================================================

    private nameText!: Phaser.GameObjects.Text;

    private levelText!: Phaser.GameObjects.Text;

    private speedValueText!: Phaser.GameObjects.Text;

    private nitroValueText!: Phaser.GameObjects.Text;

    private handlingValueText!: Phaser.GameObjects.Text;

    // ========================================================
    // STAT BARS
    // ========================================================

    private speedBar!: Phaser.GameObjects.Rectangle;

    private nitroBar!: Phaser.GameObjects.Rectangle;

    private handlingBar!: Phaser.GameObjects.Rectangle;

    // ========================================================
    // BUTTONS
    // ========================================================

    private buyBox!: Phaser.GameObjects.Container;

    private upgradeBox!: Phaser.GameObjects.Container;

    private selectBox!: Phaser.GameObjects.Container;

    private leftButton!: Phaser.GameObjects.Container;

    private rightButton!: Phaser.GameObjects.Container;

    private menuButton!: Phaser.GameObjects.Container;

    // ========================================================
    // BUTTON LABELS
    // ========================================================

    private buyText!: Phaser.GameObjects.Text;

    private upgradeText!: Phaser.GameObjects.Text;

    private selectText!: Phaser.GameObjects.Text;

    // ========================================================
    // MESSAGE
    // ========================================================

    private message!: Phaser.GameObjects.Text;

    // ========================================================
    // STATE
    // ========================================================

    private displayCrystal = 0;

    private interactionLocked = false;

    private isChangingCar = false;

    // ========================================================
    // CONSTRUCTOR
    // ========================================================

    constructor() {
        super("GarageScene");
    }

    // ========================================================
    // PRELOAD
    // ========================================================

    preload(): void {

        if (!this.textures.exists("garage_bg")) {

            this.load.image(
                "garage_bg",
                "/assets/menu_bg.png"
            );

        }
    }

    // ========================================================
    // CREATE
    // ========================================================

    create(): void {

        SaveSystem.load();

        AudioSystem.init(this);

        AudioSystem.playMenuMusic();

        this.garage = new GarageSystem();

        this.cars = this.garage.getCars();

        this.displayCrystal =
            SaveSystem.getCrystals();

        this.buildBackground();

        this.buildHeader();

        this.buildCarDisplay();

        this.buildInformationPanel();

        this.buildNavigation();

        this.buildActionButtons();

        this.buildMenuButton();

        this.setupKeyboard();

        this.refresh();

        this.events.once(
            "shutdown",
            this.shutdown,
            this
        );
    }

    // ========================================================
    // BACKGROUND
    // ========================================================

    private buildBackground(): void {

        if (this.textures.exists("garage_bg")) {

            const bg = this.add.image(
                200,
                400,
                "garage_bg"
            );

            bg.setDisplaySize(
                400,
                800
            );

            bg.setDepth(-30);
        }

        this.add.rectangle(
            200,
            400,
            400,
            800,
            CONFIG.colors.bg,
            0.58
        )
            .setDepth(-29);

        // ----------------------------------------------------
        // Atmosphere
        // ----------------------------------------------------

        const cyanGlow =
            this.add.ellipse(
                70,
                280,
                340,
                340,
                CONFIG.colors.cyan,
                0.035
            )
                .setDepth(-28);

        const magentaGlow =
            this.add.ellipse(
                350,
                620,
                300,
                300,
                CONFIG.colors.magenta,
                0.025
            )
                .setDepth(-28);

        this.tweens.add({
            targets: cyanGlow,
            scale: 1.15,
            alpha: 0.06,
            duration: 2400,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        });

        this.tweens.add({
            targets: magentaGlow,
            scale: 1.12,
            alpha: 0.045,
            duration: 3000,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        });

        // ----------------------------------------------------
        // Grid
        // ----------------------------------------------------

        const grid =
            this.add.graphics()
                .setDepth(-25);

        grid.lineStyle(
            1,
            CONFIG.colors.cyan,
            0.025
        );

        for (
            let x = 12;
            x <= 388;
            x += 25
        ) {

            grid.lineBetween(
                x,
                0,
                x,
                800
            );
        }

        for (
            let y = 0;
            y <= 800;
            y += 25
        ) {

            grid.lineBetween(
                0,
                y,
                400,
                y
            );
        }

        // ----------------------------------------------------
        // Scanlines
        // ----------------------------------------------------

        const scan =
            this.add.graphics()
                .setDepth(-24);

        scan.lineStyle(
            1,
            CONFIG.colors.cyan,
            0.012
        );

        for (
            let y = 0;
            y < 800;
            y += 6
        ) {

            scan.lineBetween(
                0,
                y,
                400,
                y
            );
        }

        // ----------------------------------------------------
        // Corner brackets
        // ----------------------------------------------------

        const corners =
            this.add.graphics()
                .setDepth(-10);

        corners.lineStyle(
            2,
            CONFIG.colors.cyan,
            0.45
        );

        // Top left
        corners.lineBetween(14, 16, 46, 16);
        corners.lineBetween(14, 16, 14, 46);

        // Top right
        corners.lineBetween(354, 16, 386, 16);
        corners.lineBetween(386, 16, 386, 46);

        // Bottom left
        corners.lineBetween(14, 754, 14, 784);
        corners.lineBetween(14, 784, 46, 784);

        // Bottom right
        corners.lineBetween(354, 784, 386, 784);
        corners.lineBetween(386, 754, 386, 784);

        corners.lineStyle(
            1,
            CONFIG.colors.magenta,
            0.5
        );

        corners.lineBetween(
            24,
            28,
            42,
            28
        );

        corners.lineBetween(
            358,
            28,
            376,
            28
        );

        // ----------------------------------------------------
        // Side HUD lines
        // ----------------------------------------------------

        const hud =
            this.add.graphics()
                .setDepth(-8);

        hud.lineStyle(
            1,
            CONFIG.colors.cyan,
            0.14
        );

        hud.lineBetween(
            15,
            116,
            65,
            116
        );

        hud.lineBetween(
            335,
            116,
            385,
            116
        );

        hud.lineStyle(
            1,
            CONFIG.colors.magenta,
            0.12
        );

        hud.lineBetween(
            15,
            125,
            45,
            125
        );

        hud.lineBetween(
            355,
            125,
            385,
            125
        );
    }

    // ========================================================
    // HEADER
    // ========================================================

    private buildHeader(): void {

        this.title =
            this.add.text(
                200,
                CONFIG.layout.headerY,
                "GARAGE",
                {
                    fontFamily: "Arial Black",
                    fontSize: "38px",
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
                .setDepth(20);

        this.tweens.add({
            targets: this.title,
            alpha: 0.88,
            scale: 1.015,
            duration: 1700,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        });

        this.subtitle =
            this.add.text(
                200,
                86,
                "VEHICLE // CONFIGURATION",
                {
                    fontFamily: "Arial",
                    fontSize: "8px",
                    color: "#00ffff",
                    letterSpacing: 3,
                } as Phaser.Types.GameObjects.Text.TextStyle
            )
                .setOrigin(0.5)
                .setDepth(20);

        // ----------------------------------------------------
        // Crystal display
        // ----------------------------------------------------

        const crystalBox =
            this.add.rectangle(
                315,
                108,
                72,
                27,
                CONFIG.colors.panelDark,
                0.92
            )
                .setDepth(20);

        crystalBox.setStrokeStyle(
            1,
            CONFIG.colors.cyan,
            0.55
        );

        this.crystalText =
            this.add.text(
                315,
                108,
                "",
                {
                    fontFamily: "Arial Black",
                    fontSize: "12px",
                    color: "#00ffff",
                    shadow: {
                        color: "#00ffff",
                        blur: 8,
                        fill: true,
                    },
                }
            )
                .setOrigin(0.5)
                .setDepth(21);

        this.updateCrystalDisplay(
            this.displayCrystal
        );

        // ----------------------------------------------------
        // System label
        // ----------------------------------------------------

        this.add.text(
            25,
            108,
            "NOVA // GARAGE",
            {
                fontFamily: "Arial Black",
                fontSize: "7px",
                color: "#587783",
                letterSpacing: 1,
            } as Phaser.Types.GameObjects.Text.TextStyle
        )
            .setDepth(20);

        this.add.rectangle(
            25,
            119,
            5,
            5,
            CONFIG.colors.cyan
        )
            .setDepth(20);

        this.add.text(
            35,
            116,
            "ONLINE",
            {
                fontFamily: "Arial Black",
                fontSize: "7px",
                color: "#587783",
                letterSpacing: 1,
            } as Phaser.Types.GameObjects.Text.TextStyle
        )
            .setDepth(20);
    }

    // ========================================================
    // CAR DISPLAY
    // ========================================================

    private buildCarDisplay(): void {

        this.carShadow =
            this.add.ellipse(
                CONFIG.layout.carCenterX,
                390,
                145,
                28,
                CONFIG.colors.black,
                0.72
            )
                .setDepth(1);

        this.carGlow =
            this.add.ellipse(
                CONFIG.layout.carCenterX,
                CONFIG.layout.carCenterY,
                170,
                235,
                CONFIG.colors.cyan,
                0.08
            )
                .setDepth(2);

        this.carImage =
            this.add.image(
                CONFIG.layout.carCenterX,
                CONFIG.layout.carCenterY,
                "player"
            )
                .setDepth(5);

        this.carImage.setScale(0.18);

        this.tweens.add({
            targets: this.carImage,
            y: CONFIG.layout.carCenterY + 8,
            duration: 950,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        });

        this.tweens.add({
            targets: this.carGlow,
            scale: 1.08,
            alpha: 0.12,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        });

        // ----------------------------------------------------
        // Lock
        // ----------------------------------------------------

        this.lockIcon =
            this.add.text(
                200,
                225,
                "LOCKED",
                {
                    fontFamily: "Arial Black",
                    fontSize: "9px",
                    color: "#ff315c",
                    backgroundColor: "#10040a",
                    padding: {
                        x: 8,
                        y: 5,
                    },
                    letterSpacing: 1,
                } as Phaser.Types.GameObjects.Text.TextStyle
            )
                .setOrigin(0.5)
                .setDepth(15)
                .setVisible(false);

        // ----------------------------------------------------
        // Price
        // ----------------------------------------------------

        this.priceCard =
            this.add.rectangle(
                200,
                355,
                128,
                34,
                CONFIG.colors.panelDark,
                0.95
            )
                .setDepth(15)
                .setVisible(false);

        this.priceCard.setStrokeStyle(
            1,
            CONFIG.colors.gold,
            0.75
        );

        this.priceLabel =
            this.add.text(
                200,
                355,
                "",
                {
                    fontFamily: "Arial Black",
                    fontSize: "14px",
                    color: "#ffd700",
                }
            )
                .setOrigin(0.5)
                .setDepth(16)
                .setVisible(false);
    }

    // ========================================================
    // INFORMATION PANEL
    // ========================================================

    private buildInformationPanel(): void {

        const outer =
            this.add.rectangle(
                CONFIG.layout.panelX,
                CONFIG.layout.panelY,
                CONFIG.layout.panelWidth + 8,
                CONFIG.layout.panelHeight + 8,
                CONFIG.colors.cyan,
                0.025
            )
                .setDepth(4);

        this.tweens.add({
            targets: outer,
            alpha: 0.05,
            duration: 1800,
            yoyo: true,
            repeat: -1,
        });

        const panel =
            this.add.rectangle(
                CONFIG.layout.panelX,
                CONFIG.layout.panelY,
                CONFIG.layout.panelWidth,
                CONFIG.layout.panelHeight,
                CONFIG.colors.panel,
                0.97
            )
                .setDepth(5);

        panel.setStrokeStyle(
            2,
            CONFIG.colors.cyan,
            0.48
        );

        const inner =
            this.add.rectangle(
                CONFIG.layout.panelX,
                CONFIG.layout.panelY,
                CONFIG.layout.panelWidth - 10,
                CONFIG.layout.panelHeight - 10,
                CONFIG.colors.panelDark,
                0.25
            )
                .setDepth(6);

        inner.setStrokeStyle(
            1,
            CONFIG.colors.cyan,
            0.12
        );

        // ----------------------------------------------------
        // Panel header
        // ----------------------------------------------------

        this.add.rectangle(
            200,
            381,
            320,
            24,
            CONFIG.colors.cyan,
            0.025
        )
            .setDepth(7);

        this.add.text(
            45,
            373,
            "VEHICLE DATA",
            {
                fontFamily: "Arial Black",
                fontSize: "8px",
                color: "#63838e",
                letterSpacing: 2,
            } as Phaser.Types.GameObjects.Text.TextStyle
        )
            .setDepth(8);

        this.add.text(
            355,
            373,
            "SYS.02",
            {
                fontFamily: "Arial Black",
                fontSize: "7px",
                color: "#00ffff",
            }
        )
            .setOrigin(1, 0)
            .setDepth(8);

        // ----------------------------------------------------
        // Name
        // ----------------------------------------------------

        this.nameText =
            this.add.text(
                200,
                420,
                "",
                {
                    fontFamily: "Arial Black",
                    fontSize: "22px",
                    color: "#ffffff",
                    shadow: {
                        color: "#00ffff",
                        blur: 10,
                        fill: true,
                    },
                }
            )
                .setOrigin(0.5)
                .setDepth(10);

        this.levelText =
            this.add.text(
                200,
                446,
                "",
                {
                    fontFamily: "Arial Black",
                    fontSize: "9px",
                    color: "#ffd700",
                    letterSpacing: 2,
                } as Phaser.Types.GameObjects.Text.TextStyle
            )
                .setOrigin(0.5)
                .setDepth(10);

        // ----------------------------------------------------
        // Stats
        // ----------------------------------------------------

        this.createStatRow(
            478,
            "SPEED",
            "⚡",
            "cyan"
        );

        this.createStatRow(
            523,
            "NITRO",
            "◆",
            "orange"
        );

        this.createStatRow(
            568,
            "HANDLING",
            "◈",
            "green"
        );

        this.speedValueText =
            this.createStatValue(
                478
            );

        this.nitroValueText =
            this.createStatValue(
                523
            );

        this.handlingValueText =
            this.createStatValue(
                568
            );

        this.speedBar =
            this.createStatBar(
                478,
                "cyan"
            );

        this.nitroBar =
            this.createStatBar(
                523,
                "orange"
            );

        this.handlingBar =
            this.createStatBar(
                568,
                "green"
            );

        // ----------------------------------------------------
        // Separator
        // ----------------------------------------------------

        const separator =
            this.add.graphics()
                .setDepth(7);

        separator.lineStyle(
            1,
            CONFIG.colors.cyan,
            0.1
        );

        separator.lineBetween(
            42,
            600,
            358,
            600
        );

        separator.lineStyle(
            2,
            CONFIG.colors.magenta,
            0.35
        );

        separator.lineBetween(
            42,
            600,
            78,
            600
        );

        separator.lineStyle(
            2,
            CONFIG.colors.cyan,
            0.35
        );

        separator.lineBetween(
            322,
            600,
            358,
            600
        );
    }

    // ========================================================
    // STAT ROW
    // ========================================================

    private createStatRow(
        y: number,
        label: string,
        icon: string,
        color: StatColor
    ): void {

        const colorHex =
            color === "cyan"
                ? "#00ffff"
                : color === "orange"
                    ? "#ff8a00"
                    : "#00ff88";

        this.add.text(
            48,
            y,
            `${icon}  ${label}`,
            {
                fontFamily: "Arial Black",
                fontSize: "8px",
                color: colorHex,
                letterSpacing: 1,
            } as Phaser.Types.GameObjects.Text.TextStyle
        )
            .setOrigin(0, 0.5)
            .setDepth(10);
    }

    // ========================================================
    // STAT VALUE
    // ========================================================

    private createStatValue(
        y: number
    ): Phaser.GameObjects.Text {

        return this.add.text(
            350,
            y,
            "0",
            {
                fontFamily: "Arial Black",
                fontSize: "10px",
                color: "#ffffff",
            }
        )
            .setOrigin(1, 0.5)
            .setDepth(10);
    }

    // ========================================================
    // STAT BAR
    // ========================================================

    private createStatBar(
        y: number,
        color: StatColor
    ): Phaser.GameObjects.Rectangle {

        const colorHex =
            color === "cyan"
                ? CONFIG.colors.cyan
                : color === "orange"
                    ? CONFIG.colors.orange
                    : CONFIG.colors.green;

        const bg =
            this.add.rectangle(
                150,
                y + 13,
                CONFIG.stats.barWidth,
                CONFIG.stats.barHeight,
                CONFIG.colors.bg
            )
                .setDepth(8);

        bg.setStrokeStyle(
            1,
            colorHex,
            0.2
        );

        const bar =
            this.add.rectangle(
                45,
                y + 13,
                0,
                CONFIG.stats.barHeight,
                colorHex
            )
                .setOrigin(0, 0.5)
                .setDepth(9);

        return bar;
    }

    // ========================================================
    // NAVIGATION
    // ========================================================

    private buildNavigation(): void {

        this.leftButton =
            this.createNavigationButton(
                45,
                CONFIG.layout.navY,
                "‹",
                -1
            );

        this.rightButton =
            this.createNavigationButton(
                355,
                CONFIG.layout.navY,
                "›",
                1
            );

        this.add.text(
            200,
            326,
            "SELECT VEHICLE",
            {
                fontFamily: "Arial Black",
                fontSize: "7px",
                color: "#63838e",
                letterSpacing: 3,
            } as Phaser.Types.GameObjects.Text.TextStyle
        )
            .setOrigin(0.5)
            .setDepth(10);
    }

    // ========================================================
    // NAV BUTTON
    // ========================================================

    private createNavigationButton(
        x: number,
        y: number,
        text: string,
        direction: number
    ): Phaser.GameObjects.Container {

        const bg =
            this.add.rectangle(
                0,
                0,
                48,
                48,
                CONFIG.colors.panelDark,
                0.94
            );

        bg.setStrokeStyle(
            1,
            CONFIG.colors.cyan,
            0.65
        );

        const line =
            this.add.rectangle(
                direction < 0
                    ? -20
                    : 20,
                0,
                3,
                28,
                CONFIG.colors.cyan,
                0.8
            );

        const label =
            this.add.text(
                0,
                -2,
                text,
                {
                    fontFamily: "Arial Black",
                    fontSize: "32px",
                    color: "#ffffff",
                }
            )
                .setOrigin(0.5);

        const container =
            this.add.container(
                x,
                y,
                [
                    bg,
                    line,
                    label,
                ]
            )
                .setDepth(20);

        bg.setInteractive({
            useHandCursor: true,
        });

        bg.on(
            "pointerover",
            () => {

                this.tweens.add({
                    targets: container,
                    scale: 1.08,
                    duration: 100,
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

                this.tweens.add({
                    targets: container,
                    scale: 1,
                    duration: 100,
                });

                bg.setStrokeStyle(
                    1,
                    CONFIG.colors.cyan,
                    0.65
                );
            }
        );

        bg.on(
            "pointerdown",
            () => {

                if (
                    this.interactionLocked ||
                    this.isChangingCar
                ) {
                    return;
                }

                AudioSystem.click();

                this.changeCar(
                    direction
                );
            }
        );

        return container;
    }

    // ========================================================
    // ACTION BUTTONS
    // ========================================================

    private buildActionButtons(): void {

        this.buyBox =
            this.createActionButton(
                200,
                CONFIG.layout.buttonY,
                300,
                50,
                "BUY",
                "cyan",
                () => this.buy()
            );

        this.buyText =
            this.buyBox.list[1] as
            Phaser.GameObjects.Text;

        this.upgradeBox =
            this.createActionButton(
                117,
                CONFIG.layout.buttonY,
                142,
                50,
                "UPGRADE",
                "gold",
                () => this.upgradeCar()
            );

        this.upgradeText =
            this.upgradeBox.list[1] as
            Phaser.GameObjects.Text;

        this.selectBox =
            this.createActionButton(
                283,
                CONFIG.layout.buttonY,
                142,
                50,
                "SELECT",
                "cyan",
                () => this.select()
            );

        this.selectText =
            this.selectBox.list[1] as
            Phaser.GameObjects.Text;
    }

    // ========================================================
    // ACTION BUTTON
    // ========================================================

    private createActionButton(
        x: number,
        y: number,
        width: number,
        height: number,
        text: string,
        theme: "cyan" | "gold",
        callback: Function
    ): Phaser.GameObjects.Container {

        const color =
            theme === "gold"
                ? CONFIG.colors.gold
                : CONFIG.colors.cyan;

        const bg =
            this.add.rectangle(
                0,
                0,
                width,
                height,
                CONFIG.colors.panelDark,
                0.96
            );

        bg.setStrokeStyle(
            1,
            color,
            0.7
        );

        const topLine =
            this.add.rectangle(
                0,
                -height / 2 + 3,
                width - 12,
                2,
                color,
                0.7
            );

        const label =
            this.add.text(
                0,
                0,
                text,
                {
                    fontFamily: "Arial Black",
                    fontSize:
                        width > 200
                            ? "15px"
                            : "11px",
                    color:
                        theme === "gold"
                            ? "#ffd700"
                            : "#ffffff",
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
                    label,
                    topLine,
                ]
            )
                .setDepth(25);

        bg.setInteractive({
            useHandCursor: true,
        });

        bg.on(
            "pointerover",
            () => {

                if (
                    container.visible
                ) {

                    this.tweens.add({
                        targets: container,
                        scale:
                            CONFIG.animation.hoverScale,
                        duration:
                            CONFIG.animation.fast,
                    });
                }

                bg.setFillStyle(
                    theme === "gold"
                        ? 0x332700
                        : 0x003344,
                    0.98
                );

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

                this.tweens.add({
                    targets: container,
                    scale: 1,
                    duration:
                        CONFIG.animation.fast,
                });

                bg.setFillStyle(
                    CONFIG.colors.panelDark,
                    0.96
                );

                bg.setStrokeStyle(
                    1,
                    color,
                    0.7
                );
            }
        );

        bg.on(
            "pointerdown",
            () => {

                if (
                    this.interactionLocked
                ) {
                    return;
                }

                this.lockInteraction();

                AudioSystem.click();

                if (
                    typeof navigator !==
                    "undefined" &&
                    navigator.vibrate
                ) {
                    navigator.vibrate(8);
                }

                this.tweens.add({
                    targets: container,
                    scale:
                        CONFIG.animation.pressScale,
                    duration:
                        CONFIG.animation.fast,
                    yoyo: true,
                    onComplete: () => {
                        callback();
                    },
                });
            }
        );

        return container;
    }

    // ========================================================
    // MENU BUTTON
    // ========================================================

    /**
     * Returns the logical part of the 400x800 composition that is
     * currently visible when Phaser uses ENVELOP.
     *
     * On very short phones ENVELOP crops a few logical pixels from
     * the top and bottom. The garage back button is the only main
     * control close enough to the bottom edge to need compensation.
     */
    private getVisibleBottom(): number {
        const gameW = 400;
        const gameH = 800;

        const parentW =
            this.scale.parentSize?.width ||
            window.innerWidth ||
            gameW;

        const parentH =
            this.scale.parentSize?.height ||
            window.innerHeight ||
            gameH;

        const coverScale = Math.max(
            parentW / gameW,
            parentH / gameH
        );

        const visibleH = parentH / coverScale;

        return (
            gameH +
            Math.min(
                0,
                (visibleH - gameH) / 2
            )
        );
    }

    private updateResponsiveMenuButton(): void {
        if (!this.menuButton) {
            return;
        }

        const visibleBottom =
            this.getVisibleBottom();

        const baseY =
            CONFIG.layout.menuY;

        // Keep the original 764px position whenever it is visible.
        // Only move it upward on unusually short portrait screens.
        const maxY =
            visibleBottom - 24;

        this.menuButton.y =
            Math.min(
                baseY,
                maxY
            );
    }

    private buildMenuButton(): void {

        this.menuButton =
            this.createSimpleButton(
                200,
                CONFIG.layout.menuY,
                220,
                38,
                "←  BACK TO MENU",
                () => {

                    AudioSystem.click();

                    this.scene.start(
                        "MenuScene"
                    );
                }
            );

        this.updateResponsiveMenuButton();

        this.scale.on(
            "resize",
            this.updateResponsiveMenuButton,
            this
        );

        this.events.once(
            "shutdown",
            () => {
                this.scale.off(
                    "resize",
                    this.updateResponsiveMenuButton,
                    this
                );
            }
        );
    }

    // ========================================================
    // SIMPLE BUTTON
    // ========================================================

    private createSimpleButton(
        x: number,
        y: number,
        width: number,
        height: number,
        text: string,
        callback: Function
    ): Phaser.GameObjects.Container {

        const bg =
            this.add.rectangle(
                0,
                0,
                width,
                height,
                CONFIG.colors.panelDark,
                0.92
            );

        bg.setStrokeStyle(
            1,
            CONFIG.colors.cyan,
            0.45
        );

        const label =
            this.add.text(
                0,
                0,
                text,
                {
                    fontFamily: "Arial Black",
                    fontSize: "9px",
                    color: "#dffcff",
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
                    label,
                ]
            )
                .setDepth(25);

        bg.setInteractive({
            useHandCursor: true,
        });

        bg.on(
            "pointerover",
            () => {

                this.tweens.add({
                    targets: container,
                    scale: 1.04,
                    duration: 100,
                });

                bg.setStrokeStyle(
                    2,
                    CONFIG.colors.magenta,
                    0.9
                );
            }
        );

        bg.on(
            "pointerout",
            () => {

                this.tweens.add({
                    targets: container,
                    scale: 1,
                    duration: 100,
                });

                bg.setStrokeStyle(
                    1,
                    CONFIG.colors.cyan,
                    0.45
                );
            }
        );

        bg.on(
            "pointerdown",
            () => {

                if (
                    this.interactionLocked
                ) {
                    return;
                }

                this.lockInteraction();

                callback();
            }
        );

        return container;
    }

    // ========================================================
    // CHANGE CAR
    // ========================================================

    private changeCar(
        direction: number
    ): void {

        if (
            this.isChangingCar ||
            this.cars.length === 0
        ) {
            return;
        }

        this.isChangingCar = true;

        this.selectedIndex += direction;

        if (
            this.selectedIndex < 0
        ) {
            this.selectedIndex =
                this.cars.length - 1;
        }

        if (
            this.selectedIndex >=
            this.cars.length
        ) {
            this.selectedIndex = 0;
        }

        this.tweens.add({
            targets: [
                this.carImage,
                this.carGlow,
                this.lockIcon,
                this.priceCard,
                this.priceLabel,
                this.nameText,
                this.levelText,
            ],
            alpha: 0,
            duration: 120,
            onComplete: () => {

                this.refresh();

                this.carImage.setScale(
                    0.14
                );

                this.carImage.x =
                    direction > 0
                        ? 225
                        : 175;

                this.tweens.add({
                    targets: this.carImage,
                    x: 200,
                    alpha: 1,
                    scale: 0.18,
                    duration: 250,
                    ease: "Back.out",
                });

                this.tweens.add({
                    targets: [
                        this.carGlow,
                        this.lockIcon,
                        this.priceCard,
                        this.priceLabel,
                        this.nameText,
                        this.levelText,
                    ],
                    alpha: 1,
                    duration: 180,
                });

                this.isChangingCar = false;
            },
        });
    }

    // ========================================================
    // REFRESH
    // ========================================================

    private refresh(): void {

        if (
            !this.cars.length
        ) {
            return;
        }

        const car =
            this.cars[
                Phaser.Math.Clamp(
                    this.selectedIndex,
                    0,
                    this.cars.length - 1
                )
            ];

        if (!car) {
            return;
        }

        // ----------------------------------------------------
        // Texture
        // ----------------------------------------------------

        if (
            car.texture &&
            this.textures.exists(
                car.texture
            )
        ) {

            this.carImage.setTexture(
                car.texture
            );

        } else if (
            this.textures.exists("player")
        ) {

            this.carImage.setTexture(
                "player"
            );
        }

        // ----------------------------------------------------
        // Upgrade data
        // ----------------------------------------------------

        const upgradeLevel =
            this.getUpgradeLevel(
                car
            );

        const maxUpgrade =
            Number.isFinite(
                Number(car.maxUpgrade)
            )
                ? Number(car.maxUpgrade)
                : 10;

        let stats = {
            speed: Number(car.speed) || 0,
            nitro: Number(car.nitro) || 0,
            handling:
                Number(car.handling) || 0,
        };

        try {

            if (
                this.garage.carSystem &&
                typeof
                this.garage.carSystem
                    .getUpgradedStats ===
                "function"
            ) {

                const upgraded =
                    this.garage.carSystem
                        .getUpgradedStats(
                            car,
                            upgradeLevel
                        );

                if (upgraded) {

                    stats = {
                        speed:
                            Number(
                                upgraded.speed
                            ) || 0,

                        nitro:
                            Number(
                                upgraded.nitro
                            ) || 0,

                        handling:
                            Number(
                                upgraded.handling
                            ) || 0,
                    };
                }
            }

        } catch (error) {

            console.warn(
                "Garage stats fallback:",
                error
            );
        }

        // ----------------------------------------------------
        // Text
        // ----------------------------------------------------

        this.nameText.setText(
            String(
                car.name ??
                "UNKNOWN VEHICLE"
            )
        );

        this.levelText.setText(
            `LEVEL ${upgradeLevel} / ${maxUpgrade}`
        );

        this.speedValueText.setText(
            String(stats.speed)
        );

        this.nitroValueText.setText(
            String(stats.nitro)
        );

        this.handlingValueText.setText(
            String(stats.handling)
        );

        // ----------------------------------------------------
        // Bars
        // ----------------------------------------------------

        this.animateStatBar(
            this.speedBar,
            stats.speed
        );

        this.animateStatBar(
            this.nitroBar,
            stats.nitro
        );

        this.animateStatBar(
            this.handlingBar,
            stats.handling
        );

        // ----------------------------------------------------
        // Crystals
        // ----------------------------------------------------

        const targetCrystal =
            SaveSystem.getCrystals();

        this.animateCrystal(
            this.displayCrystal,
            targetCrystal
        );

        this.displayCrystal =
            targetCrystal;

        // ----------------------------------------------------
        // Ownership
        // ----------------------------------------------------

        let owned = false;

        try {

            owned =
                this.garage.isOwned(
                    car.id
                );

        } catch {

            owned = false;
        }

        let selected = false;

        try {

            selected =
                this.garage.getSelected() ===
                car.id;

        } catch {

            selected = false;
        }

        if (!owned) {

            this.showLockedState(
                car
            );

        } else {

            this.showOwnedState(
                car,
                selected,
                upgradeLevel
            );
        }
    }

    // ========================================================
    // UPGRADE LEVEL
    // ========================================================

    private getUpgradeLevel(
        car: any
    ): number {

        try {

            const level =
                SaveSystem.getCarUpgradeLevel(
                    car.id
                );

            if (
                Number.isFinite(
                    Number(level)
                )
            ) {
                return Math.max(
                    0,
                    Number(level)
                );
            }

        } catch {
            // fallback
        }

        return 0;
    }

    // ========================================================
    // LOCKED STATE
    // ========================================================

    private showLockedState(
        car: any
    ): void {

        this.carImage.setTint(
            0x555b60
        );

        this.carGlow.setVisible(
            false
        );

        this.lockIcon.setVisible(
            true
        );

        this.priceCard.setVisible(
            true
        );

        this.priceLabel.setVisible(
            true
        );

        this.priceLabel.setText(
            `◆  ${Number(car.price) || 0}`
        );

        this.buyBox.setVisible(
            true
        );

        this.buyText.setVisible(
            true
        );

        this.buyText.setText(
            `BUY  ◆ ${Number(car.price) || 0}`
        );

        this.upgradeBox.setVisible(
            false
        );

        this.selectBox.setVisible(
            false
        );

        this.createLockedPulse();
    }

    // ========================================================
    // OWNED STATE
    // ========================================================

    private showOwnedState(
        car: any,
        selected: boolean,
        level: number
    ): void {

        this.carImage.clearTint();

        this.lockIcon.setVisible(
            false
        );

        this.priceCard.setVisible(
            false
        );

        this.priceLabel.setVisible(
            false
        );

        this.buyBox.setVisible(
            false
        );

        this.buyText.setVisible(
            false
        );

        this.upgradeBox.setVisible(
            true
        );

        this.upgradeText.setVisible(
            true
        );

        this.selectBox.setVisible(
            true
        );

        this.selectText.setVisible(
            true
        );

        // ----------------------------------------------------
        // Upgrade
        // ----------------------------------------------------

        let canUpgrade = false;

        try {

            canUpgrade =
                this.garage.carSystem.canUpgrade(
                    car,
                    level
                );

        } catch {

            canUpgrade =
                level <
                Number(
                    car.maxUpgrade ?? 10
                );
        }

        if (canUpgrade) {

            let cost = 0;

            try {

                cost =
                    Number(
                        this.garage.carSystem
                            .getUpgradeCost(
                                car,
                                level
                            )
                    ) || 0;

            } catch {

                cost = 0;
            }

            this.upgradeText.setText(
                `UPGRADE  ◆ ${cost}`
            );

        } else {

            this.upgradeText.setText(
                "MAX LEVEL"
            );
        }

        // ----------------------------------------------------
        // Selected
        // ----------------------------------------------------

        if (selected) {

            this.carGlow.setVisible(
                true
            );

            this.selectText.setText(
                "SELECTED  ✓"
            );

            this.setButtonTheme(
                this.selectBox,
                CONFIG.colors.green
            );

        } else {

            this.carGlow.setVisible(
                false
            );

            this.selectText.setText(
                "SELECT"
            );

            this.setButtonTheme(
                this.selectBox,
                CONFIG.colors.cyan
            );
        }
    }

    // ========================================================
    // BUTTON THEME
    // ========================================================

    private setButtonTheme(
        container: Phaser.GameObjects.Container,
        color: number
    ): void {

        const bg =
            container.list[0] as
            Phaser.GameObjects.Rectangle;

        if (!bg) {
            return;
        }

        bg.setStrokeStyle(
            1,
            color,
            0.72
        );
    }

    // ========================================================
    // STAT BAR ANIMATION
    // ========================================================

    private animateStatBar(
        bar: Phaser.GameObjects.Rectangle,
        value: number
    ): void {

        const normalized =
            Phaser.Math.Clamp(
                value /
                CONFIG.stats.max,
                0,
                1
            );

        const width =
            CONFIG.stats.barWidth *
            normalized;

        this.tweens.add({
            targets: bar,
            width,
            duration: 320,
            ease: "Cubic.easeOut",
        });
    }

    // ========================================================
    // CRYSTAL ANIMATION
    // ========================================================

    private animateCrystal(
        from: number,
        to: number
    ): void {

        if (from === to) {

            this.updateCrystalDisplay(
                to
            );

            return;
        }

        this.tweens.addCounter({

            from,
            to,

            duration: 300,

            onUpdate: tween => {

                const value =
                    Math.floor(
                        tween.getValue() ?? 0
                    );

                this.updateCrystalDisplay(
                    value
                );
            },
        });
    }

    // ========================================================
    // CRYSTAL DISPLAY
    // ========================================================

    private updateCrystalDisplay(
        value: number
    ): void {

        this.crystalText.setText(
            `◆  ${Math.max(0, value)}`
        );
    }

    // ========================================================
    // BUY
    // ========================================================

    private buy(): void {

        if (
            this.interactionLocked
        ) {
            return;
        }

        const car =
            this.cars[
                this.selectedIndex
            ];

        if (!car) {
            return;
        }

        if (
            this.garage.isOwned(
                car.id
            )
        ) {
            return;
        }

        this.lockInteraction();

        const success =
            this.garage.buyCar(
                car.id
            );

        if (success) {

            AudioSystem.carBuy();

            this.showMessage(
                "PURCHASE COMPLETE",
                "#00ff88"
            );

            this.cameras.main.flash(
                180,
                0,
                255,
                255
            );

            this.createPurchaseBurst();

            this.tweens.add({
                targets: this.carImage,
                scale: 0.23,
                duration: 120,
                yoyo: true,
                ease: "Back.out",
            });

            this.refresh();

        } else {

            this.showMessage(
                "NOT ENOUGH CRYSTALS",
                "#ff315c"
            );

            this.cameras.main.shake(
                180,
                0.004
            );

            this.shakeContainer(
                this.buyBox
            );
        }
    }

    // ========================================================
    // SELECT
    // ========================================================

    private select(): void {

        if (
            this.interactionLocked
        ) {
            return;
        }

        const car =
            this.cars[
                this.selectedIndex
            ];

        if (!car) {
            return;
        }

        if (
            !this.garage.isOwned(
                car.id
            )
        ) {
            return;
        }

        this.lockInteraction();

        AudioSystem.click();

        this.garage.selectCar(
            car.id
        );

        this.showMessage(
            "VEHICLE SELECTED",
            "#00ffff"
        );

        this.carGlow.setVisible(
            true
        );

        this.tweens.add({
            targets: this.carGlow,
            alpha: 0.28,
            scale: 1.12,
            duration: 180,
            yoyo: true,
            ease: "Sine.easeInOut",
        });

        this.tweens.add({
            targets: this.carImage,
            scale: 0.22,
            duration: 120,
            yoyo: true,
            ease: "Back.out",
        });

        this.refresh();
    }

    // ========================================================
    // UPGRADE
    // ========================================================

    private upgradeCar(): void {

        if (
            this.interactionLocked
        ) {
            return;
        }

        const car =
            this.cars[
                this.selectedIndex
            ];

        if (!car) {
            return;
        }

        if (
            !this.garage.isOwned(
                car.id
            )
        ) {
            return;
        }

        const level =
            this.getUpgradeLevel(
                car
            );

        let canUpgrade = false;

        try {

            canUpgrade =
                this.garage.carSystem.canUpgrade(
                    car,
                    level
                );

        } catch {

            canUpgrade =
                level <
                Number(
                    car.maxUpgrade ?? 10
                );
        }

        if (!canUpgrade) {

            this.showMessage(
                "MAX LEVEL",
                "#ffd700"
            );

            return;
        }

        let cost = 0;

        try {

            cost =
                Number(
                    this.garage.carSystem
                        .getUpgradeCost(
                            car,
                            level
                        )
                ) || 0;

        } catch {

            this.showMessage(
                "UPGRADE ERROR",
                "#ff315c"
            );

            return;
        }

        this.lockInteraction();

        const success =
            SaveSystem.upgradeCar(
                car.id,
                cost
            );

        if (success) {

            AudioSystem.purchase();

            this.showMessage(
                "UPGRADE COMPLETE",
                "#ffd700"
            );

            this.cameras.main.flash(
                150,
                255,
                215,
                0
            );

            this.createUpgradeBurst();

            this.tweens.add({
                targets: this.carImage,
                scale: 0.225,
                duration: 120,
                yoyo: true,
                ease: "Back.out",
            });

            this.refresh();

        } else {

            this.showMessage(
                "NOT ENOUGH CRYSTALS",
                "#ff315c"
            );

            this.cameras.main.shake(
                180,
                0.004
            );

            this.shakeContainer(
                this.upgradeBox
            );
        }
    }

    // ========================================================
    // PURCHASE PARTICLES
    // ========================================================

    private createPurchaseBurst(): void {

        for (
            let i = 0;
            i < 18;
            i++
        ) {

            const particle =
                this.add.circle(
                    this.carImage.x,
                    this.carImage.y,
                    Phaser.Math.Between(
                        2,
                        5
                    ),
                    CONFIG.colors.cyan
                )
                    .setDepth(30);

            const angle =
                Phaser.Math.FloatBetween(
                    0,
                    Math.PI * 2
                );

            const distance =
                Phaser.Math.Between(
                    65,
                    130
                );

            this.tweens.add({
                targets: particle,

                x:
                    particle.x +
                    Math.cos(angle) *
                    distance,

                y:
                    particle.y +
                    Math.sin(angle) *
                    distance,

                alpha: 0,
                scale: 0,

                duration:
                    Phaser.Math.Between(
                        400,
                        650
                    ),

                ease: "Cubic.easeOut",

                onComplete: () => {

                    particle.destroy();
                },
            });
        }
    }

    // ========================================================
    // UPGRADE PARTICLES
    // ========================================================

    private createUpgradeBurst(): void {

        for (
            let i = 0;
            i < 14;
            i++
        ) {

            const particle =
                this.add.circle(
                    this.carImage.x +
                    Phaser.Math.Between(
                        -55,
                        55
                    ),
                    this.carImage.y +
                    Phaser.Math.Between(
                        -80,
                        80
                    ),
                    Phaser.Math.Between(
                        2,
                        4
                    ),
                    CONFIG.colors.gold
                )
                    .setDepth(30);

            this.tweens.add({
                targets: particle,

                y:
                    particle.y -
                    Phaser.Math.Between(
                        40,
                        100
                    ),

                alpha: 0,
                scale: 0,

                duration:
                    Phaser.Math.Between(
                        350,
                        600
                    ),

                onComplete: () => {

                    particle.destroy();
                },
            });
        }
    }

    // ========================================================
    // LOCKED PULSE
    // ========================================================

    private createLockedPulse(): void {

        if (
            !this.lockIcon.visible
        ) {
            return;
        }

        this.tweens.killTweensOf(
            this.lockIcon
        );

        this.tweens.add({
            targets: this.lockIcon,
            alpha: 0.55,
            duration: 850,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        });
    }

    // ========================================================
    // MESSAGE
    // ========================================================

    private showMessage(
        text: string,
        color = "#00ffff"
    ): void {

        if (
            !this.message
        ) {

            this.message =
                this.add.text(
                    200,
                    650,
                    "",
                    {
                        fontFamily:
                            "Arial Black",
                        fontSize:
                            "10px",
                        color:
                            "#00ffff",
                        backgroundColor:
                            "#030a10",
                        padding: {
                            x: 12,
                            y: 6,
                        },
                    }
                )
                    .setOrigin(0.5)
                    .setDepth(60);
        }

        this.tweens.killTweensOf(
            this.message
        );

        this.message.setText(
            `[ ${text} ]`
        );

        this.message.setColor(
            color
        );

        this.message.setAlpha(
            1
        );

        this.message.setScale(
            0.9
        );

        this.message.setY(
            650
        );

        this.tweens.add({
            targets: this.message,

            alpha: 0,

            y: 635,

            scale: 1.05,

            duration: 1000,

            delay: 550,

            ease: "Power2",
        });
    }

    // ========================================================
    // SHAKE
    // ========================================================

    private shakeContainer(
        object: Phaser.GameObjects.Container
    ): void {

        const originalX =
            object.x;

        this.tweens.add({
            targets: object,

            x: originalX + 7,

            duration: 35,

            yoyo: true,

            repeat: 4,

            onComplete: () => {

                object.x =
                    originalX;
            },
        });
    }

    // ========================================================
    // INTERACTION LOCK
    // ========================================================

    private lockInteraction(): void {

        this.interactionLocked =
            true;

        this.time.delayedCall(
            CONFIG.input.clickLock,
            () => {

                this.interactionLocked =
                    false;
            }
        );
    }

    // ========================================================
    // KEYBOARD
    // ========================================================

    private setupKeyboard(): void {

        this.input.keyboard?.on(
            "keydown-LEFT",
            () => {

                if (
                    this.interactionLocked
                ) {
                    return;
                }

                AudioSystem.click();

                this.changeCar(
                    -1
                );
            }
        );

        this.input.keyboard?.on(
            "keydown-RIGHT",
            () => {

                if (
                    this.interactionLocked
                ) {
                    return;
                }

                AudioSystem.click();

                this.changeCar(
                    1
                );
            }
        );

        this.input.keyboard?.on(
            "keydown-ESC",
            () => {

                if (
                    this.interactionLocked
                ) {
                    return;
                }

                AudioSystem.click();

                this.scene.start(
                    "MenuScene"
                );
            }
        );
    }

    // ========================================================
    // UPDATE
    // ========================================================

    update(): void {

        if (
            this.carGlow &&
            this.carGlow.visible
        ) {

            this.carGlow.rotation +=
                0.002;
        }
    }

    // ========================================================
    // SHUTDOWN
    // ========================================================

    shutdown(): void {

        this.tweens.killAll();

        this.input.keyboard?.off(
            "keydown-LEFT"
        );

        this.input.keyboard?.off(
            "keydown-RIGHT"
        );

        this.input.keyboard?.off(
            "keydown-ESC"
        );

        if (
            this.message
        ) {

            this.message.destroy();

            this.message =
                undefined as any;
        }

        this.interactionLocked =
            false;

        this.isChangingCar =
            false;
    }
}