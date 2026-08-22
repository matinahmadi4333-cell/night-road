import Phaser from "phaser";

import CrystalSystem from "../systems/crystalSystem";
import MobileControl from "../systems/MobileControl";
import UpgradeSystem from "../systems/UpgradeSystem";
import AudioSystem from "../systems/AudioSystem";
import SaveSystem from "../systems/SaveSystem";
import CarSystem from "../systems/CarSystem";
import TrafficSystem, { getCanonicalVehicleSize } from "../systems/TrafficSystem";
import LevelSystem from "../systems/LevelSystem";
import WorldManager from "../systems/WorldManager";
import ScoreSystem from "../systems/ScoreSystem";
import GameHUD from "../ui/GameHUD";
// =====================================================================================
// NOVA OVERDRIVE — FINAL GAME SCENE
// =====================================================================================
//
// HUD:
// • GameHUD is the ONLY gameplay HUD controller.
// • Old duplicate Speed / Nitro / Crystal HUD is removed.
// • Nitro button remains controlled by GameScene because it is gameplay input.
// • Crystal / magnet gameplay remains inside CrystalSystem.
// • Score remains inside ScoreSystem.
// • Nitro FX upgraded.
// • Crystal pickup FX upgraded.
// • Magnet pickup FX upgraded.
// • Clean top area.
// • Zone background images now cycle per-zone (3 images each) with fallback
//   to the original road1/road2 textures if a zone's images aren't loaded.
// • Zone 5 completion now triggers a real cinematic ending instead of
//   looping back to Zone 1.
// =====================================================================================


export default class GameScene extends Phaser.Scene {

    // =========================================================================
    // GAME OBJECTS
    // =========================================================================
    private bgCycleIndex: number = 0;
    private bgShuffleBag: string[] = [];
    private lastBackgroundKey: string | null = null;
    car!: Phaser.GameObjects.Sprite;

    road1!: Phaser.GameObjects.Image;
    road2!: Phaser.GameObjects.Image;


    // =========================================================================
    // SYSTEMS
    // =========================================================================

    crystal!: CrystalSystem;
    mobile!: MobileControl;
    upgrade!: UpgradeSystem;
    traffic!: TrafficSystem;
    level!: LevelSystem;
    world!: WorldManager;
    scoreSystem!: ScoreSystem;
    hud!: GameHUD;
    carSystem!: CarSystem;

    selectedCarStats: any;


    // =========================================================================
    // GAME STATE
    // =========================================================================

    distance = 0;

    speed = 2;

    displaySpeed = 80;

    // Stable integer speed shown in the HUD. Uses hysteresis to prevent 62/63 flicker.
    private hudSpeed = 80;

    targetSpeed = 80;

    playerX = 200;

    playerY = 550;


    // =========================================================================
    // NITRO
    // =========================================================================

    nitroActive = false;

    nitroTimer = 0;

    nitroDuration = 4000;

    nitroCooldown = false;

    // Real (non-cosmetic) nitro speed ceiling. Nitro is allowed to push
    // displaySpeed above the car's normal MAX_SPEED cap, all the way up to
    // this value. Each car defines its own ceiling (CarData.nitroMaxSpeed) —
    // this constant is only a fallback for the rare case selectedCarStats
    // hasn't loaded yet. The highest possible ceiling in the game is 950,
    // on the most expensive car.
    private readonly NITRO_MAX_SPEED_FALLBACK = 950;

    // Current car's actual nitro speed ceiling, resolved every frame from
    // selectedCarStats so each car can have a different cap.
    private get NITRO_MAX_SPEED(): number {
        return this.selectedCarStats?.nitroMaxSpeed ?? this.NITRO_MAX_SPEED_FALLBACK;
    }

    // Real (non-cosmetic) normal (non-nitro) speed ceiling. Each car defines
    // its own ceiling (CarData.maxSpeed) — this constant is only a fallback
    // for the rare case selectedCarStats hasn't loaded yet.
    private readonly MAX_SPEED_FALLBACK = 450;

    // Current car's actual normal speed ceiling, resolved every frame from
    // selectedCarStats so each car can have a different cap.
    private get MAX_SPEED(): number {
        return this.selectedCarStats?.maxSpeed ?? this.MAX_SPEED_FALLBACK;
    }

    private nitroFXTimer = 0;

    private nitroPulse = 0;


    // =========================================================================
    // PLAYER
    // =========================================================================

    health = 4;

    hitCooldown = false;

    gameOver = false;
    private readonly DEBUG_INVINCIBLE = false;

    // =========================================================================
    // ZONE / LEVEL
    // =========================================================================

    private readonly TOTAL_ZONES = 5;

    private readonly LEVELS_PER_ZONE = 10;

    private readonly ZONE_DURATION = 180000;

    private readonly LEVEL_DURATION = 18000;

    // Level now advances by distance traveled *inside the current zone*,
    // not by real time. Each zone requires more distance per level than
    // the last, so Zone 1 levels up easily and later zones get harder.
    // Index 0 = Zone 1, index 4 = Zone 5. Tune these to taste.
    private readonly ZONE_DISTANCE_PER_LEVEL: readonly number[] = [
        7000,
        14000,
        25000,
        40000,
        50000
    ];

    // Fallback used only if a zone index somehow falls outside the array.
    private readonly DISTANCE_PER_LEVEL = 2200;

    private currentZone = 1;

    private currentLevel = 1;

    private zoneElapsed = 0;

    private levelElapsed = 0;

    // Snapshot of this.distance taken whenever a zone (re)starts, so level
    // progress can be measured as "distance traveled since this zone began".
    private zoneStartDistance = 0;

    private zoneTransitioning = false;

    private zoneIntroActive = false;


    // =========================================================================
    // ZONE BACKGROUND IMAGES
    // =========================================================================

    // -------------------------------------------------------------------------
    // ZONE ROAD ART
    // -------------------------------------------------------------------------
    // Exactly ONE road image belongs to each Zone.
    // The same image is repeated continuously until the Zone ends.
    private readonly ZONE_IMAGES: readonly string[] = [
        "zone1_road",
        "zone2_road",
        "zone3_road",
        "zone4_road",
        "zone5_road"
    ];

    // -------------------------------------------------------------------------
    // ROAD LOOP / MICRO-SEAM
    // -------------------------------------------------------------------------
    // No random image shuffle: each Zone owns one visual identity.
    private readonly ROAD_HEIGHT = 800;
    // Roads are designed to tile edge-to-edge. No seam or spacer is used.
    private readonly ROAD_GAP = 0;
    private readonly ROAD_SPACING =
        this.ROAD_HEIGHT;

    private roadGapFX!: Phaser.GameObjects.Graphics;
    private roadGapPulse = 0;


    // =========================================================================
    // ZONE UI
    // =========================================================================

    private zoneIntroContainer!: Phaser.GameObjects.Container;

    private zoneTitleText!: Phaser.GameObjects.Text;

    private zoneSubtitleText!: Phaser.GameObjects.Text;

    private zoneStoryText!: Phaser.GameObjects.Text;

    private zoneContinueText!: Phaser.GameObjects.Text;

    private zoneProgressText!: Phaser.GameObjects.Text;


    // =========================================================================
    // STORY
    // =========================================================================

    private storyVoice?: SpeechSynthesisUtterance;

    private storyFullText = "";

    private storyTypeIndex = 0;

    private storyTypeTimer = 0;

    private storyAudioKey: string | null = null;

    private storyVoicePlaying = false;

    private currentZoneSound?: Phaser.Sound.BaseSound;

    private currentNarrationLine = -1;

    private narrationFinished = false;

    // The supplied MP3 files are the master clock.
    // Subtitle line changes are aligned to the real speech boundaries in each MP3.
    private narrationTimeScale = 1;


    // =========================================================================
    // ENDING (ZONE 5 COMPLETION)
    // =========================================================================

    private endingSlowdownActive = false;

    private endingScreenActive = false;

    private endingContainer!: Phaser.GameObjects.Container;

    private endingStoryText!: Phaser.GameObjects.Text;

    private readonly ENDING_STORY =
        "The Core goes silent.\n" +
        "The network collapses behind me.\n" +
        "I am finally free.";


    // =========================================================================
    // ENEMY WARNING
    // =========================================================================

    private enemyWarningActive = false;

    private enemyWarningCooldown = 0;

    private enemyWarningText?: Phaser.GameObjects.Text;


    // =========================================================================
    // ZONE DATA
    // =========================================================================

    private readonly ZONE_DATA = [
        {
            title: "NEON CITY",
            subtitle: "ZONE 01  //  THE ESCAPE",
            story: "Okay.\nIt's working.\nI...\nI really made it out.\nI thought I'd feel different.\nI thought I'd finally feel free, but I don't.\nI keep checking the mirrors.\nThey know I'm gone.\nI don't know how, but they know.\nNo more turning back.\nJust keep driving.",
            voice: "Okay. It's working. I, I really made it out. I thought I'd feel different. I thought I'd finally feel free, but I don't. I keep checking the mirrors. They know I'm gone. I don't know how, but they know. No more turning back. Just keep driving."
        },
        {
            title: "CYBER HIGHWAY",
            subtitle: "ZONE 02  //  NO RETURN",
            story: "The city is gone.\nI can't see the lights anymore.\nFor a second, I thought I lost them.\nThat was stupid.\nI know how they work.\nI helped build this system.\nThey don't stop, so I can't stop.",
            voice: "The city is gone. I can't see the lights anymore. For a second, I thought I lost them. That was stupid. I know how they work. I helped build this system. They don't stop, so I can't stop."
        },
        {
            title: "HUNTER NETWORK",
            subtitle: "ZONE 03  //  HUNTER GRID",
            story: "Something changed.\nI can feel it.\nThey're not following anymore.\nThey're predicting every turn, every choice.\nThey already know.\nI helped create this, and now it's coming for me.",
            voice: "Something changed. I can feel it. They're not following anymore. They're predicting every turn, every choice. They already know. I helped create this, and now it's coming for me."
        },
        {
            title: "VOID HIGHWAY",
            subtitle: "ZONE 04  //  BLACK SIGNAL",
            story: "It's quiet.\nToo quiet.\nNo signals, no warnings, nothing.\nI spent so much time trying to reach this place, a place they couldn't see, a place they couldn't control.\nI thought I would feel safe, but I don't know.\nSomething feels wrong.\nWhen everything disappears, you start noticing things you tried to forget.\nThe road is still ahead.\nThat's enough.\nKeep going.",
            voice: "It's quiet. Too quiet. No signals, no warnings, nothing. I spent so much time trying to reach this place, a place they couldn't see, a place they couldn't control. I thought I would feel safe, but I don't know. Something feels wrong. When everything disappears, you start noticing things you tried to forget. The road is still ahead. That's enough. Keep going."
        },
        {
            title: "THE CORE",
            subtitle: "ZONE 05  //  LAST RUN",
            story: "I'm here at the core.\nI thought I would have more to say.\nI imagined this moment so many times.\nI thought I'd be angry.\nI thought I'd want answers.\nBut I'm just tired, really tired.\nEverything I lost,\neverything I did,\nit all led me here.\nThey spent years controlling every road,\nevery choice, every person.\nBut they missed one thing.\nI still get to decide.\nThis ends here.",
            voice: "I'm here at the core. I thought I would have more to say. I imagined this moment so many times. I thought I'd be angry. I thought I'd want answers. But I'm just tired, really tired. Everything I lost, everything I did, it all led me here. They spent years controlling every road, every choice, every person. But they missed one thing. I still get to decide. This ends here."
        }
    ];
    // The supplied audio files are the master clock for subtitles.
    // No more unmapped-audio gaps: every zone's timing below is now derived
    // directly from the segment boundaries in the supplied
    // zone_voice_N-speedscribe.json whisper transcripts, so the previously
    // "blank" stretches of audio are accounted for by real segment text.
    private readonly ZONE_UNMAPPED_AUDIO: Record<number, Array<{ start: number; end: number }>> = {};

    private readonly ZONE_NARRATION_LINES: Record<number, Array<{ start: number; end: number; text: string }>> = {
        // Timestamps are synced to the whisper segment boundaries in the
        // supplied zone_voice_N-speedscribe.json files (offsets/1000 = seconds).
        // Where a json segment spans several sentences, the sentence-level
        // sub-splits below are interpolated by character length inside that
        // segment's [from, to] window, so line changes always land inside the
        // real spoken segment they belong to.
        1: [
            // zone_voice_1 has a single whisper segment covering 0.00-29.00s
            // for the whole monologue; these sub-splits fit inside that window.
            { start:0.13, end:1.41, text:"Okay." },
            { start:2.47, end:3.31, text:"It's working." },
            { start:4.66, end:5.67, text:"I," },
            { start:6.07, end:7.22, text:"I really made it out." },
            { start:8.26, end:10.14, text:"I thought I'd feel different." },
            { start:10.57, end:12.75, text:"I thought I'd finally feel free," },
            { start:13.29, end:14.19, text:"but I don't." },
            { start:15.25, end:16.52, text:"I keep checking the mirrors." },
            { start:17.89, end:18.90, text:"They know I'm gone." },
            { start:19.74, end:20.93, text:"I don't know how," },
            { start:21.82, end:22.50, text:"but they know." },
            { start:24.28, end:25.88, text:"Just keep" },
            { start:26.67, end:27.45, text:"driving." }
        ],
        2: [
            // segment 0.00-7.04: "The city is gone, I can't see the lights anymore."
            { start:0.00, end:2.40, text:"The city is gone." },
            { start:2.70, end:7.04, text:"I can't see the lights anymore." },
            // segment 7.04-13.20: "For a second, I thought I lost them, that was
            // stupid, I know how they work, I help build"
            { start:7.20, end:9.20, text:"For a second, I thought I lost them." },
            { start:9.40, end:10.40, text:"That was stupid." },
            { start:10.60, end:11.90, text:"I know how they work." },
            // segment 13.20-18.02: "this system, they don't stop, so I can't stop."
            { start:12.10, end:14.00, text:"I helped build this system." },
            { start:14.20, end:18.02, text:"They don't stop, so I can't stop." }
        ],
        3: [
            // segment 0.00-9.00: "Something changed, I can feel it, they're not
            // following anymore, they're predicting every turn, every choice."
            { start:0.00, end:1.39, text:"Something changed." },
            { start:1.69, end:2.78, text:"I can feel it." },
            { start:3.08, end:5.34, text:"They're not following anymore." },
            { start:5.64, end:9.00, text:"They're predicting every turn, every choice." },
            // segment 9.00-13.00: "They already know, I help create this."
            { start:9.00, end:10.71, text:"They already know." },
            { start:11.01, end:13.00, text:"I helped create this," },
            // segment 13.00-16.00: "And now it's coming from me."
            { start:13.00, end:16.00, text:"and now it's coming for me." }
        ],
        4: [
            // segment 0.00-8.48: "it's quiet too quiet no signals no warnings
            // nothing I spent so much time"
            { start:0.00, end:1.10, text:"It's quiet." },
            { start:1.35, end:2.35, text:"Too quiet." },
            { start:2.60, end:6.00, text:"No signals, no warnings, nothing." },
            // segment 8.48-12.48 continues: "trying to reach this place a place
            // they couldn't see a place they couldn't"
            { start:6.25, end:10.60, text:"I spent so much time trying to reach this place," },
            { start:10.80, end:12.48, text:"a place they couldn't see," },
            // segment 12.48-20.84: "control I thought I would feel safe but I
            // don't know something feels wrong when"
            { start:12.48, end:14.20, text:"a place they couldn't control." },
            { start:14.40, end:16.20, text:"I thought I would feel safe," },
            { start:16.40, end:17.60, text:"but I don't know." },
            { start:17.80, end:20.84, text:"Something feels wrong." },
            // segment 20.84-27.76: "everything disappears you start noticing
            // things you tried to forget the road is"
            { start:20.84, end:22.80, text:"When everything disappears," },
            { start:23.00, end:26.50, text:"you start noticing things you tried to forget." },
            // segment 27.76-30.02: "Still ahead, that's enough."
            { start:26.70, end:28.80, text:"The road is still ahead." },
            { start:29.00, end:30.02, text:"That's enough." },
            // segment 30.02-30.86: "Keep going."
            { start:30.02, end:30.86, text:"Keep going." }
        ],
        5: [
            // zone_voice_5 has one whisper segment per sentence, used directly.
            { start:0.00, end:3.96, text:"I'm here at the core." },
            { start:3.96, end:5.78, text:"I thought I would have more to say." },
            { start:5.78, end:8.56, text:"I imagined this moment so many times." },
            { start:8.56, end:10.10, text:"I thought I'd be angry." },
            { start:10.10, end:13.00, text:"I thought I'd want answers." },
            { start:13.00, end:16.48, text:"But I'm just tired, really tired." },
            // segment 16.48-21.84: "Everything I lost, everything I did, it all led me here."
            { start:16.48, end:18.10, text:"Everything I lost," },
            { start:18.35, end:19.88, text:"everything I did," },
            { start:20.13, end:21.84, text:"it all led me here." },
            // segment 21.84-27.20: "They spend years controlling every road, every choice, every person."
            { start:21.84, end:24.91, text:"They spent years controlling every road," },
            { start:25.16, end:27.20, text:"every choice, every person." },
            { start:27.20, end:29.24, text:"But they missed one thing." },
            // segment 29.24-33.34: "I still get to decide this ends here."
            { start:29.24, end:31.51, text:"I still get to decide." },
            { start:31.76, end:33.34, text:"This ends here." }
        ]
    };


    // =========================================================================
    // GAME OVER
    // =========================================================================

    gameOverText!: Phaser.GameObjects.Text;

    tryAgainButton!: Phaser.GameObjects.Text;

    private gameOverPanel!: Phaser.GameObjects.Graphics;


    // =========================================================================
    // EFFECT LAYERS
    // =========================================================================

    private fxLayer!: Phaser.GameObjects.Container;

    private roadFXLayer!: Phaser.GameObjects.Container;

    private carFXLayer!: Phaser.GameObjects.Container;

    private uiFXLayer!: Phaser.GameObjects.Container;


    // =========================================================================
    // SPEED FX
    // =========================================================================

    private speedLines: Phaser.GameObjects.Graphics[] = [];

    private speedFXTimer = 0;

    private speedIntensity = 0;


    // =========================================================================
    // NITRO FX
    // =========================================================================

    private nitroTrails: Phaser.GameObjects.Graphics[] = [];

    private nitroGlow!: Phaser.GameObjects.Graphics;


    // =========================================================================
    // PLAYER VISUAL
    // =========================================================================

    private playerGlow!: Phaser.GameObjects.Graphics;


    // =========================================================================
    // NITRO BUTTON
    // =========================================================================

    private nitroButton!: Phaser.GameObjects.Container;

    private nitroButtonGlow!: Phaser.GameObjects.Graphics;

    private nitroButtonLabel!: Phaser.GameObjects.Text;

    private nitroButtonHint!: Phaser.GameObjects.Text;

    private nitroButtonRing!: Phaser.GameObjects.Graphics;

    private nitroButtonCore!: Phaser.GameObjects.Graphics;

    private nitroButtonPulse = 0;

    private nitroTouchFlash!: Phaser.GameObjects.Graphics;


    // =========================================================================
    // WORLD
    // =========================================================================

    private ambientGlow!: Phaser.GameObjects.Graphics;

    private cityPulse = 0;


    // =========================================================================
    // CRYSTAL FX
    // =========================================================================

    private crystalFXTimer = 0;

    private crystalTimer = 0;


    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================

    constructor() {

        super("GameScene");

    }


    // =========================================================================
    // PLAYER VISUAL SIZE
    // =========================================================================

    /**
     * Visual dimensions are based on each car's own texture aspect ratio.
     * Gameplay stats (speed/nitro/handling/etc.) remain independent.
     * No fixed width/height pair is used, so selected cars are never stretched.
     */
    private getPlayerVisualSize(
        textureKey: string,
        fallbackWidth: number,
        fallbackHeight: number
    ): { width: number; height: number } {
        // Return the canonical bounding box. The actual sprite is fitted into
        // this box with ONE uniform scale in create(), so the source texture is
        // never stretched. Player and Traffic therefore use the same sizing rule.
        void fallbackWidth;
        void fallbackHeight;

        return getCanonicalVehicleSize(textureKey);
    }

    // =========================================================================
    // CREATE
    // =========================================================================


    /**
     * Zone road artwork lives in:
     * public/assets/zones/
     *
     * Because these files are under Vite's public directory, they must be
     * requested from the root URL as /assets/zones/<file>.
     */
    preload(): void {
        const zoneAssets: ReadonlyArray<readonly [string, string]> = [
            ["zone1_road", "/assets/zones/zone1_road.webp"],
            ["zone2_road", "/assets/zones/zone2_road.webp"],
            ["zone3_road", "/assets/zones/zone3_road.webp"],
            ["zone4_road", "/assets/zones/zone4_road.webp"],
            ["zone5_road", "/assets/zones/zone5_road.jpg"]
        ];

        for (const [key, url] of zoneAssets) {
            if (!this.textures.exists(key)) {
                this.load.image(key, url);
            }
        }
    }

    create() {

        this.gameOver = false;

        this.health = 4;

        this.distance = 0;

        this.nitroActive = false;

        this.nitroCooldown = false;

        this.hitCooldown = false;

        this.currentZone = 1;

        this.currentLevel = 1;

        this.zoneElapsed = 0;

        this.levelElapsed = 0;

        this.zoneStartDistance = 0;

        this.zoneTransitioning = false;

        this.zoneIntroActive = false;

        this.bgCycleIndex = 0;
        this.bgShuffleBag = [];
        this.lastBackgroundKey = null;

        this.endingSlowdownActive = false;

        this.endingScreenActive = false;


        // =====================================================================
        // AUDIO
        // =====================================================================

        AudioSystem.init(this);

        AudioSystem.stopMenuMusic();

        AudioSystem.playGameMusic();


        // =====================================================================
        // CAMERA
        // =====================================================================

        this.cameras.main.setBackgroundColor(
            "#05040A"
        );

        this.cameras.main.setZoom(1);


        // =====================================================================
        // CAR SYSTEM
        // =====================================================================

        this.carSystem =
            new CarSystem();


        const selectedCar =
            this.carSystem.getCar(
                SaveSystem.getSelectedCar()
            );


        if (selectedCar) {

            const upgradeLevel =
                SaveSystem.getCarUpgradeLevel(
                    selectedCar.id
                );


            this.selectedCarStats =
                this.carSystem.getUpgradedStats(
                    selectedCar,
                    upgradeLevel
                );

        }
        else {

            this.selectedCarStats =
                this.carSystem.getDefaultCar();

        }


        // =====================================================================
        // START SPEED
        // =====================================================================

        this.displaySpeed =
            this.selectedCarStats.speed;

        this.targetSpeed =
            this.selectedCarStats.speed;


        // =====================================================================
        // SYSTEMS
        // =====================================================================

        this.crystal =
            new CrystalSystem(this);


        this.mobile =
            new MobileControl(this);


        this.upgrade =
            new UpgradeSystem();


        this.crystal.setVehicleBonus(
            this.selectedCarStats.crystalMultiplier ?? 1
        );


        this.traffic =
            new TrafficSystem(
                this,
                60,
                110
            );


        this.level =
            new LevelSystem();


        this.world =
            new WorldManager(this);


        this.scoreSystem =
            new ScoreSystem();


        // =====================================================================
        // GAME HUD
        // =====================================================================

        this.hud =
            new GameHUD(this);


        // =====================================================================
        // KEYBOARD
        // =====================================================================

        this.input.keyboard?.on(
            "keydown-LEFT",
            () => {

                this.mobile.left = true;

            }
        );


        this.input.keyboard?.on(
            "keyup-LEFT",
            () => {

                this.mobile.left = false;

            }
        );


        this.input.keyboard?.on(
            "keydown-RIGHT",
            () => {

                this.mobile.right = true;

            }
        );


        this.input.keyboard?.on(
            "keyup-RIGHT",
            () => {

                this.mobile.right = false;

            }
        );


        this.input.keyboard?.on(
            "keydown-SPACE",
            () => {

                this.mobile.nitro = true;

            }
        );


        this.input.keyboard?.on(
            "keyup-SPACE",
            () => {

                this.mobile.nitro = false;

            }
        );


        // =====================================================================
        // ROAD
        // =====================================================================

        this.road1 =
            this.add.image(
                200,
                400,
                this.getCurrentRoadTexture()
            );


        this.road2 =
            this.add.image(
                200,
                400 - this.ROAD_SPACING,
                this.getCurrentRoadTexture()
            );


        this.fitRoadImage(
            this.road1
        );

        this.fitRoadImage(
            this.road2
        );


        // Tiny world-space transition strip between environment cards.
        this.roadGapFX =
            this.add.graphics();

        this.roadGapFX.setDepth(1);
        this.roadGapFX.setAlpha(0.92);
        this.drawRoadGapFX();


        this.road1.setDepth(0);

        this.road2.setDepth(0);


        // =====================================================================
        // EFFECT LAYERS
        // =====================================================================

        this.roadFXLayer =
            this.add.container(
                0,
                0
            );

        this.roadFXLayer.setDepth(10);


        this.fxLayer =
            this.add.container(
                0,
                0
            );

        this.fxLayer.setDepth(150);


        this.carFXLayer =
            this.add.container(
                0,
                0
            );

        this.carFXLayer.setDepth(90);


        this.uiFXLayer =
            this.add.container(
                0,
                0
            );

        this.uiFXLayer.setDepth(450);


        // =====================================================================
        // PLAYER
        // =====================================================================

        this.car =
            this.add.sprite(
                200,
                550,
                selectedCar
                    ? selectedCar.texture
                    : "player"
            );


        // Each selected car gets its own natural visual size.
        // The source texture aspect ratio is preserved, so cars are never
        // stretched horizontally or vertically.
        const playerTexture =
            selectedCar
                ? selectedCar.texture
                : "player";

        const playerVisual =
            this.getPlayerVisualSize(
                playerTexture,
                this.selectedCarStats.width,
                this.selectedCarStats.height
            );

        // Keep gameplay code and collision bounds synchronized with the
        // actual rendered footprint of the selected vehicle.
        // Fit the car INSIDE the canonical box with a uniform scale.
        // setDisplaySize(width, height) would distort assets whose source
        // aspect ratio differs (this was the main cause of the stretched cars).
        const frameWidth = Math.max(1, this.car.frame?.width ?? playerVisual.width);
        const frameHeight = Math.max(1, this.car.frame?.height ?? playerVisual.height);
        const fitScale = Math.min(
            playerVisual.width / frameWidth,
            playerVisual.height / frameHeight
        );
        this.car.setScale(fitScale);

        // Store the REAL rendered footprint for road bounds/collision.
        this.selectedCarStats.width =
            this.car.displayWidth;
        this.selectedCarStats.height =
            this.car.displayHeight;


        this.car.setOrigin(
            0.5
        );


        this.car.setDepth(
            100
        );


        this.car.clearTint();

        // Keep TrafficSystem collision/near-miss bounds exactly in sync with
        // the rendered player car.
        this.traffic.setPlayerCollisionBounds(
            this.car.displayWidth,
            this.car.displayHeight
        );

        // Give TrafficSystem the canonical player reference. This prevents its
        // spawn-safety / near-miss logic from falling back to scene-name lookup.
        this.traffic.setPlayer(this.car);

        // Let the player drag their finger directly on the car to steer it,
        // in addition to the on-screen left/right buttons.
        this.mobile.setCarTarget(this.car);

                // checkNearMiss is private on TrafficSystem and already runs every
        // frame inside its own update() — listen for the event it emits
        // instead of calling the (inaccessible) method directly.
        this.traffic.onEvent(
            event => {

                if (
                    event.type ===
                    "nearMiss"
                ) {

                    this.scoreSystem.addNearMiss();

                    this.addNearMissEffect();

                }
            }
        );


        // =====================================================================
        // PLAYER GLOW
        // =====================================================================

        this.playerGlow =
            this.add.graphics();

        this.playerGlow.setDepth(
            95
        );


        // =====================================================================
        // NITRO GLOW
        // =====================================================================

        this.nitroGlow =
            this.add.graphics();

        this.nitroGlow.setDepth(
            91
        );


        // =====================================================================
        // AMBIENT
        // =====================================================================

        this.ambientGlow =
            this.add.graphics();

        this.ambientGlow.setDepth(
            5
        );

        this.drawAmbientGlow();


        // =====================================================================
        // ONLY NITRO BUTTON
        // GAME HUD CONTROLS THE REST
        // =====================================================================

        this.createPremiumNitroButton();


        // =====================================================================
        // ZONE STORY
        // =====================================================================

        this.createZoneIntroUI();


        // =====================================================================
        // ENDING UI
        // =====================================================================

        this.createEndingUI();


        // =====================================================================
        // GAME OVER
        // =====================================================================

        this.createGameOverUI();


        // =====================================================================
        // INTRO
        // =====================================================================

        this.createGameIntro();


        // =====================================================================
        // START FX
        // =====================================================================

        this.createInitialSpeedLines();


        // =====================================================================
        // FIRST ZONE STORY
        // =====================================================================

        this.time.delayedCall(
            900,
            () => {

                if (!this.gameOver) {

                    this.showZoneIntro(
                        1,
                        true
                    );

                }

            }
        );

    }


    // =========================================================================
    // ZONE ROAD TEXTURE
    // =========================================================================

    private getCurrentRoadTexture(): string {
        const key =
            this.ZONE_IMAGES[
                Phaser.Math.Clamp(
                    this.currentZone - 1,
                    0,
                    this.ZONE_IMAGES.length - 1
                )
            ];

        if (
            key &&
            this.textures.exists(key)
        ) {
            return key;
        }

        // Safe fallback keeps the road alive if an asset was not loaded.
        if (this.textures.exists("road1")) {
            return "road1";
        }

        if (this.textures.exists("road2")) {
            return "road2";
        }

        // Final fallback only when the game's original road assets are missing.
        return key ?? "road1";
    }

    private fitRoadImage(
        image: Phaser.GameObjects.Image
    ): void {
        // IMPORTANT: do not crop the road artwork. Cropping the side matte and
        // then stretching the crop to 400px is what created the visible zoom.
        // Keep the complete source image and fit it to the game's native road
        // size without changing its aspect ratio.
        const targetW = this.scale.width || 400;
        const targetH = this.ROAD_HEIGHT;

        image.setCrop();
        image.setDisplaySize(targetW, targetH);
        image.setOrigin(0.5, 0.5);
        image.x = 200;
    }

    // =========================================================================
    // MICRO GAP VISUAL
    // =========================================================================

    private drawRoadGapFX() {
        // Intentionally empty. Roads now touch edge-to-edge with no black seam.
        if (this.roadGapFX) {
            this.roadGapFX.clear();
            this.roadGapFX.setVisible(false);
        }
    }

    private updateRoadGapFX(
        _delta = 16.6667
    ) {
        if (!this.roadGapFX) {
            return;
        }

        this.roadGapFX.clear();
        this.roadGapFX.setVisible(false);
    }

    // =========================================================================
    // NITRO BUTTON
    // =========================================================================

    private createPremiumNitroButton() {

        this.nitroButton =
            this.add.container(
                200,
                735
            );


        this.nitroButton.setDepth(
            460
        );


        this.nitroButtonGlow =
            this.add.graphics();


        this.nitroButtonCore =
            this.add.graphics();


        this.nitroButtonRing =
            this.add.graphics();


        this.nitroTouchFlash =
            this.add.graphics();


        this.nitroButtonLabel =
            this.add.text(
                0,
                -7,
                "NITRO",
                {
                    fontFamily:
                        "Arial Black",

                    fontSize:
                        "17px",

                    color:
                        "#ffffff",

                    stroke:
                        "#00151c",

                    strokeThickness:
                        5,

                    align:
                        "center"
                }
            );


        this.nitroButtonLabel.setOrigin(
            0.5
        );


        this.nitroButtonHint =
            this.add.text(
                0,
                15,
                "TAP TO BOOST",
                {
                    fontFamily:
                        "Arial Black",

                    fontSize:
                        "7px",

                    color:
                        "#62f6ff",

                    align:
                        "center"
                }
            );


        this.nitroButtonHint.setOrigin(
            0.5
        );


        this.nitroButton.add([
            this.nitroButtonGlow,
            this.nitroButtonCore,
            this.nitroButtonRing,
            this.nitroTouchFlash,
            this.nitroButtonLabel,
            this.nitroButtonHint
        ]);


        this.nitroButton.setSize(
            200,
            75
        );


        this.nitroButton.setInteractive({
            hitArea:
                new Phaser.Geom.Rectangle(
                    -100,
                    -38,
                    200,
                    76
                ),

            hitAreaCallback:
                Phaser.Geom.Rectangle.Contains,

            useHandCursor:
                true
        });


        this.nitroButton.on(
            "pointerdown",
            () => {

                if (
                    this.gameOver ||
                    this.zoneIntroActive
                ) {

                    return;

                }


                this.mobile.nitro =
                    true;


                this.activateNitroButtonFlash();

            }
        );


        this.nitroButton.on(
            "pointerup",
            () => {

                this.mobile.nitro =
                    false;

            }
        );


        this.nitroButton.on(
            "pointerout",
            () => {

                this.mobile.nitro =
                    false;

            }
        );


        this.nitroButton.on(
            "pointerover",
            () => {

                if (
                    !this.nitroActive &&
                    !this.nitroCooldown
                ) {

                    this.tweens.add({
                        targets:
                            this.nitroButton,

                        scale:
                            1.04,

                        duration:
                            120,

                        ease:
                            "Cubic.easeOut"
                    });

                }

            }
        );


        this.nitroButton.on(
            "pointerout",
            () => {

                this.tweens.add({
                    targets:
                        this.nitroButton,

                    scale:
                        1,

                    duration:
                        120
                });

            }
        );

    }


    private activateNitroButtonFlash() {

        if (
            !this.nitroTouchFlash
        ) {

            return;

        }


        this.nitroTouchFlash.clear();


        this.nitroTouchFlash.fillStyle(
            0xffffff,
            0.35
        );


        this.nitroTouchFlash.fillRoundedRect(
            -90,
            -28,
            180,
            56,
            20
        );


        this.tweens.add({
            targets:
                this.nitroTouchFlash,

            alpha:
                0,

            duration:
                180,

            onComplete:
                () => {

                    this.nitroTouchFlash.clear();

                    this.nitroTouchFlash.alpha =
                        1;

                }
        });

    }


    private updatePremiumNitroButton(
        delta: number
    ) {

        if (
            !this.nitroButton
        ) {

            return;

        }


        this.nitroButtonPulse +=
            delta *
            0.006;


        const pulse =
            1 +
            Math.sin(
                this.nitroButtonPulse
            ) *
            0.035;


        this.nitroButtonGlow.clear();

        this.nitroButtonCore.clear();

        this.nitroButtonRing.clear();


        if (
            this.nitroActive
        ) {

            this.nitroButtonGlow.fillStyle(
                0x00ffff,
                0.16
            );


            this.nitroButtonGlow.fillRoundedRect(
                -106 * pulse,
                -43 * pulse,
                212 * pulse,
                86 * pulse,
                30
            );


            this.nitroButtonCore.fillStyle(
                0x00ffff,
                0.13
            );


            this.nitroButtonCore.fillRoundedRect(
                -84,
                -20,
                168,
                40,
                16
            );


            this.nitroButtonRing.lineStyle(
                3,
                0xffffff,
                0.9
            );


            this.nitroButtonRing.strokeRoundedRect(
                -100,
                -35,
                200,
                70,
                25
            );


            this.nitroButtonLabel.setText(
                "BOOST"
            );


            this.nitroButtonLabel.setColor(
                "#ffffff"
            );


            this.nitroButtonHint.setText(
                `${Math.ceil(
                    this.nitroTimer /
                    1000
                )} SEC`
            );


            this.nitroButtonHint.setColor(
                "#00ffff"
            );

        }
        else if (
            this.nitroCooldown
        ) {

            this.nitroButtonGlow.fillStyle(
                0x34434b,
                0.12
            );


            this.nitroButtonGlow.fillRoundedRect(
                -103,
                -42,
                206,
                84,
                28
            );


            this.nitroButtonCore.fillStyle(
                0x1b252a,
                0.9
            );


            this.nitroButtonCore.fillRoundedRect(
                -84,
                -20,
                168,
                40,
                16
            );


            this.nitroButtonRing.lineStyle(
                2,
                0x596a74,
                0.65
            );


            this.nitroButtonRing.strokeRoundedRect(
                -99,
                -35,
                198,
                70,
                24
            );


            this.nitroButtonLabel.setText(
                "RECHARGING"
            );


            this.nitroButtonLabel.setColor(
                "#8797a1"
            );


            this.nitroButtonHint.setText(
                `${Math.ceil(
                    this.nitroTimer /
                    1000
                )} SEC`
            );


            this.nitroButtonHint.setColor(
                "#8797a1"
            );

        }
        else {

            this.nitroButtonGlow.fillStyle(
                0x00ffff,
                0.10
            );


            this.nitroButtonGlow.fillRoundedRect(
                -103 * pulse,
                -42 * pulse,
                206 * pulse,
                84 * pulse,
                29
            );


            this.nitroButtonCore.fillStyle(
                0x00ffff,
                0.07
            );


            this.nitroButtonCore.fillRoundedRect(
                -84,
                -20,
                168,
                40,
                16
            );


            this.nitroButtonRing.lineStyle(
                2.5,
                0x00ffff,
                0.85
            );


            this.nitroButtonRing.strokeRoundedRect(
                -99,
                -35,
                198,
                70,
                24
            );


            this.nitroButtonLabel.setText(
                "NITRO"
            );


            this.nitroButtonLabel.setColor(
                "#ffffff"
            );


            this.nitroButtonHint.setText(
                "TAP TO BOOST"
            );


            this.nitroButtonHint.setColor(
                "#62f6ff"
            );

        }

    }


    // =========================================================================
    // ZONE INTRO UI
    // =========================================================================

    private createZoneIntroUI() {

        this.zoneIntroContainer =
            this.add.container(
                0,
                0
            );


        this.zoneIntroContainer.setDepth(
            500
        );


        const backdrop =
            this.add.graphics();


        backdrop.fillStyle(
            0x02050b,
            0.96
        );


        backdrop.fillRect(
            0,
            0,
            400,
            800
        );


        const topLine =
            this.add.graphics();


        topLine.fillStyle(
            0x00ffff,
            0.85
        );


        topLine.fillRect(
            24,
            125,
            352,
            2
        );


        const bottomLine =
            this.add.graphics();


        bottomLine.fillStyle(
            0x00ffff,
            0.35
        );


        bottomLine.fillRect(
            65,
            650,
            270,
            1
        );


        this.zoneSubtitleText =
            this.add.text(
                200,
                165,
                "ZONE 01",
                {
                    fontFamily:
                        "Arial Black",

                    fontSize:
                        "11px",

                    color:
                        "#62f6ff",

                    letterSpacing:
                        3,

                    align:
                        "center"
                } as any
            );


        this.zoneSubtitleText.setOrigin(
            0.5
        );


        this.zoneTitleText =
            this.add.text(
                200,
                215,
                "NEON CITY",
                {
                    fontFamily:
                        "Arial Black",

                    fontSize:
                        "30px",

                    color:
                        "#ffffff",

                    stroke:
                        "#00171c",

                    strokeThickness:
                        7,

                    align:
                        "center"
                }
            );


        this.zoneTitleText.setOrigin(
            0.5
        );


        this.zoneStoryText =
            this.add.text(
                200,
                335,
                "",
                {
                    fontFamily:
                        "Arial",

                    fontSize:
                        "15px",

                    color:
                        "#dffcff",

                    lineSpacing:
                        10,

                    align:
                        "center",

                    wordWrap:
                        {
                            width:
                                330
                        }
                }
            );


        this.zoneStoryText.setOrigin(
            0.5
        );


        this.zoneProgressText =
            this.add.text(
                200,
                475,
                "LEVEL 01  •  10 LEVELS",
                {
                    fontFamily:
                        "Arial Black",

                    fontSize:
                        "11px",

                    color:
                        "#7defff",

                    align:
                        "center"
                }
            );


        this.zoneProgressText.setOrigin(
            0.5
        );


        this.zoneContinueText =
            this.add.text(
                200,
                545,
                "[  TAP TO SKIP  ]",
                {
                    fontFamily:
                        "Arial Black",

                    fontSize:
                        "15px",

                    color:
                        "#00ffff",

                    stroke:
                        "#00171c",

                    strokeThickness:
                        4,

                    align:
                        "center"
                }
            );


        this.zoneContinueText.setOrigin(
            0.5
        );


        this.zoneContinueText.setInteractive({
            useHandCursor:
                true
        });


        this.zoneContinueText.on(
            "pointerover",
            () => {

                this.zoneContinueText.setScale(
                    1.06
                );

            }
        );


        this.zoneContinueText.on(
            "pointerout",
            () => {

                this.zoneContinueText.setScale(
                    1
                );

            }
        );


        this.zoneContinueText.on(
            "pointerdown",
            () => {

                if (
                    !this.zoneIntroActive
                ) {

                    return;

                }


                AudioSystem.click();

                this.closeZoneIntro();

            }
        );


        this.zoneIntroContainer.add([
            backdrop,
            topLine,
            bottomLine,
            this.zoneSubtitleText,
            this.zoneTitleText,
            this.zoneStoryText,
            this.zoneProgressText,
            this.zoneContinueText
        ]);


        this.zoneIntroContainer.setVisible(
            false
        );

    }


    // =========================================================================
    // SHOW ZONE INTRO
    // =========================================================================

    private showZoneIntro(
        zone: number,
        firstIntro = false
    ) {

        const safeZone =
            Phaser.Math.Clamp(
                zone,
                1,
                this.TOTAL_ZONES
            );


        const data =
            this.ZONE_DATA[
                safeZone - 1
            ];


        this.currentZone =
            safeZone;


        this.currentLevel =
            1;


        this.zoneElapsed =
            0;


        this.levelElapsed =
            0;


        this.zoneStartDistance =
            this.distance;


        this.zoneIntroActive =
            true;


        this.mobile.left =
            false;

        this.mobile.right =
            false;

        this.mobile.nitro =
            false;


        this.zoneSubtitleText.setText(
            data.subtitle
        );


        this.zoneTitleText.setText(
            data.title
        );


        this.storyFullText =
            data.story;

        this.storyTypeIndex = 0;
        this.storyTypeTimer = 0;
        this.currentNarrationLine = -1;
        this.narrationFinished = false;

        this.zoneStoryText.setText(
            ""
        );
        this.zoneStoryText.setAlpha(1);
        this.zoneStoryText.setScale(1);


        this.zoneProgressText.setText(
            "LEVEL 01  •  10 LEVELS"
        );


        this.zoneIntroContainer.setVisible(
            true
        );


        this.zoneIntroContainer.setAlpha(
            0
        );


        this.zoneIntroContainer.setScale(
            0.96
        );


        this.tweens.add({
            targets:
                this.zoneIntroContainer,

            alpha:
                1,

            scale:
                1,

            duration:
                firstIntro
                    ? 350
                    : 450,

            ease:
                "Cubic.easeOut"
        });


        this.tweens.add({
            targets:
                this.zoneContinueText,

            alpha:
                0.45,

            duration:
                650,

            yoyo:
                true,

            repeat:
                -1
        });


        this.playZoneVoice(
            safeZone,
            data.voice
        );

    }


    // =========================================================================
    // CLOSE ZONE INTRO
    // =========================================================================

    private closeZoneIntro() {

        if (
            !this.zoneIntroActive
        ) {

            return;

        }


        this.stopStoryVoice();


        this.zoneIntroActive =
            false;


        this.tweens.killTweensOf(
            this.zoneIntroContainer
        );


        this.tweens.killTweensOf(
            this.zoneContinueText
        );


        this.tweens.add({
            targets:
                this.zoneIntroContainer,

            alpha:
                0,

            scale:
                1.04,

            duration:
                300,

            ease:
                "Cubic.easeIn",

            onComplete:
                () => {

                    this.zoneIntroContainer.setVisible(
                        false
                    );

                    this.zoneIntroContainer.setScale(
                        1
                    );

                }
        });

    }


    // =========================================================================
    // ZONE PROGRESSION
    // =========================================================================

    // Returns how much distance must be driven per level inside the given
    // zone (1-based). Later zones require more distance, i.e. levels come
    // slower/harder as the run progresses.
    private getDistancePerLevelForZone(
        zone: number
    ): number {

        const index =
            Phaser.Math.Clamp(
                zone - 1,
                0,
                this.ZONE_DISTANCE_PER_LEVEL.length - 1
            );

        return (
            this.ZONE_DISTANCE_PER_LEVEL[index] ??
            this.DISTANCE_PER_LEVEL
        );

    }

    private updateZoneProgress(
        delta: number
    ) {

        // ---------------------------------------------------------
        // ENDING SCREEN TYPEWRITER (takes priority)
        // ---------------------------------------------------------

        if (
            this.endingScreenActive
        ) {

            this.storyTypeTimer +=
                delta;


            if (
                this.storyTypeIndex <
                    this.storyFullText.length &&
                this.storyTypeTimer >=
                    24
            ) {

                this.storyTypeTimer =
                    0;


                this.storyTypeIndex++;


                this.endingStoryText.setText(
                    this.storyFullText.slice(
                        0,
                        this.storyTypeIndex
                    )
                );

            }


            return;

        }


        if (
            this.zoneIntroActive
        ) {
            this.updateZoneNarration();
            return;
        }


        if (
            this.zoneTransitioning
        ) {

            return;

        }


        this.zoneElapsed +=
            delta;


        // LEVEL now advances by distance traveled since this zone started,
        // not by real time. Driving faster (including via Nitro) reaches
        // the next level sooner. ZONE progress is derived from the same
        // distance value below, so the two stay in sync.
        const distanceIntoZone =
            this.distance -
            this.zoneStartDistance;


        const distancePerLevel =
            this.getDistancePerLevelForZone(
                this.currentZone
            );


        while (
            this.currentLevel <
                this.LEVELS_PER_ZONE &&
            distanceIntoZone >=
                this.currentLevel *
                distancePerLevel
        ) {

            this.currentLevel++;


            this.createLevelUpEffect();

        }


        // ZONE now finishes as soon as the distance for all
        // LEVELS_PER_ZONE levels has been covered, instead of on a
        // separate real-time timer. This keeps level and zone progress
        // in sync: reaching level 10 no longer leaves you idle waiting
        // for an unrelated timer to expire.
        const zoneDistanceRequired =
            this.LEVELS_PER_ZONE *
            distancePerLevel;

        if (
            distanceIntoZone >=
            zoneDistanceRequired
        ) {

            if (
                this.currentZone <
                this.TOTAL_ZONES
            ) {

                this.beginZoneTransition(
                    this.currentZone + 1
                );

            }
            else {

                this.beginGameEnding();

            }

        }

    }


    // =========================================================================
    // ZONE TRANSITION
    // =========================================================================

    private beginZoneTransition(
        nextZone: number
    ) {

        if (
            this.zoneTransitioning
        ) {

            return;

        }


        this.zoneTransitioning =
            true;


        this.mobile.left =
            false;

        this.mobile.right =
            false;

        this.mobile.nitro =
            false;


        const transition =
            this.add.graphics();


        transition.setDepth(
            550
        );


        transition.fillStyle(
            0x02040a,
            0
        );


        transition.fillRect(
            0,
            0,
            400,
            800
        );


        this.tweens.add({
            targets:
                transition,

            alpha:
                1,

            duration:
                500,

            ease:
                "Cubic.easeIn",

            onComplete:
                () => {

                    this.currentZone =
                        nextZone;


                    this.currentLevel =
                        1;


                    this.zoneElapsed =
                        0;


                    this.levelElapsed =
                        0;


                    this.zoneStartDistance =
                        this.distance;


                    this.bgCycleIndex =
                        0;

                    this.road1.setTexture(
                        this.getCurrentRoadTexture()
                    );

                    this.road2.setTexture(
                        this.getCurrentRoadTexture()
                    );

                    this.fitRoadImage(
                        this.road1
                    );

                    this.fitRoadImage(
                        this.road2
                    );

                    // Rebuild the micro-seam with the new Zone's accent language.
                    this.drawRoadGapFX();


                    this.tweens.add({
                        targets:
                            transition,

                        alpha:
                            0,

                        duration:
                            500,

                        ease:
                            "Cubic.easeOut",

                        onComplete:
                            () => {

                                transition.destroy();

                                this.zoneTransitioning =
                                    false;

                                this.showZoneIntro(
                                    nextZone
                                );

                            }

                    });

                }

        });

    }


    // =========================================================================
    // LEVEL UP FX
    // =========================================================================

    private createLevelUpEffect() {

        const text =
            this.add.text(
                200,
                310,
                `LEVEL ${this.currentLevel
                    .toString()
                    .padStart(2, "0")}`,
                {
                    fontFamily:
                        "Arial Black",

                    fontSize:
                        "30px",

                    color:
                        "#00ffff",

                    stroke:
                        "#00151c",

                    strokeThickness:
                        7
                }
            );


        text.setOrigin(
            0.5
        );


        text.setDepth(
            400
        );


        text.setScale(
            0.5
        );


        text.setAlpha(
            0
        );


        this.cameras.main.flash(
            100,
            0,
            255,
            255,
            false
        );


        this.tweens.add({
            targets:
                text,

            alpha:
                1,

            scale:
                1,

            duration:
                300,

            ease:
                "Back.easeOut",

            onComplete:
                () => {

                    this.tweens.add({
                        targets:
                            text,

                        y:
                            250,

                        alpha:
                            0,

                        scale:
                            1.25,

                        duration:
                            550,

                        ease:
                            "Cubic.easeIn",

                        onComplete:
                            () => {

                                text.destroy();

                            }

                    });

                }

        });

    }


    // =========================================================================
    // ZONE VOICE
    // =========================================================================

    private playZoneVoice(
        zone: number,
        fallbackText: string
    ) {
        this.stopStoryVoice();

        this.currentNarrationLine = -1;
        this.narrationFinished = false;
        this.narrationTimeScale = 1;

        const audioKey = `zone_voice_${zone}`;
        this.storyAudioKey = audioKey;

        if (this.cache.audio.exists(audioKey)) {
            try {
                const sound = this.sound.add(audioKey);

                this.storyVoicePlaying = true;
                this.currentZoneSound = sound;

                // The supplied MP3 is the absolute master clock.
                // Never stretch subtitle timestamps to another duration.
                this.narrationTimeScale = 1;

                console.log(
                    "[NARRATION DEBUG] real audio path, zone:", zone,
                    "assumedDuration:", (this.ZONE_NARRATION_LINES[zone] ?? []).slice(-1)[0]?.end,
                    "actualDuration:", (sound as any).duration,
                    "scale:", this.narrationTimeScale
                );

                sound.once(
                    Phaser.Sound.Events.COMPLETE,
                    () => {
                        this.storyVoicePlaying = false;
                        this.narrationFinished = true;
                        this.showFinalNarrationLine(zone);

                        this.time.delayedCall(650, () => {
                            if (this.zoneIntroActive) {
                                this.closeZoneIntro();
                            }
                        });
                    }
                );

                sound.once(
                    Phaser.Sound.Events.DESTROY,
                    () => {
                        this.storyVoicePlaying = false;
                    }
                );

                sound.play();
                return;
            } catch {}
        }

        this.playFallbackNarration(zone, fallbackText);
    }

    // Rescales the hand-authored ZONE_NARRATION_LINES timestamps (which
    // were measured against one specific export of the voice file) to the
    // duration of whatever audio asset is actually loaded and about to
    // play. Falls back to 1 (no rescale) whenever the real duration can't
    // be read yet or looks unusable, so it never makes things worse.
    private computeNarrationTimeScale(
        sound: Phaser.Sound.BaseSound,
        zone: number
    ): number {
        // Timestamps are measured against the exact supplied MP3 assets.
        // Never stretch/compress them: sentence boundaries must follow the
        // real waveform, including pauses inside a single sentence.
        return 1;
    }

    private updateZoneNarration() {
        if (!this.currentZoneSound || !this.storyVoicePlaying) {
            return;
        }

        const lines = this.ZONE_NARRATION_LINES[this.currentZone] ?? [];
        if (!lines.length) return;

        const soundAny = this.currentZoneSound as any;
        const time =
            typeof soundAny.seek === "number"
                ? soundAny.seek
                : typeof soundAny.seek === "function"
                    ? soundAny.seek()
                    : 0;

        // If the audio contains speech that is not present in the supplied
        // transcript, never display the previous sentence over it.
        const unmapped = this.ZONE_UNMAPPED_AUDIO[this.currentZone] ?? [];
        const inUnmappedAudio = unmapped.some(
            range => time >= range.start && time < range.end
        );
        if (inUnmappedAudio) {
            if (this.currentNarrationLine !== -2) {
                this.currentNarrationLine = -2;
                this.zoneStoryText.setText("");
                this.zoneStoryText.setAlpha(0);
            }
            return;
        }

        let lineIndex = -1;

        // The displayed line changes on the next spoken phrase start.
        // We intentionally keep the previous line during natural micro-pauses
        // so the UI never flickers or goes blank between two words/phrases.
        for (let i = 0; i < lines.length; i++) {
            const start = lines[i].start;
            if (time >= start) lineIndex = i;
            else break;
        }

        // Before the first phrase there is no line to show.
        if (time < lines[0].start) lineIndex = -1;

        if (lineIndex === this.currentNarrationLine) return;

        this.currentNarrationLine = lineIndex;

        if (lineIndex < 0) {
            this.tweens.add({
                targets: this.zoneStoryText,
                alpha: 0,
                duration: 80
            });
            return;
        }

        const line = lines[lineIndex];

        // Exact sync mode: change the text immediately at the audio seek
        // position. No tween/fade is allowed to introduce visual latency.
        this.zoneStoryText.setText(line.text);
        this.zoneStoryText.setAlpha(1);
        this.zoneStoryText.setScale(1);

        // Do not add a camera shake here: narration timing should be visually exact.
    }

    private showFinalNarrationLine(zone: number) {
        const lines = this.ZONE_NARRATION_LINES[zone] ?? [];
        if (!lines.length) return;

        const last = lines[lines.length - 1];
        this.currentNarrationLine = lines.length - 1;
        this.zoneStoryText.setText(last.text);
        this.zoneStoryText.setAlpha(1);
        this.zoneStoryText.setScale(1);
    }

    private playFallbackNarration(zone: number, fallbackText: string) {
        const lines = this.ZONE_NARRATION_LINES[zone] ?? [];

        console.log(
            "[NARRATION DEBUG] fallback TTS path (no zone_voice_" + zone + " audio in cache), zone:", zone
        );

        if (!("speechSynthesis" in window) || !lines.length) {
            this.zoneStoryText.setText(fallbackText);
            this.zoneStoryText.setAlpha(1);
            this.storyVoicePlaying = false;
            return;
        }

        window.speechSynthesis.cancel();

        let index = 0;
        this.storyVoicePlaying = true;

        const speakNext = () => {
            if (!this.zoneIntroActive || index >= lines.length) {
                this.storyVoicePlaying = false;
                this.narrationFinished = true;
                if (this.zoneIntroActive) {
                    this.time.delayedCall(650, () => this.closeZoneIntro());
                }
                return;
            }

            const text = lines[index].text;
            this.currentNarrationLine = index;
            this.zoneStoryText.setText(text);
            this.zoneStoryText.setAlpha(1);

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = "en-US";
            utterance.rate = 0.88;
            utterance.pitch = 0.80;
            utterance.volume = 0.9;

            utterance.onend = () => {
                index++;
                speakNext();
            };

            utterance.onerror = () => {
                this.storyVoicePlaying = false;
            };

            this.storyVoice = utterance;
            window.speechSynthesis.speak(utterance);
        };

        speakNext();
    }


    // =========================================================================
    // CHROME SPEECH
    // =========================================================================

    private speakStory(
        text: string
    ) {

        try {

            if (
                !("speechSynthesis" in window)
            ) {

                this.storyVoicePlaying =
                    false;

                return;

            }


            window.speechSynthesis.cancel();


            this.storyVoice =
                new SpeechSynthesisUtterance(
                    text.replace(
                        /\n/g,
                        " "
                    )
                );


            this.storyVoice.lang =
                "en-US";


            this.storyVoice.rate =
                0.88;


            this.storyVoice.pitch =
                0.80;


            this.storyVoice.volume =
                0.9;


            const voices =
                window.speechSynthesis.getVoices();


            const preferred =
                voices.find(
                    voice =>
                        voice.lang
                            .toLowerCase()
                            .startsWith(
                                "en"
                            )
                );


            if (
                preferred
            ) {

                this.storyVoice.voice =
                    preferred;

            }


            this.storyVoice.onend =
                () => {

                    this.storyVoicePlaying =
                        false;

                };


            this.storyVoice.onerror =
                () => {

                    this.storyVoicePlaying =
                        false;

                };


            this.storyVoicePlaying =
                true;


            window.speechSynthesis.speak(
                this.storyVoice
            );

        }
        catch {

            this.storyVoicePlaying =
                false;

        }

    }


    // =========================================================================
    // STOP STORY VOICE
    // =========================================================================

    private stopStoryVoice() {

        this.storyVoicePlaying =
            false;


        try {

            if (
                "speechSynthesis" in
                window
            ) {

                window
                    .speechSynthesis
                    .cancel();

            }

        }
        catch {}


        if (
            this.currentZoneSound
        ) {

            this.currentZoneSound.stop();

            this.currentZoneSound.destroy();

            this.currentZoneSound =
                undefined;

        }

    }


    // =========================================================================
    // ENEMY WARNING
    // =========================================================================

    private updateEnemyWarning(
        delta: number
    ) {

        this.enemyWarningCooldown =
            Math.max(
                0,
                this.enemyWarningCooldown -
                    delta
            );


        const chasing =
            this.traffic.isHunterChasing();


        if (
            chasing &&
            !this.enemyWarningActive
        ) {

            this.enemyWarningActive =
                true;


            if (
                this.enemyWarningCooldown <=
                0
            ) {

                this.enemyWarningCooldown =
                    7000;


                this.showEnemyWarning();

                this.playEnemyWarningSound();

            }

        }
        else if (
            !chasing
        ) {

            this.enemyWarningActive =
                false;


            if (
                this.enemyWarningText
            ) {

                this.enemyWarningText.destroy();

                this.enemyWarningText =
                    undefined;

            }

        }

    }


    // =========================================================================
    // ENEMY WARNING UI
    // =========================================================================

    private showEnemyWarning() {

        if (
            this.enemyWarningText
        ) {

            this.enemyWarningText.destroy();

        }


        this.enemyWarningText =
            this.add.text(
                200,
                105,
                "⚠ PURSUIT SIGNAL",
                {
                    fontFamily:
                        "Arial Black",

                    fontSize:
                        "15px",

                    color:
                        "#ff315c",

                    stroke:
                        "#24000b",

                    strokeThickness:
                        5,

                    align:
                        "center"
                }
            );


        this.enemyWarningText.setOrigin(
            0.5
        );


        this.enemyWarningText.setDepth(
            390
        );


        this.enemyWarningText.setScale(
            0.7
        );


        this.tweens.add({
            targets:
                this.enemyWarningText,

            scale:
                1,

            alpha:
                0,

            duration:
                900,

            ease:
                "Cubic.easeOut",

            onComplete:
                () => {

                    if (
                        this.enemyWarningText
                    ) {

                        this.enemyWarningText.destroy();

                        this.enemyWarningText =
                            undefined;

                    }

                }

        });

    }


    // =========================================================================
    // ENEMY WARNING SOUND
    // =========================================================================

    private playEnemyWarningSound() {

        try {

            const soundManager =
                this.sound as
                    Phaser.Sound.WebAudioSoundManager;

            const ctx =
                soundManager?.context;


            if (
                !ctx
            ) {

                return;

            }


            const now =
                ctx.currentTime;


            const oscillator =
                ctx.createOscillator();


            const gain =
                ctx.createGain();


            oscillator.type =
                "sawtooth";


            oscillator.frequency.setValueAtTime(
                720,
                now
            );


            oscillator.frequency.exponentialRampToValueAtTime(
                260,
                now + 0.24
            );


            gain.gain.setValueAtTime(
                0.0001,
                now
            );


            gain.gain.exponentialRampToValueAtTime(
                0.16,
                now + 0.025
            );


            gain.gain.exponentialRampToValueAtTime(
                0.0001,
                now + 0.28
            );


            oscillator.connect(
                gain
            );


            gain.connect(
                ctx.destination
            );


            oscillator.start(
                now
            );


            oscillator.stop(
                now + 0.3
            );

        }
        catch {}

    }


    // =========================================================================
    // AMBIENT GLOW
    // =========================================================================

    private drawAmbientGlow() {

        this.ambientGlow.clear();


        this.ambientGlow.fillStyle(
            0x00ffff,
            0.025
        );


        this.ambientGlow.fillRect(
            0,
            0,
            400,
            800
        );


        this.ambientGlow.fillStyle(
            0x8a2be2,
            0.035
        );


        this.ambientGlow.fillCircle(
            20,
            400,
            170
        );


        this.ambientGlow.fillCircle(
            380,
            400,
            170
        );

    }


    // =========================================================================
    // SPEED LINES
    // =========================================================================

    private createInitialSpeedLines() {

        for (
            let i = 0;
            i < 12;
            i++
        ) {

            this.createSpeedLine(
                Phaser.Math.Between(
                    20,
                    380
                ),
                Phaser.Math.Between(
                    0,
                    800
                )
            );

        }

    }


    private createSpeedLine(
        x: number,
        y: number
    ) {

        const line =
            this.add.graphics();


        line.setDepth(
            18
        );


        const length =
            Phaser.Math.Between(
                15,
                55
            );


        line.lineStyle(
            1.5,
            0x5eeaff,
            0.18
        );


        line.beginPath();

        line.moveTo(
            x,
            y
        );

        line.lineTo(
            x,
            y + length
        );

        line.strokePath();


        this.speedLines.push(
            line
        );

    }


    private updateSpeedLines(
        delta: number
    ) {

        this.speedFXTimer +=
            delta;


        const intensity =
            Phaser.Math.Clamp(
                (
                    this.speed - 2
                ) / 11,
                0,
                1
            );


        this.speedIntensity =
            Phaser.Math.Linear(
                this.speedIntensity,
                intensity,
                0.08
            );


        if (
            this.speedFXTimer >
            Phaser.Math.Linear(
                260,
                65,
                this.speedIntensity
            )
        ) {

            this.speedFXTimer =
                0;


            const count =
                Math.floor(
                    Phaser.Math.Linear(
                        1,
                        3,
                        this.speedIntensity
                    )
                );


            for (
                let i = 0;
                i < count;
                i++
            ) {

                this.createSpeedLine(
                    Phaser.Math.Between(
                        25,
                        375
                    ),
                    Phaser.Math.Between(
                        -40,
                        100
                    )
                );

            }

        }


        for (
            const line of
            this.speedLines
        ) {

            if (
                !line.active
            ) {

                continue;

            }


            line.y +=
                (
                    5 +
                    this.speed *
                    1.8
                ) *
                (
                    delta /
                    16.6667
                );


            line.alpha =
                Phaser.Math.Clamp(
                    0.05 +
                    this.speedIntensity *
                    0.35,
                    0.05,
                    0.42
                );


            if (
                line.y >
                850
            ) {

                line.destroy();

            }

        }


        this.speedLines =
            this.speedLines.filter(
                line =>
                    line.active
            );

    }


    // =========================================================================
    // NITRO ACTIVATION
    // =========================================================================

    activateNitro() {

        if (
            this.nitroActive ||
            this.nitroCooldown ||
            this.gameOver
        ) {

            return;

        }


        AudioSystem.nitro();


        this.nitroActive =
            true;


        this.nitroTimer =
            this.nitroDuration;


        this.nitroFXTimer =
            0;


        this.nitroPulse =
            0;


        this.car.clearTint();


        this.cameras.main.shake(
            170,
            0.004
        );


        this.cameras.main.zoomTo(
            1.05,
            170
        );


        this.createNitroShockwave();

        this.createNitroBurst();

        this.createNitroMegaFX();


        this.displaySpeed +=
            this.selectedCarStats.nitro *
            1.3;


        this.displaySpeed =
            Math.min(
                this.displaySpeed,
                this.NITRO_MAX_SPEED
            );

    }


    // =========================================================================
    // NITRO UPDATE
    // =========================================================================

    private updateNitroFX(
        delta: number
    ) {

        if (
            !this.nitroActive
        ) {

            this.nitroGlow.clear();

            return;

        }


        this.nitroFXTimer +=
            delta;


        this.nitroPulse +=
            delta *
            0.015;


        this.nitroGlow.clear();


        const pulse =
            1 +
            Math.sin(
                this.nitroPulse
            ) *
            0.15;


        const radius =
            65 *
            pulse;


        this.nitroGlow.fillStyle(
            0x00ffff,
            0.11
        );


        this.nitroGlow.fillCircle(
            this.car.x,
            this.car.y + 35,
            radius
        );


        this.nitroGlow.fillStyle(
            0x8a5cff,
            0.08
        );


        this.nitroGlow.fillCircle(
            this.car.x,
            this.car.y + 48,
            radius * 0.7
        );


        if (
            this.nitroFXTimer >
            40
        ) {

            this.nitroFXTimer =
                0;


            this.createNitroTrail();


            if (
                Phaser.Math.Between(
                    1,
                    100
                ) <=
                50
            ) {

                this.createNitroSpark();

            }

        }

    }


    // =========================================================================
    // NITRO TRAIL
    // =========================================================================

    private createNitroTrail() {

        const g =
            this.add.graphics();


        g.setDepth(
            89
        );


        const side =
            Phaser.Math.Between(
                0,
                1
            ) === 0
                ? -1
                : 1;


        const x =
            this.car.x +
            side *
            12;


        const y =
            this.car.y +
            this.selectedCarStats.height *
            0.42;


        const length =
            Phaser.Math.Between(
                35,
                78
            );


        g.fillStyle(
            side === 1
                ? 0x00ffff
                : 0x8a5cff,
            0.65
        );


        g.beginPath();

        g.moveTo(
            x - 4,
            y
        );

        g.lineTo(
            x + 4,
            y
        );

        g.lineTo(
            x +
            Phaser.Math.Between(
                -5,
                5
            ),
            y + length
        );

        g.closePath();

        g.fillPath();


        this.nitroTrails.push(
            g
        );


        this.tweens.add({
            targets:
                g,

            alpha:
                0,

            scaleX:
                0.25,

            scaleY:
                1.45,

            y:
                y + length,

            duration:
                Phaser.Math.Between(
                    160,
                    260
                ),

            ease:
                "Cubic.easeOut",

            onComplete:
                () => {

                    g.destroy();

                }

        });

    }


    // =========================================================================
    // NITRO SPARK
    // =========================================================================

    private createNitroSpark() {

        const g =
            this.add.graphics();


        g.setDepth(
            92
        );


        const x =
            this.car.x +
            Phaser.Math.Between(
                -20,
                20
            );


        const y =
            this.car.y +
            this.selectedCarStats.height *
            0.35;


        g.fillStyle(
            0xffffff,
            0.9
        );


        g.fillCircle(
            x,
            y,
            Phaser.Math.FloatBetween(
                1,
                2.5
            )
        );


        this.tweens.add({
            targets:
                g,

            y:
                y +
                Phaser.Math.Between(
                    20,
                    60
                ),

            x:
                x +
                Phaser.Math.Between(
                    -15,
                    15
                ),

            alpha:
                0,

            scale:
                {
                    from:
                        1,

                    to:
                        0.1
                },

            duration:
                220,

            onComplete:
                () => {

                    g.destroy();

                }

        });

    }


    // =========================================================================
    // NITRO SHOCKWAVE
    // =========================================================================

    private createNitroShockwave() {

        const g =
            this.add.graphics();


        g.setDepth(
            80
        );


        g.lineStyle(
            3,
            0x00ffff,
            0.75
        );


        g.strokeCircle(
            this.car.x,
            this.car.y,
            18
        );


        this.tweens.add({
            targets:
                g,

            scaleX:
                4.2,

            scaleY:
                2.3,

            alpha:
                0,

            duration:
                420,

            ease:
                "Cubic.easeOut",

            onComplete:
                () => {

                    g.destroy();

                }

        });

    }


    // =========================================================================
    // NITRO BURST
    // =========================================================================

    private createNitroBurst() {

        for (
            let i = 0;
            i < 34;
            i++
        ) {

            const g =
                this.add.graphics();


            g.setDepth(
                85
            );


            const x =
                this.car.x +
                Phaser.Math.Between(
                    -25,
                    25
                );


            const y =
                this.car.y +
                25;


            g.fillStyle(
                i % 2 === 0
                    ? 0x00ffff
                    : 0x8a5cff,
                0.88
            );


            g.fillCircle(
                x,
                y,
                Phaser.Math.Between(
                    3,
                    7
                )
            );


            this.tweens.add({
                targets:
                    g,

                y:
                    y +
                    Phaser.Math.Between(
                        70,
                        170
                    ),

                x:
                    x +
                    Phaser.Math.Between(
                        -25,
                        25
                    ),

                alpha:
                    0,

                scale:
                    0.1,

                duration:
                    Phaser.Math.Between(
                        220,
                        440
                    ),

                ease:
                    "Cubic.easeOut",

                onComplete:
                    () => {

                        g.destroy();

                    }

            });

        }

    }


    // =========================================================================
    // NITRO MEGA FX
    // =========================================================================

    private createNitroMegaFX() {

        // ---------------------------------------------------------
        // ENERGY RINGS
        // ---------------------------------------------------------

        for (
            let i = 0;
            i < 7;
            i++
        ) {

            const ring =
                this.add.graphics();


            ring.setDepth(
                88
            );


            ring.lineStyle(
                i === 0
                    ? 3
                    : 2,
                i % 2 === 0
                    ? 0x00ffff
                    : 0x8a5cff,
                0.72
            );


            ring.strokeCircle(
                this.car.x,
                this.car.y + 12,
                18 +
                i *
                8
            );


            this.tweens.add({
                targets:
                    ring,

                scaleX:
                    4.6 +
                    i,

                scaleY:
                    2.2 +
                    i *
                    0.4,

                alpha:
                    0,

                duration:
                    380 +
                    i *
                    110,

                delay:
                    i *
                    45,

                ease:
                    "Cubic.easeOut",

                onComplete:
                    () => {

                        ring.destroy();

                    }

            });

        }


        // ---------------------------------------------------------
        // ENERGY PARTICLES
        // ---------------------------------------------------------

        for (
            let i = 0;
            i < 44;
            i++
        ) {

            const p =
                this.add.graphics();


            p.setDepth(
                88
            );


            const side =
                i % 2 === 0
                    ? -1
                    : 1;


            const x =
                this.car.x +
                side *
                Phaser.Math.Between(
                    6,
                    22
                );


            const y =
                this.car.y +
                this.selectedCarStats.height *
                0.42;


            p.fillStyle(
                i % 3 === 0
                    ? 0xffffff
                    : i % 3 === 1
                        ? 0x00ffff
                        : 0x8a5cff,
                0.82
            );


            p.fillCircle(
                x,
                y,
                Phaser.Math.Between(
                    2,
                    5
                )
            );


            this.tweens.add({
                targets:
                    p,

                x:
                    x +
                    Phaser.Math.Between(
                        -28,
                        28
                    ),

                y:
                    y +
                    Phaser.Math.Between(
                        70,
                        150
                    ),

                scale:
                    {
                        from:
                            1.5,

                        to:
                            0.1
                    },

                alpha:
                    0,

                duration:
                    Phaser.Math.Between(
                        220,
                        480
                    ),

                ease:
                    "Cubic.easeOut",

                onComplete:
                    () => {

                        p.destroy();

                    }

            });

        }


        // ---------------------------------------------------------
        // SPEED STREAKS
        // ---------------------------------------------------------

        for (
            let i = 0;
            i < 34;
            i++
        ) {

            const line =
                this.add.graphics();


            line.setDepth(
                20
            );


            const x =
                Phaser.Math.Between(
                    18,
                    382
                );


            const y =
                Phaser.Math.Between(
                    0,
                    800
                );


            const length =
                Phaser.Math.Between(
                    70,
                    190
                );


            line.lineStyle(
                Phaser.Math.FloatBetween(
                    1,
                    3
                ),
                i % 2 === 0
                    ? 0x00ffff
                    : 0xffffff,
                0.55
            );


            line.beginPath();

            line.moveTo(
                x,
                y
            );

            line.lineTo(
                x,
                y + length
            );

            line.strokePath();


            this.tweens.add({
                targets:
                    line,

                y:
                    y + 500,

                alpha:
                    0,

                scaleY:
                    1.3,

                duration:
                    Phaser.Math.Between(
                        260,
                        520
                    ),

                ease:
                    "Cubic.easeIn",

                onComplete:
                    () => {

                        line.destroy();

                    }

            });

        }


        // ---------------------------------------------------------
        // CAMERA
        // ---------------------------------------------------------

        this.cameras.main.shake(
            260,
            0.009
        );


        this.cameras.main.flash(
            160,
            120,
            255,
            255,
            false
        );


        this.cameras.main.zoomTo(
            1.065,
            110,
            "Cubic.easeOut"
        );


        this.time.delayedCall(
            170,
            () => {

                this.cameras.main.zoomTo(
                    1,
                    260,
                    "Cubic.easeOut"
                );

            }
        );


        if (
            this.nitroButton
        ) {

            this.tweens.add({
                targets:
                    this.nitroButton,

                scale:
                    {
                        from:
                            1.12,

                        to:
                            1
                    },

                duration:
                    260,

                ease:
                    "Back.easeOut"
            });

        }

    }


    // =========================================================================
    // NITRO TRAIL UPDATE
    // =========================================================================

    private updateNitroTrails() {

        this.nitroTrails =
            this.nitroTrails.filter(
                trail =>
                    trail.active
            );

    }


    // =========================================================================
    // NITRO END
    // =========================================================================

    private createNitroEndEffect() {

        const g =
            this.add.graphics();


        g.setDepth(
            85
        );


        g.lineStyle(
            2,
            0x00ffff,
            0.6
        );


        g.strokeCircle(
            this.car.x,
            this.car.y,
            12
        );


        this.tweens.add({
            targets:
                g,

            scaleX:
                2.6,

            scaleY:
                1.4,

            alpha:
                0,

            duration:
                300,

            ease:
                "Cubic.easeOut",

            onComplete:
                () => {

                    g.destroy();

                }

        });

    }


    // =========================================================================
    // PLAYER GLOW
    // =========================================================================

    private updatePlayerGlow() {

        this.playerGlow.clear();


        const glowColor =
            this.nitroActive
                ? 0x00ffff
                : 0x197cff;


        const alpha =
            this.nitroActive
                ? 0.12
                : 0.045;


        this.playerGlow.fillStyle(
            glowColor,
            alpha
        );


        this.playerGlow.fillEllipse(
            this.car.x,
            this.car.y + 22,
            this.nitroActive
                ? 42
                : 28,
            this.nitroActive
                ? 70
                : 42
        );

    }


    // =========================================================================
    // COLLISION EFFECT
    // =========================================================================

    addHitEffect() {

        this.cameras.main.shake(
            220,
            0.008
        );


        this.cameras.main.flash(
            120,
            255,
            40,
            60,
            false
        );


        const flash =
            this.add.graphics();


        flash.setDepth(
            400
        );


        flash.fillStyle(
            0xff1744,
            0.18
        );


        flash.fillRect(
            0,
            0,
            400,
            800
        );


        this.tweens.add({
            targets:
                flash,

            alpha:
                0,

            duration:
                320,

            onComplete:
                () => {

                    flash.destroy();

                }

        });


        const ring =
            this.add.graphics();


        ring.setDepth(
            170
        );


        ring.lineStyle(
            4,
            0xff355d,
            0.85
        );


        ring.strokeCircle(
            this.car.x,
            this.car.y,
            18
        );


        this.tweens.add({
            targets:
                ring,

            scaleX:
                2.8,

            scaleY:
                1.7,

            alpha:
                0,

            duration:
                320,

            ease:
                "Cubic.easeOut",

            onComplete:
                () => {

                    ring.destroy();

                }

        });


        for (
            let i = 0;
            i < 16;
            i++
        ) {

            const spark =
                this.add.graphics();


            spark.setDepth(
                180
            );


            spark.fillStyle(
                i % 2 === 0
                    ? 0xff365d
                    : 0xffffff,
                0.9
            );


            spark.fillCircle(
                this.car.x,
                this.car.y,
                Phaser.Math.Between(
                    1,
                    3
                )
            );


            this.tweens.add({
                targets:
                    spark,

                x:
                    this.car.x +
                    Phaser.Math.Between(
                        -100,
                        100
                    ),

                y:
                    this.car.y +
                    Phaser.Math.Between(
                        -80,
                        80
                    ),

                alpha:
                    0,

                duration:
                    Phaser.Math.Between(
                        180,
                        380
                    ),

                onComplete:
                    () => {

                        spark.destroy();

                    }

            });

        }


        this.car.setTint(
            0xff365d
        );


        this.tweens.add({
            targets:
                this.car,

            alpha:
                0.35,

            duration:
                80,

            yoyo:
                true,

            repeat:
                2,

            onComplete:
                () => {

                    this.car.alpha =
                        1;

                    this.car.clearTint();

                }

        });

    }


    // =========================================================================
    // NEAR MISS
    // =========================================================================

    private addNearMissEffect() {

        const text =
            this.add.text(
                this.car.x,
                this.car.y - 70,
                "NEAR MISS",
                {
                    fontFamily:
                        "Arial Black",

                    fontSize:
                        "18px",

                    color:
                        "#00ffff",

                    stroke:
                        "#00151a",

                    strokeThickness:
                        6
                }
            );


        text.setOrigin(
            0.5
        );


        text.setDepth(
            300
        );


        this.tweens.add({
            targets:
                text,

            y:
                text.y - 45,

            alpha:
                0,

            scale:
                1.25,

            duration:
                650,

            ease:
                "Cubic.easeOut",

            onComplete:
                () => {

                    text.destroy();

                }

        });


        this.cameras.main.shake(
            80,
            0.0012
        );

    }


    // =========================================================================
    // CRYSTAL PICKUP FX
    // =========================================================================

    private addCrystalPickupEffect() {

        const x =
            this.car.x;


        const y =
            this.car.y - 35;


        // ---------------------------------------------------------
        // Main ring
        // ---------------------------------------------------------

        const ring =
            this.add.graphics();


        ring.setDepth(
            190
        );


        ring.lineStyle(
            3,
            0x00ffff,
            0.9
        );


        ring.strokeCircle(
            x,
            y,
            9
        );


        this.tweens.add({
            targets:
                ring,

            scale:
                3.2,

            alpha:
                0,

            duration:
                380,

            ease:
                "Cubic.easeOut",

            onComplete:
                () => {

                    ring.destroy();

                }

        });


        // ---------------------------------------------------------
        // Inner flash
        // ---------------------------------------------------------

        const flash =
            this.add.graphics();


        flash.setDepth(
            191
        );


        flash.fillStyle(
            0xffffff,
            0.95
        );


        flash.fillCircle(
            x,
            y,
            4
        );


        this.tweens.add({
            targets:
                flash,

            scale:
                3,

            alpha:
                0,

            duration:
                220,

            onComplete:
                () => {

                    flash.destroy();

                }

        });


        // ---------------------------------------------------------
        // Crystal shards
        // ---------------------------------------------------------

        for (
            let i = 0;
            i < 12;
            i++
        ) {

            const spark =
                this.add.graphics();


            spark.setDepth(
                192
            );


            spark.fillStyle(
                i % 3 === 0
                    ? 0xffffff
                    : i % 3 === 1
                        ? 0x00ffff
                        : 0x8a5cff,
                0.95
            );


            spark.fillCircle(
                x,
                y,
                Phaser.Math.Between(
                    1.5,
                    3
                )
            );


            this.tweens.add({
                targets:
                    spark,

                x:
                    x +
                    Phaser.Math.Between(
                        -60,
                        60
                    ),

                y:
                    y +
                    Phaser.Math.Between(
                        -55,
                        35
                    ),

                scale:
                    {
                        from:
                            1.3,

                        to:
                            0.1
                    },

                alpha:
                    0,

                duration:
                    Phaser.Math.Between(
                        260,
                        480
                    ),

                ease:
                    "Cubic.easeOut",

                onComplete:
                    () => {

                        spark.destroy();

                    }

            });

        }


        // ---------------------------------------------------------
        // Pickup text
        // ---------------------------------------------------------

        const text =
            this.add.text(
                x,
                y - 18,
                "+ CRYSTAL",
                {
                    fontFamily:
                        "Arial Black",

                    fontSize:
                        "11px",

                    color:
                        "#62f6ff",

                    stroke:
                        "#00151c",

                    strokeThickness:
                        4
                }
            );


        text.setOrigin(
            0.5
        );


        text.setDepth(
            300
        );


        this.tweens.add({
            targets:
                text,

            y:
                y - 50,

            alpha:
                0,

            scale:
                1.15,

            duration:
                550,

            ease:
                "Cubic.easeOut",

            onComplete:
                () => {

                    text.destroy();

                }

        });

    }


    // =========================================================================
    // MAGNET PICKUP FX
    // =========================================================================

    private addMagnetPickupEffect() {

        const x =
            this.car.x;


        const y =
            this.car.y -
            25;


        const ring =
            this.add.graphics();


        ring.setDepth(
            195
        );


        ring.lineStyle(
            3,
            0xff4dff,
            0.9
        );


        ring.strokeCircle(
            x,
            y,
            12
        );


        this.tweens.add({
            targets:
                ring,

            scale:
                3.4,

            alpha:
                0,

            duration:
                420,

            ease:
                "Cubic.easeOut",

            onComplete:
                () => {

                    ring.destroy();

                }

        });


        for (
            let i = 0;
            i < 14;
            i++
        ) {

            const spark =
                this.add.graphics();


            spark.setDepth(
                196
            );


            spark.fillStyle(
                i % 2 === 0
                    ? 0xff4dff
                    : 0xffffff,
                0.95
            );


            spark.fillCircle(
                x,
                y,
                Phaser.Math.Between(
                    1,
                    3
                )
            );


            this.tweens.add({
                targets:
                    spark,

                x:
                    x +
                    Phaser.Math.Between(
                        -70,
                        70
                    ),

                y:
                    y +
                    Phaser.Math.Between(
                        -70,
                        30
                    ),

                scale:
                    0.1,

                alpha:
                    0,

                duration:
                    Phaser.Math.Between(
                        250,
                        500
                    ),

                ease:
                    "Cubic.easeOut",

                onComplete:
                    () => {

                        spark.destroy();

                    }

            });

        }


        const text =
            this.add.text(
                x,
                y - 18,
                "MAGNET",
                {
                    fontFamily:
                        "Arial Black",

                    fontSize:
                        "11px",

                    color:
                        "#ff73ff",

                    stroke:
                        "#19001c",

                    strokeThickness:
                        4
                }
            );


        text.setOrigin(
            0.5
        );


        text.setDepth(
            300
        );


        this.tweens.add({
            targets:
                text,

            y:
                y - 48,

            alpha:
                0,

            scale:
                1.15,

            duration:
                600,

            ease:
                "Cubic.easeOut",

            onComplete:
                () => {

                    text.destroy();

                }

        });

    }


    // =========================================================================
    // ENDING UI (ZONE 5 COMPLETION)
    // =========================================================================

    private createEndingUI() {

        this.endingContainer =
            this.add.container(
                0,
                0
            );


        this.endingContainer.setDepth(
            520
        );


        const backdrop =
            this.add.graphics();


        backdrop.fillStyle(
            0x02050b,
            0.97
        );


        backdrop.fillRect(
            0,
            0,
            400,
            800
        );


        const title =
            this.add.text(
                200,
                280,
                "MISSION COMPLETE",
                {
                    fontFamily:
                        "Arial Black",

                    fontSize:
                        "28px",

                    color:
                        "#00ffff",

                    stroke:
                        "#00171c",

                    strokeThickness:
                        7,

                    align:
                        "center"
                }
            );


        title.setOrigin(
            0.5
        );


        this.endingStoryText =
            this.add.text(
                200,
                380,
                "",
                {
                    fontFamily:
                        "Arial",

                    fontSize:
                        "15px",

                    color:
                        "#dffcff",

                    lineSpacing:
                        10,

                    align:
                        "center",

                    wordWrap:
                        {
                            width:
                                330
                        }
                }
            );


        this.endingStoryText.setOrigin(
            0.5
        );


        const restartBtn =
            this.add.text(
                200,
                520,
                "[  PLAY AGAIN  ]",
                {
                    fontFamily:
                        "Arial Black",

                    fontSize:
                        "18px",

                    color:
                        "#00ffff",

                    stroke:
                        "#00171c",

                    strokeThickness:
                        4
                }
            );


        restartBtn.setOrigin(
            0.5
        );


        restartBtn.setInteractive({
            useHandCursor:
                true
        });


        restartBtn.on(
            "pointerover",
            () => {

                restartBtn.setScale(
                    1.06
                );

            }
        );


        restartBtn.on(
            "pointerout",
            () => {

                restartBtn.setScale(
                    1
                );

            }
        );


        restartBtn.on(
            "pointerdown",
            () => {

                AudioSystem.click();

                AudioSystem.stopGameMusic();

                this.scene.restart();

            }
        );


        this.endingContainer.add([
            backdrop,
            title,
            this.endingStoryText,
            restartBtn
        ]);


        this.endingContainer.setVisible(
            false
        );

    }


    // =========================================================================
    // BEGIN GAME ENDING (Zone 5 complete -> slow down -> ending screen)
    // =========================================================================

    private beginGameEnding() {

        if (
            this.endingSlowdownActive ||
            this.gameOver
        ) {

            return;

        }


        this.endingSlowdownActive =
            true;


        this.mobile.left =
            false;

        this.mobile.right =
            false;

        this.mobile.nitro =
            false;


        this.cameras.main.zoomTo(
            1.08,
            2200,
            "Cubic.easeOut"
        );


        this.time.delayedCall(
            2200,
            () => {

                this.endingSlowdownActive =
                    false;

                this.zoneTransitioning =
                    true;

                this.showEndingScreen();

            }
        );

    }


    // =========================================================================
    // SHOW ENDING SCREEN
    // =========================================================================

    private showEndingScreen() {

        this.endingScreenActive =
            true;


        this.storyFullText =
            this.ENDING_STORY;


        this.storyTypeIndex =
            0;


        this.storyTypeTimer =
            0;


        this.endingStoryText.setText(
            ""
        );


        this.endingContainer.setVisible(
            true
        );


        this.endingContainer.setAlpha(
            0
        );


        this.tweens.add({
            targets:
                this.endingContainer,

            alpha:
                1,

            duration:
                600,

            ease:
                "Cubic.easeOut"
        });


        SaveSystem.addCrystal(
            this.crystal.collected
        );


        SaveSystem.updateBestScore(
            this.scoreSystem.getScore()
        );

    }


    // =========================================================================
    // UPDATE
    // =========================================================================

    update() {

        const delta =
            Phaser.Math.Clamp(
                this.game.loop.delta,
                0,
                50
            );


        this.mobile.update();


        this.updatePremiumNitroButton(
            delta
        );


        if (
            this.gameOver
        ) {

            return;

        }


        // =====================================================================
        // ENDING SLOWDOWN (Zone 5 complete, before ending screen appears)
        // =====================================================================

        if (
            this.endingSlowdownActive
        ) {

            this.displaySpeed =
                Phaser.Math.Linear(
                    this.displaySpeed,
                    0,
                    0.02
                );


            this.speed =
                this.displaySpeed /
                40;


            this.road1.y +=
                this.speed;


            this.road2.y +=
                this.speed;


            if (
                this.road1.y >=
                this.ROAD_HEIGHT + this.ROAD_HEIGHT / 2
            ) {

                // The road moves downward. Once a tile leaves the bottom,
                // recycle it above the other tile so the loop stays continuous.
                this.road1.y =
                    this.road2.y -
                    this.ROAD_SPACING;

            }


            if (
                this.road2.y >=
                this.ROAD_HEIGHT + this.ROAD_HEIGHT / 2
            ) {

                this.road2.y =
                    this.road1.y -
                    this.ROAD_SPACING;

            }


            this.updateRoadGapFX(delta);


            this.updateSpeedLines(
                delta
            );


            this.updatePlayerGlow();


            return;

        }


        if (
            this.zoneIntroActive ||
            this.zoneTransitioning
        ) {

            this.updateZoneProgress(
                delta
            );

            return;

        }


        // =====================================================================
        // SPEED
        // =====================================================================

        this.targetSpeed =
            Phaser.Math.Clamp(
                this.selectedCarStats.speed +
                (
                    this.distance /
                    500
                ) *
                1,
                this.selectedCarStats.speed,
                this.MAX_SPEED
            );


        if (
            this.nitroActive
        ) {

            this.targetSpeed =
                Math.min(
                    this.NITRO_MAX_SPEED,
                    this.targetSpeed +
                    this.selectedCarStats.nitro *
                    1.3
                );

        }


        const acceleration =
            this.nitroActive
                ? 1.4
                : 0.2;


        if (
            this.displaySpeed <
            this.targetSpeed
        ) {

            this.displaySpeed +=
                acceleration *
                (
                    delta /
                    16.6667
                );

        }
        else {

            this.displaySpeed -=
                0.12 *
                (
                    delta /
                    16.6667
                );

        }


        this.displaySpeed =
            Phaser.Math.Clamp(
                this.displaySpeed,
                0,
                this.NITRO_MAX_SPEED
            );


        this.speed =
            this.displaySpeed /
            40;


        // =====================================================================
        // NITRO INPUT
        // =====================================================================

        if (
            this.mobile.nitro &&
            !this.nitroActive &&
            !this.nitroCooldown
        ) {

            this.activateNitro();

        }


        // =====================================================================
        // NITRO TIMER
        // =====================================================================

        if (
            this.nitroActive
        ) {

            this.nitroTimer -=
                delta;


            if (
                this.nitroTimer <=
                0
            ) {

                this.nitroActive =
                    false;


                this.nitroCooldown =
                    true;


                this.cameras.main.zoomTo(
                    1,
                    260
                );


                this.createNitroEndEffect();


                this.time.delayedCall(
                    5000,
                    () => {

                        if (
                            !this.gameOver
                        ) {

                            this.nitroCooldown =
                                false;

                        }

                    }
                );

            }

        }


        // =====================================================================
        // PLAYER CONTROL
        // =====================================================================

        const handlingPower =
            this.selectedCarStats.handling /
            14;


        if (
            this.mobile.left
        ) {

            this.playerX -=
                handlingPower *
                (
                    delta /
                    16.6667
                );

        }


        if (
            this.mobile.right
        ) {

            this.playerX +=
                handlingPower *
                (
                    delta /
                    16.6667
                );

        }


        // Match the actual drivable road bounds.
        // This gives the player a little more lateral freedom without
        // allowing the vehicle to leave the road.
        // Asphalt-only playable area. The yellow edge lines are outside this
        // range, so the whole Player sprite stays on the road.
        const ROAD_LEFT =
            60;


        const ROAD_RIGHT =
            340;


        const halfWidth =
            this.selectedCarStats.width /
            2;


        this.playerX =
            Phaser.Math.Clamp(
                this.playerX,
                ROAD_LEFT +
                halfWidth,
                ROAD_RIGHT -
                halfWidth
            );


        // =====================================================================
        // PLAYER ROTATION
        // =====================================================================

        let targetRotation =
            0;


        if (
            this.mobile.left
        ) {

            targetRotation =
                -0.035;

        }


        if (
            this.mobile.right
        ) {

            targetRotation =
                0.035;

        }


        this.car.rotation =
            Phaser.Math.Linear(
                this.car.rotation,
                targetRotation,
                0.18
            );


        this.car.x =
            Phaser.Math.Linear(
                this.car.x,
                this.playerX,
                0.75
            );


        // =====================================================================
        // PLAYER GLOW
        // =====================================================================

        this.updatePlayerGlow();


        // =====================================================================
        // ROAD
        // =====================================================================

        this.road1.y +=
            this.speed;


        this.road2.y +=
            this.speed;


        if (
            this.road1.y >=
            this.ROAD_HEIGHT + this.ROAD_HEIGHT / 2
        ) {

            this.road1.y =
                this.road2.y -
                this.ROAD_SPACING;

            this.road1.setTexture(
                this.getCurrentRoadTexture()
            );

            this.fitRoadImage(
                this.road1
            );

        }


        if (
            this.road2.y >=
            this.ROAD_HEIGHT + this.ROAD_HEIGHT / 2
        ) {

            this.road2.y =
                this.road1.y -
                this.ROAD_SPACING;

            this.road2.setTexture(
                this.getCurrentRoadTexture()
            );

            this.fitRoadImage(
                this.road2
            );

        }


        this.updateRoadGapFX(delta);


        // =====================================================================
        // FX
        // =====================================================================

        this.updateSpeedLines(
            delta
        );


        this.updateNitroFX(
            delta
        );


        this.updateNitroTrails();


        // =====================================================================
        // TRAFFIC
        // =====================================================================

        this.traffic.update(
            this.speed,
            this.distance,
            this.currentZone,
            this.currentLevel,
            this.nitroActive
        );


        this.updateEnemyWarning(
            delta
        );


        // =====================================================================
        // COLLISION
        // =====================================================================

        if (
            !this.DEBUG_INVINCIBLE &&
            !this.hitCooldown &&
            (
                this.traffic.checkCollision(
                    this.car
                )
            )
        ) {
            AudioSystem.crash();

            this.addHitEffect();

            this.health--;

            this.scoreSystem.resetCombo();

            this.hitCooldown =
                true;


            this.time.delayedCall(
                1000,
                () => {

                    this.hitCooldown =
                        false;

                }
            );


            if (
                this.health <=
                0
            ) {

                this.endGame();

            }

        }


        // =====================================================================
        // CRYSTAL / MAGNET
        // =====================================================================

        this.crystal.update(
            this.speed,
            this.car,
            this.nitroActive,
            this.distance
        );


        if (
            this.crystal.lastCollected >
            0
        ) {

            AudioSystem.crystal();


            this.scoreSystem.addCrystal(
                this.crystal.lastCollected
            );


            this.addCrystalPickupEffect();


            this.crystal.lastCollected =
                0;

        }


        // Try to detect magnet collection if the CrystalSystem exposes it.
        const crystalAny =
            this.crystal as any;


        if (
            crystalAny.lastMagnetCollected
        ) {

            this.addMagnetPickupEffect();

            crystalAny.lastMagnetCollected =
                0;

        }


        this.crystalTimer +=
            delta;


        if (
            this.crystalTimer >
            2500
        ) {

            this.crystal.createCrystal();

            this.crystal.createMagnet(
                this.speed
            );

            this.crystalTimer =
                0;

        }


        // =====================================================================
        // WORLD
        // =====================================================================

        this.distance +=
            this.speed;

        this.distance


        this.updateZoneProgress(
            delta
        );


        this.world.update(
            this.distance
        );


        // =====================================================================
        // SCORE
        // =====================================================================

        this.scoreSystem.update(
            delta
        );


        // =====================================================================
        // GAME HUD
        // =====================================================================

        // Keep the HUD speed stable: it changes by 1 only after the real speed
        // clearly crosses the next integer, avoiding 62/63/62/63 flicker.
        if (
            this.displaySpeed >= this.hudSpeed + 1
        ) {
            this.hudSpeed = Math.floor(this.displaySpeed);
        }
        else if (
            this.displaySpeed <= this.hudSpeed - 1
        ) {
            this.hudSpeed = Math.ceil(this.displaySpeed);
        }

        this.hud.update({

            score:
                this.scoreSystem.getScore(),

            crystals:
                this.crystal.collected,

            speed:
                this.hudSpeed,

            level:
                this.currentLevel,

            combo:
                this.scoreSystem.getCombo(),

            nitro:
                this.nitroActive,

            cooldown:
                this.nitroCooldown,

            health:
                this.health

        });

    }


    // =========================================================================
    // GAME OVER UI
    // =========================================================================

    private createGameOverUI() {

        this.gameOverPanel =
            this.add.graphics();


        this.gameOverPanel.setDepth(
            290
        );


        this.gameOverPanel.fillStyle(
            0x03050a,
            0.84
        );


        this.gameOverPanel.fillRect(
            0,
            0,
            400,
            800
        );


        this.gameOverPanel.lineStyle(
            2,
            0xff315c,
            0.35
        );


        this.gameOverPanel.strokeRect(
            20,
            255,
            360,
            285
        );


        this.gameOverPanel.setVisible(
            false
        );


        this.gameOverText =
            this.add.text(
                200,
                340,
                "SYSTEM FAILURE",
                {
                    fontFamily:
                        "Arial Black",

                    fontSize:
                        "37px",

                    color:
                        "#ff315c",

                    stroke:
                        "#140006",

                    strokeThickness:
                        9,

                    align:
                        "center"
                }
            );


        this.gameOverText.setOrigin(
            0.5
        );


        this.gameOverText.setDepth(
            300
        );


        this.gameOverText.setVisible(
            false
        );


        this.tryAgainButton =
            this.add.text(
                200,
                450,
                "[  RESTART RUN  ]",
                {
                    fontFamily:
                        "Arial Black",

                    fontSize:
                        "21px",

                    color:
                        "#00ffff",

                    stroke:
                        "#00171c",

                    strokeThickness:
                        5
                }
            );


        this.tryAgainButton.setOrigin(
            0.5
        );


        this.tryAgainButton.setDepth(
            300
        );


        this.tryAgainButton.setInteractive({
            useHandCursor:
                true
        });


        this.tryAgainButton.setVisible(
            false
        );


        this.tryAgainButton.on(
            "pointerover",
            () => {

                this.tryAgainButton.setScale(
                    1.08
                );

            }
        );


        this.tryAgainButton.on(
            "pointerout",
            () => {

                this.tryAgainButton.setScale(
                    1
                );

            }
        );


        this.tryAgainButton.on(
            "pointerdown",
            () => {

                AudioSystem.click();

                AudioSystem.stopGameMusic();

                this.scene.restart();

            }
        );

    }


    // =========================================================================
    // GAME OVER
    // =========================================================================

    endGame() {

        if (
            this.gameOver
        ) {

            return;

        }


        AudioSystem.stopGameMusic();

        this.stopStoryVoice();


        this.gameOver =
            true;


        this.stopStoryVoice();

        this.zoneIntroActive =
            false;


        this.zoneTransitioning =
            false;


        if (
            this.zoneIntroContainer
        ) {

            this.zoneIntroContainer.setVisible(
                false
            );

        }


        this.mobile.left =
            false;

        this.mobile.right =
            false;

        this.mobile.nitro =
            false;


        this.gameOverPanel.setVisible(
            true
        );


        this.gameOverText.setVisible(
            true
        );


        this.tryAgainButton.setVisible(
            true
        );


        SaveSystem.addCrystal(
            this.crystal.collected
        );


        SaveSystem.updateBestScore(
            this.scoreSystem.getScore()
        );


        this.cameras.main.shake(
            300,
            0.01
        );


        this.cameras.main.flash(
            250,
            255,
            30,
            70,
            false
        );


        this.tweens.add({
            targets:
                this.gameOverPanel,

            alpha:
                {
                    from:
                        0,

                    to:
                        1
                },

            duration:
                450,

            ease:
                "Cubic.easeOut"
        });


        this.tweens.add({
            targets:
                this.gameOverText,

            scale:
                {
                    from:
                        0.65,

                    to:
                        1
                },

            alpha:
                {
                    from:
                        0,

                    to:
                        1
                },

            duration:
                500,

            ease:
                "Back.out"
        });


        this.tweens.add({
            targets:
                this.tryAgainButton,

            y:
                {
                    from:
                        480,

                    to:
                        450
                },

            alpha:
                {
                    from:
                        0,

                    to:
                        1
                },

            delay:
                180,

            duration:
                400,

            ease:
                "Cubic.easeOut"
        });

    }


    // =========================================================================
    // GAME INTRO
    // =========================================================================

    createGameIntro() {

        const flash =
            this.add.graphics();


        flash.setDepth(
            500
        );


        flash.fillStyle(
            0x00ffff,
            0.12
        );


        flash.fillRect(
            0,
            0,
            400,
            800
        );


        this.tweens.add({
            targets:
                flash,

            alpha:
                0,

            duration:
                800,

            onComplete:
                () => {

                    flash.destroy();

                }

        });


        const text =
            this.add.text(
                200,
                400,
                "READY",
                {
                    fontFamily:
                        "Arial Black",

                    fontSize:
                        "58px",

                    color:
                        "#00ffff",

                    stroke:
                        "#00171c",

                    strokeThickness:
                        9
                }
            );


        text.setOrigin(
            0.5
        );


        text.setDepth(
            510
        );


        text.setScale(
            0.4
        );


        text.setAlpha(
            0
        );


        this.tweens.add({
            targets:
                text,

            scale:
                1,

            alpha:
                1,

            duration:
                350,

            ease:
                "Back.out",

            onComplete:
                () => {

                    this.tweens.add({
                        targets:
                            text,

                        scale:
                            1.35,

                        alpha:
                            0,

                        duration:
                            650,

                        ease:
                            "Cubic.easeIn",

                        onComplete:
                            () => {

                                text.destroy();

                            }

                    });

                }

        });

    }


    // =========================================================================
    // SHUTDOWN
    // =========================================================================

    shutdown() {

        this.stopStoryVoice();


        if (
            this.enemyWarningText
        ) {

            this.enemyWarningText.destroy();

            this.enemyWarningText =
                undefined;

        }


        AudioSystem.stopGameMusic();


        this.input.keyboard?.removeAllListeners();


        this.tweens.killAll();


        if (
            this.traffic
        ) {

            this.traffic.destroy();

        }


        if (
            this.crystal
        ) {

            this.crystal.destroy();

        }

    }


    // =========================================================================
    // DESTROY
    // =========================================================================

    destroy() {

        this.stopStoryVoice();

        this.tweens.killAll();

    }

}