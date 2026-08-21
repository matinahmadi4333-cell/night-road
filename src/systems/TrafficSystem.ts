import Phaser from "phaser";
import SaveSystem from "./SaveSystem";

// =====================================================================================
// NOVA OVERDRIVE — TRAFFIC SYSTEM v4
// =====================================================================================
// 5-ZONE LANE TRAFFIC SYSTEM
//
// ZONE 01  NEON CITY
// ZONE 02  CYBER HIGHWAY
// ZONE 03  NEON DISTRICT
// ZONE 04  VOID HIGHWAY
// ZONE 05  THE CORE
//
// FIXED / IMPROVED
// • 4 fixed lanes
// • 5 zone profiles
// • Level -> zone mapping
// • Player-car protection
// • Player texture protection
// • sport / taxi / truck / bus / super
// • enemy1 / enemy2 / enemy3
// • Zone-specific enemy activation
// • Delta-time movement
// • Adaptive spawning
// • Anti-stack spawning
// • Intelligent following
// • Emergency braking
// • Safe lane changing
// • Nitro-aware traffic
// • Collision detection
// • Near miss detection
// • Overtake events
// • Brake FX
// • Speed streak FX
// • Lane-change FX
// • Impact FX
// • Event API
// • Snapshot API
// • Mobile friendly
// • Correct 5-zone support
// • Correct vehicle sizing (trucks/buses now visibly larger)
// • Enemy pursuit trigger when enemy actually gets close
// • No duplicate pursuit event on spawn
// • Pursuit alert sound (with browser TTS fallback)
// • FIXED: zone index off-by-one bug (GameScene sends 1-5, profiles are 0-4)
// =====================================================================================


// =====================================================================================
// TYPES
// =====================================================================================

export type VehicleBehavior =
    | "sport"
    | "taxi"
    | "truck"
    | "bus"
    | "super"
    | "enemy1"
    | "enemy2"
    | "enemy3"
    | "enemy11"
    | "enemy21"
    | "enemy31";


export type TrafficEventType =
    | "spawn"
    | "destroy"
    | "nearMiss"
    | "collision"
    | "overtake"
    | "laneChange"
    | "brake"
    | "super"
    | "heavy"
    | "enemySpawn"
    | "pursuit";


export type TrafficEvent = {
    type: TrafficEventType;

    vehicle?: EnemyCar;

    impact?: number;

    lane?: number;

    zone?: number;
};


export type TrafficSnapshot = {
    count: number;

    maxCars: number;

    difficulty: number;

    zone: number;

    level: number;

    playerSpeed: number;

    nitro: boolean;
};


export type EnemyCar = {
    sprite: Phaser.GameObjects.Sprite;

    typeKey: string;

    behavior: VehicleBehavior;

    lane: number;

    laneX: number;

    targetLane: number;

    changingLane: boolean;

    laneChangeTimer: number;

    laneChangeProgress: number;

    laneReleaseTimer: number;

    behaviorTimer: number;

    blockedTimer: number;

    brakeTimer: number;

    currentSpeed: number;

    targetSpeed: number;

    minSpeed: number;

    maxSpeed: number;

    acceleration: number;

    deceleration: number;

    emergencyDeceleration: number;

    brakeChance: number;

    laneChangeChance: number;

    aggressiveness: number;

    followGap: number;

    hardGap: number;

    hitW: number;

    hitH: number;

    mass: number;

    prevX: number;

    prevY: number;

    nearMissed: boolean;

    spawnTime: number;

    overtaking: boolean;

    recentlyChangedLane: boolean;

    effectTimer: number;

    threat: number;

    reactionTimer: number;

    nitroAvoidance: number;

    storyTagged: boolean;

    // New:
    // true after the actual pursuit event has been fired.
    pursuitTriggered: boolean;

    // Timer controlling how often an enemy vehicle
    // re-evaluates chasing the player's lane.
    chaseTimer: number;

    // Integrated Hunter Brain
    hunterPhase: "approach" | "hunt" | "evaluate" | "maneuver" | "cover" | "recover";
    hunterDecisionTimer: number;
    hunterCommitTimer: number;
    hunterGoalLane: number;
    hunterLastLane: number;
    hunterPredictionX: number;
    hunterPredictionVX: number;
    hunterConfidence: number;
    hunterTrickTimer: number;
    hunterPlayerGap: number;
    hunterPassWindow: boolean;
    hunterBlocked: boolean;
    hunterMemoryLane: number;
};


// =====================================================================================
// VEHICLE DATABASE
// =====================================================================================

type VehicleType = {
    key: VehicleBehavior;

    textures: string[];

    minSpeed: number;

    maxSpeed: number;

    acceleration: number;

    deceleration: number;

    brakeChance: number;

    laneChangeChance: number;

    canChangeLane: boolean;

    aggressiveness: number;

    followGap: number;

    width: number;

    height: number;

    mass: number;

    zoneWeights: [
        number,
        number,
        number,
        number,
        number
    ];

    isEnemy?: boolean;

    enemyLevel?: number;
};


// =====================================================================================
// CANONICAL VEHICLE VISUAL SIZE
// =====================================================================================
// One final footprint is shared by Player and Traffic.
// The source PNG/WebP dimensions are intentionally ignored here so assets such
// as bus/bus1 or taxi/taxi1 cannot produce different in-game sizes.
//
// NORMAL / SUPER = 70 x 130
// TRUCK           = 90 x 180
// BUS             = 100 x 205
// =====================================================================================

export function getCanonicalVehicleSize(
    textureKey: string
): { width: number; height: number } {
    const key = String(textureKey || "").toLowerCase();

    if (key === "truck" || key === "truck1") {
        return { width: 120, height: 210 };
    }

    if (key === "bus" || key === "bus1") {
        return { width: 120, height: 400 };
    }

    // Taxi / Sport / Super and their 1-variants all use the same normal footprint.
    return { width: 100, height: 100 };
}

// =====================================================================================
// VEHICLES
// =====================================================================================

const VEHICLE_TYPES: VehicleType[] = [

    // -------------------------------------------------------------------------
    // SPORT
    // -------------------------------------------------------------------------

    {
        key: "sport",

        textures: [
            "sport",
            "sport1"
        ],

        minSpeed: 2.4,

        maxSpeed: 5.8,

        acceleration: 0.11,

        deceleration: 0.20,

        brakeChance: 4,

        laneChangeChance: 48,

        canChangeLane: true,

        aggressiveness: 0.78,

        followGap: 200,  // ← تغییر داده شده از 135 به 200

        width: 70,

        height: 130,

        mass: 1,

        zoneWeights: [
            65,
            55,
            42,
            28,
            18
        ]
    },


    // -------------------------------------------------------------------------
    // TAXI
    // -------------------------------------------------------------------------

    {
        key: "taxi",

        textures: [
            "taxi",
            "taxi1"
        ],

        minSpeed: 1.0,

        maxSpeed: 3.0,

        acceleration: 0.045,

        deceleration: 0.13,

        brakeChance: 18,

        laneChangeChance: 15,

        canChangeLane: true,

        aggressiveness: 0.35,

        followGap: 220,  // ← تغییر داده شده از 165 به 220

        width: 70,

        height: 130,

        mass: 1,

        zoneWeights: [
            40,
            30,
            22,
            8,
            5
        ]
    },


    // -------------------------------------------------------------------------
    // TRUCK
    // -------------------------------------------------------------------------

    {
        key: "truck",

        textures: [
            "truck",
            "truck1"
        ],

        minSpeed: 0.75,

        maxSpeed: 2.1,

        acceleration: 0.018,

        deceleration: 0.055,

        brakeChance: 5,

        laneChangeChance: 3,

        canChangeLane: true,

        aggressiveness: 0.08,

        followGap: 320,  // ← تغییر داده شده از 235 به 320

        width: 90,

        height: 180,

        mass: 5,

        zoneWeights: [
            8,
            20,
            28,
            18,
            12
        ]
    },


    // -------------------------------------------------------------------------
    // BUS
    // -------------------------------------------------------------------------

    {
        key: "bus",

        textures: [
            "bus",
            "bus1"
        ],

        minSpeed: 0.9,

        maxSpeed: 2.5,

        acceleration: 0.022,

        deceleration: 0.075,

        brakeChance: 10,

        laneChangeChance: 7,

        canChangeLane: true,

        aggressiveness: 0.12,

        followGap: 350,  // ← تغییر داده شده از 255 به 350

        width: 100,

        height: 205,

        mass: 6,

        zoneWeights: [
            6,
            12,
            22,
            16,
            12
        ]
    },


    // -------------------------------------------------------------------------
    // SUPER
    // -------------------------------------------------------------------------

    {
        key: "super",

        textures: [
            "super",
            "super1"
        ],

        minSpeed: 3.3,

        maxSpeed: 7.8,

        acceleration: 0.15,

        deceleration: 0.26,

        brakeChance: 2,

        laneChangeChance: 62,

        canChangeLane: true,

        aggressiveness: 0.94,

        followGap: 180,  // ← تغییر داده شده از 125 به 180

        width: 70,

        height: 130,

        mass: 1,

        zoneWeights: [
            0,
            5,
            20,
            28,
            38
        ]
    },


    // -------------------------------------------------------------------------
    // ENEMY 1 — PURSUER
    // -------------------------------------------------------------------------

    {
        key: "enemy1",

        textures: [
            "enemy1"
        ],

        minSpeed: 3.8,

        maxSpeed: 6.5,

        acceleration: 0.15,

        deceleration: 0.22,

        brakeChance: 2,

        laneChangeChance: 62,

        canChangeLane: true,

        aggressiveness: 0.86,

        followGap: 180,  // ← تغییر داده شده از 125 به 180

        width: 50,

        height: 85,

        mass: 1.1,

        zoneWeights: [
            10,
            18,
            30,
            38,
            42
        ],

        isEnemy: true,

        enemyLevel: 1
    },


    // -------------------------------------------------------------------------
    // ENEMY 2 — INTERCEPTOR
    // -------------------------------------------------------------------------

    {
        key: "enemy2",

        textures: [
            "enemy2"
        ],

        minSpeed: 4.4,

        maxSpeed: 7.2,

        acceleration: 0.18,

        deceleration: 0.25,

        brakeChance: 2,

        laneChangeChance: 70,

        canChangeLane: true,

        aggressiveness: 0.91,

        followGap: 170,  // ← تغییر داده شده از 115 به 170

        width: 52,

        height: 88,

        mass: 1.3,

        zoneWeights: [
            0,
            0,
            18,
            24,
            34
        ],

        isEnemy: true,

        enemyLevel: 2
    },


    // -------------------------------------------------------------------------
    // ENEMY 3 — ELITE HUNTER
    // -------------------------------------------------------------------------

    {
        key: "enemy3",

        textures: [
            "enemy3"
        ],

        minSpeed: 5.0,

        maxSpeed: 8.4,

        acceleration: 0.22,

        deceleration: 0.30,

        brakeChance: 1,

        laneChangeChance: 78,

        canChangeLane: true,

        aggressiveness: 0.98,

        followGap: 160,  // ← تغییر داده شده از 105 به 160

        width: 55,

        height: 92,

        mass: 1.5,

        zoneWeights: [
            0,
            0,
            0,
            12,
            38
        ],

        isEnemy: true,

        enemyLevel: 3
    },
    {
        key: "enemy11", textures: ["enemy11"], minSpeed: 4.3, maxSpeed: 7.9,
        acceleration: 0.18, deceleration: 0.27, brakeChance: 1.5,
        laneChangeChance: 72, canChangeLane: true, aggressiveness: 0.78,
        followGap: 175,  // ← تغییر داده شده از 118 به 175
        width: 52, height: 92, mass: 1.3,
        zoneWeights: [0, 8, 18, 30, 42], isEnemy: true, enemyLevel: 4
    },
    {
        key: "enemy21", textures: ["enemy21"], minSpeed: 4.6, maxSpeed: 8.3,
        acceleration: 0.20, deceleration: 0.29, brakeChance: 1.2,
        laneChangeChance: 76, canChangeLane: true, aggressiveness: 0.86,
        followGap: 165,  // ← تغییر داده شده از 112 به 165
        width: 54, height: 96, mass: 1.35,
        zoneWeights: [0, 0, 12, 28, 38], isEnemy: true, enemyLevel: 5
    },
    {
        key: "enemy31", textures: ["enemy31"], minSpeed: 4.9, maxSpeed: 8.7,
        acceleration: 0.22, deceleration: 0.31, brakeChance: 1.0,
        laneChangeChance: 82, canChangeLane: true, aggressiveness: 0.94,
        followGap: 155,  // ← تغییر داده شده از 106 به 155
        width: 56, height: 100, mass: 1.45,
        zoneWeights: [0, 0, 0, 18, 34], isEnemy: true, enemyLevel: 6
    }
];


// =====================================================================================
// ZONE PROFILES
// =====================================================================================

type ZoneProfile = {
    name: string;

    maxCars: number;

    spawnMin: number;

    spawnMax: number;

    speedMultiplier: number;

    heavyChance: number;

    laneChangeMultiplier: number;

    enemyChance: number;

    enemyMax: number;

    enemyAggression: number;

    trafficDensity: number;
};


const ZONE_PROFILES: ZoneProfile[] = [

    // -------------------------------------------------------------------------
    // ZONE 01
    // -------------------------------------------------------------------------

    {
        name: "NEON CITY",

        maxCars: 6,

        spawnMin: 200,

        spawnMax: 350,

        speedMultiplier: 0.94,

        heavyChance: 8,

        laneChangeMultiplier: 0.85,

        enemyChance: 28,

        enemyMax: 1,

        enemyAggression: 0.35,

        trafficDensity: 0.75
    },


    // -------------------------------------------------------------------------
    // ZONE 02
    // -------------------------------------------------------------------------

    {
        name: "CYBER HIGHWAY",

        maxCars: 8,

        spawnMin: 700,

        spawnMax: 1050,

        speedMultiplier: 1.04,

        heavyChance: 14,

        laneChangeMultiplier: 1.0,

        enemyChance: 34,

        enemyMax: 1,

        enemyAggression: 0.55,

        trafficDensity: 0.95
    },


    // -------------------------------------------------------------------------
    // ZONE 03
    // -------------------------------------------------------------------------

    {
        name: "NEON DISTRICT",

        maxCars: 10,

        spawnMin: 560,

        spawnMax: 850,

        speedMultiplier: 1.12,

        heavyChance: 20,

        laneChangeMultiplier: 1.18,

        enemyChance: 42,

        enemyMax: 1,

        enemyAggression: 0.75,

        trafficDensity: 1.15
    },


    // -------------------------------------------------------------------------
    // ZONE 04
    // -------------------------------------------------------------------------

    {
        name: "VOID HIGHWAY",

        maxCars: 5,

        spawnMin: 1000,

        spawnMax: 1500,

        speedMultiplier: 1.18,

        heavyChance: 5,

        laneChangeMultiplier: 0.75,

        enemyChance: 46,

        enemyMax: 1,

        enemyAggression: 0.82,

        trafficDensity: 0.50
    },


    // -------------------------------------------------------------------------
    // ZONE 05
    // -------------------------------------------------------------------------

    {
        name: "THE CORE",

        maxCars: 11,

        spawnMin: 430,

        spawnMax: 700,

        speedMultiplier: 1.28,

        heavyChance: 28,

        laneChangeMultiplier: 1.35,

        enemyChance: 52,

        enemyMax: 1,

        enemyAggression: 1.0,

        trafficDensity: 1.30
    }
];


// =====================================================================================
// TRAFFIC SYSTEM
// =====================================================================================

export default class TrafficSystem {

    public scene: Phaser.Scene;

    public cars: EnemyCar[] = [];


    // =========================================================================
    // EVENTS
    // =========================================================================

    private eventListeners:
        Array<(event: TrafficEvent) => void> = [];


    private snapshotListeners:
        Array<(snapshot: TrafficSnapshot) => void> = [];


    // =========================================================================
    // WORLD
    // =========================================================================

    private readonly SPAWN_Y = -250;

    private readonly DESPAWN_Y = 1150;

    private readonly ROAD_TOP = -80;

    private readonly ROAD_BOTTOM = 920;

    private readonly MAX_TRAFFIC = 11;

    private readonly PLAYER_SAFE_DISTANCE = 300;

    private readonly MAX_LANE_CHANGE_DISTANCE = 780;


    // =========================================================================
    // LANES
    // =========================================================================

    private readonly LANES: number[];


    // =========================================================================
    // STATE
    // =========================================================================

    private laneGroups =
        new Map<number, EnemyCar[]>();


    private spawnTimer = 0;

    private previousPlayerX: number | null = null;

    private previousPlayerY: number | null = null;

    private elapsed = 0;


    private playerWidth: number;

    private playerHeight: number;


    private lastSpawnedTypes: string[] = [];


    // =========================================================================
    // FX
    // =========================================================================

    private effectLayer?:
        Phaser.GameObjects.Container;


    private activeEffectCount = 0;

    private readonly MAX_ACTIVE_EFFECTS = 90;


    private laneChangeTweens =
        new Map<
            EnemyCar,
            Phaser.Tweens.Tween
        >();


    // =========================================================================
    // PURSUIT AUDIO
    // =========================================================================

    private pursuitAlertCooldown = 0;

    private readonly PURSUIT_ALERT_COOLDOWN_MS = 8000;

    private pursuitVoice?: SpeechSynthesisUtterance;


    // =========================================================================
    // ENEMY SPAWN PACING
    // =========================================================================

    // How long (ms) the player gets to settle into a new zone
    // before any enemy is allowed to spawn there.
    private readonly ZONE_ENEMY_GRACE_MS = 2500;

    // Minimum time (ms) between two enemy spawns, regardless of zone.
    private readonly ENEMY_SPAWN_COOLDOWN_MS = 6500;

    private zoneEnteredAt = 0;

    private lastEnemySpawnElapsed = -999999;

    private previousZoneForPacing = -1;


    // =========================================================================
    // WORLD STATE
    // =========================================================================

    private currentZone = 0;

    private currentLevel = 1;

    private currentDistance = 0;

    private currentPlayerSpeed = 0;

    private currentNitro = false;

    private lastSnapshotTime = 0;


    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================

    constructor(
        scene: Phaser.Scene,

        playerWidth = 60,

        playerHeight = 100,

        laneCenterX = 200,

        laneSpacing = 60
    ) {

        this.scene = scene;

        this.playerWidth =
            Math.max(
                1,
                playerWidth
            );

        this.playerHeight =
            Math.max(
                1,
                playerHeight
            );


        // Exactly 4 lanes.

        this.LANES = [

            laneCenterX -
            laneSpacing * 1.5,

            laneCenterX -
            laneSpacing * 0.5,

            laneCenterX +
            laneSpacing * 0.5,

            laneCenterX +
            laneSpacing * 1.5
        ];


        this.effectLayer =
            this.scene.add.container(
                0,
                0
            );

        this.effectLayer.setDepth(200);
    }


    // =========================================================================
    // EVENT API
    // =========================================================================

    public onEvent(
        listener: (event: TrafficEvent) => void
    ): () => void {

        this.eventListeners.push(
            listener
        );

        return () => {

            const index =
                this.eventListeners.indexOf(
                    listener
                );

            if (index !== -1) {

                this.eventListeners.splice(
                    index,
                    1
                );
            }
        };
    }


    public onSnapshot(
        listener: (
            snapshot: TrafficSnapshot
        ) => void
    ): () => void {

        this.snapshotListeners.push(
            listener
        );

        return () => {

            const index =
                this.snapshotListeners.indexOf(
                    listener
                );

            if (index !== -1) {

                this.snapshotListeners.splice(
                    index,
                    1
                );
            }
        };
    }


    private emitEvent(
        event: TrafficEvent
    ) {

        for (
            const listener of
            this.eventListeners
        ) {

            try {

                listener(event);

            } catch {

                // External systems must never
                // break the traffic system.
            }
        }
    }


    private emitSnapshot() {

        const snapshot:
            TrafficSnapshot = {

            count:
                this.cars.length,

            maxCars:
                this.getMaxCars(
                    this.currentDistance,
                    this.currentLevel,
                    this.currentZone
                ),

            difficulty:
                this.getDifficulty(
                    this.currentDistance,
                    this.currentLevel,
                    this.currentZone
                ),

            zone:
                this.currentZone,

            level:
                this.currentLevel,

            playerSpeed:
                this.currentPlayerSpeed,

            nitro:
                this.currentNitro
        };


        for (
            const listener of
            this.snapshotListeners
        ) {

            try {

                listener(snapshot);

            } catch {

                // Never crash traffic.
            }
        }
    }


    // =========================================================================
    // PLAYER TEXTURE
    // =========================================================================

    private getPlayerCarTexture():
        string | null {

        try {

            const selected =
                SaveSystem.getSelectedCar();


            if (!selected) {

                return null;
            }


            if (
                typeof selected ===
                "string"
            ) {

                return selected;
            }


            const data =
                selected as any;


            if (
                data &&
                typeof data.texture ===
                "string"
            ) {

                return data.texture;
            }


            if (
                data &&
                typeof data.id ===
                "string"
            ) {

                return data.id;
            }

        } catch {

            return null;
        }


        return null;
    }


    private getAllowedTextures(
        textures: string[]
    ): string[] {

        const safeTextures =
            textures.filter(
                texture =>
                    typeof texture ===
                    "string" &&
                    texture.length > 0
            );


        if (!safeTextures.length) {

            return [];
        }


        const playerTexture =
            this.getPlayerCarTexture();


        if (!playerTexture) {

            return safeTextures;
        }


        const filtered =
            safeTextures.filter(
                texture =>
                    texture !==
                    playerTexture
            );


        return filtered.length
            ? filtered
            : safeTextures;
    }


    // =========================================================================
    // ZONE
    // =========================================================================

    private getZoneFromLevel(
        level: number
    ): number {

        // Level 1-9  -> Zone 0
        // Level 10-19 -> Zone 1
        // Level 20-29 -> Zone 2
        // Level 30-39 -> Zone 3
        // Level 40+ -> Zone 4

        return Phaser.Math.Clamp(

            Math.floor(
                Math.max(
                    1,
                    level
                ) / 10
            ),

            0,

            4
        );
    }


    private getZoneProfile(
        zone: number
    ): ZoneProfile {

        const safeZone =
            Phaser.Math.Clamp(

                Math.floor(zone),

                0,

                ZONE_PROFILES.length - 1
            );


        return ZONE_PROFILES[
            safeZone
        ];
    }


    // =========================================================================
    // VEHICLE SELECTION
    // =========================================================================

    private pickVehicleType(
        zone: number
    ): VehicleType {

        const safeZone =
            Phaser.Math.Clamp(
                Math.floor(zone),
                0,
                4
            );


        const available =
            VEHICLE_TYPES.filter(
                vehicle =>
                    !vehicle.isEnemy &&
                    vehicle.zoneWeights[
                        safeZone
                    ] > 0
            );


        if (!available.length) {

            return VEHICLE_TYPES[0];
        }


        const total =
            available.reduce(

                (
                    sum,
                    vehicle
                ) =>

                    sum +
                    vehicle.zoneWeights[
                        safeZone
                    ],

                0
            );


        let roll =
            Phaser.Math.Between(
                1,
                total
            );


        for (
            const vehicle of
            available
        ) {

            const weight =
                vehicle.zoneWeights[
                    safeZone
                ];


            if (
                roll <= weight
            ) {

                return vehicle;
            }


            roll -= weight;
        }


        return available[
            available.length - 1
        ];
    }


    private chooseVehicle(
        zone: number
    ): VehicleType {

        for (
            let i = 0;
            i < 12;
            i++
        ) {

            const candidate =
                this.pickVehicleType(
                    zone
                );


            const repeated =
                this.lastSpawnedTypes.filter(
                    type =>
                        type ===
                        candidate.key
                ).length;


            if (
                repeated < 2
            ) {

                return candidate;
            }
        }


        return this.pickVehicleType(
            zone
        );
    }


    private chooseEnemy(
        zone: number
    ): VehicleType | null {

        const profile =
            this.getZoneProfile(
                zone
            );


        if (
            profile.enemyMax <= 0
        ) {

            console.log("[ENEMY DEBUG] blocked: enemyMax<=0 for zone", zone, profile);
            return null;
        }


        // Give the player a few clear seconds after entering
        // a new zone before any enemy is allowed to appear.
        if (
            this.elapsed -
            this.zoneEnteredAt <
            this.ZONE_ENEMY_GRACE_MS
        ) {

            console.log(
                "[ENEMY DEBUG] blocked: zone grace period",
                "elapsed=", this.elapsed,
                "zoneEnteredAt=", this.zoneEnteredAt,
                "remaining_ms=", this.ZONE_ENEMY_GRACE_MS - (this.elapsed - this.zoneEnteredAt)
            );
            return null;
        }


        // Enforce a minimum gap between enemy spawns so multiple
        // enemies never appear in a sudden burst.
        if (
            this.elapsed -
            this.lastEnemySpawnElapsed <
            this.ENEMY_SPAWN_COOLDOWN_MS
        ) {

            console.log(
                "[ENEMY DEBUG] blocked: cooldown",
                "elapsed=", this.elapsed,
                "lastEnemySpawnElapsed=", this.lastEnemySpawnElapsed,
                "remaining_ms=", this.ENEMY_SPAWN_COOLDOWN_MS - (this.elapsed - this.lastEnemySpawnElapsed)
            );
            return null;
        }


        const currentEnemies =
            this.cars.filter(

                car =>
                    car.typeKey.startsWith(
                        "enemy"
                    ) &&
                    car.sprite.active

            ).length;


        if (
            currentEnemies >=
            profile.enemyMax
        ) {

            console.log(
                "[ENEMY DEBUG] blocked: max enemies alive already",
                "currentEnemies=", currentEnemies,
                "enemyMax=", profile.enemyMax
            );
            return null;
        }


        const spawnRoll = Phaser.Math.Between(1, 100);
        if (spawnRoll > profile.enemyChance) {
            console.log(
                "[ENEMY DEBUG] blocked: chance roll failed",
                "roll=", spawnRoll,
                "needed<=", profile.enemyChance
            );
            return null;
        }
        console.log("[ENEMY DEBUG] chance roll PASSED", "roll=", spawnRoll, "needed<=", profile.enemyChance);


        const enemyTypes =
            VEHICLE_TYPES.filter(

                type =>

                    type.isEnemy === true &&

                    type.zoneWeights[
                        Phaser.Math.Clamp(
                            Math.floor(zone),
                            0,
                            4
                        )
                    ] > 0

            );


        if (!enemyTypes.length) {

            console.log("[ENEMY DEBUG] blocked: no enemy type has zoneWeight>0 for zone", zone);
            return null;
        }


        const safeZone =
            Phaser.Math.Clamp(
                Math.floor(zone),
                0,
                4
            );


        const total =
            enemyTypes.reduce(

                (
                    sum,
                    type
                ) =>

                    sum +
                    type.zoneWeights[
                        safeZone
                    ],

                0
            );


        let roll =
            Phaser.Math.Between(
                1,
                total
            );


        for (
            const enemy of
            enemyTypes
        ) {

            const weight =
                enemy.zoneWeights[
                    safeZone
                ];


            if (
                roll <= weight
            ) {

                console.log("[ENEMY DEBUG] enemy type chosen:", enemy.key);
                return enemy;
            }


            roll -= weight;
        }


        console.log("[ENEMY DEBUG] enemy type chosen (fallback last):", enemyTypes[enemyTypes.length - 1].key);
        return enemyTypes[
            enemyTypes.length - 1
        ];
    }


    private pickHunterSpawnLane(type: VehicleType): number | null {
        const player = this.getPlayer();
        const playerX = player?.x ?? 200;
        const preferredLane = this.getPlayerLaneIndex() ?? 0;
        const candidates = [preferredLane, preferredLane - 1, preferredLane + 1, preferredLane - 2, preferredLane + 2]
            .filter((lane, i, arr) => lane >= 0 && lane < this.LANES.length && arr.indexOf(lane) === i);

        for (const lane of candidates) {
            const y = player ? player.y + 500 : this.SPAWN_Y;
            if (this.isLaneSafeForSpawn(lane, y, type)) {
                console.log("[ENEMY DEBUG] hunter spawn lane found:", lane, "candidates were:", candidates);
                return lane;
            }
        }
        console.log("[ENEMY DEBUG] blocked: no safe lane near player for hunter. candidates tried:", candidates, "playerX=", playerX);
        return null;
    }

    // =========================================================================
    // SIZE
    // =========================================================================

    private getVehicleDisplaySize(
        type: VehicleType,
        textureKey: string
    ): { width: number; height: number } {
        // IMPORTANT: Player and Traffic use the exact same canonical footprint.
        // Do not derive the final size from the source texture aspect ratio.
        // That was the cause of taxi/taxi1 and especially bus/bus1 ending up
        // with different visual dimensions.
        //
        // Canonical sizes:
        //   Normal / Super = 70 x 130
        //   Truck          = 90 x 180
        //   Bus            = 100 x 205
        //
        // `type.key` is used for the category, while `textureKey` lets the
        // player/traffic variants (foo / foo1) resolve to the same footprint.
        if (type.key === "truck") {
            return { width: 120, height: 180 };
        }

        if (type.key === "bus") {
            return { width: 110, height: 200 };
        }

        return getCanonicalVehicleSize(textureKey);
    }

    // =========================================================================
    // SPAWN SAFETY
    // =========================================================================

    private carsInLane(
        lane: number
    ): EnemyCar[] {

        return (
            this.laneGroups.get(
                lane
            ) ?? []
        );
    }


    private rebuildLaneGroups() {

        this.laneGroups.clear();


        for (
            let lane = 0;
            lane < this.LANES.length;
            lane++
        ) {

            this.laneGroups.set(
                lane,
                []
            );
        }


        for (
            const car of
            this.cars
        ) {

            if (
                !car.sprite ||
                !car.sprite.active
            ) {

                continue;
            }


            const lane =
                Phaser.Math.Clamp(
                    car.lane,
                    0,
                    this.LANES.length - 1
                );


            const group =
                this.laneGroups.get(
                    lane
                );


            if (group) {

                group.push(car);
            }
        }
    }


    private isLaneSafeForSpawn(
        lane: number,
        y: number,
        type: VehicleType
    ): boolean {

        if (
            lane < 0 ||
            lane >= this.LANES.length
        ) {

            return false;
        }


        const gap =
            Math.max(
                type.followGap,
                220
            );


        for (
            const car of
            this.carsInLane(lane)
        ) {

            if (
                !car.sprite.active
            ) {

                continue;
            }


            if (
                Math.abs(
                    car.sprite.y - y
                ) < gap
            ) {

                return false;
            }
        }


        return true;
    }


    private playerSprite: Phaser.GameObjects.Sprite | null = null;

    private getPlayer():
        Phaser.GameObjects.Sprite | null {

        if (this.playerSprite && this.playerSprite.active) {
            return this.playerSprite;
        }

        const player =
            this.scene.children.getByName(
                "player"
            );


        if (
            player instanceof
            Phaser.GameObjects.Sprite
        ) {

            return player;
        }


        return null;
    }


    private isPlayerTooCloseToSpawn(
        lane: number
    ): boolean {

        const player =
            this.getPlayer();


        if (!player) {

            return false;
        }


        const laneDistance =
            Math.abs(
                player.x -
                this.LANES[lane]
            );


        if (
            laneDistance > 65
        ) {

            return false;
        }


        const verticalDistance =
            Math.abs(
                player.y -
                this.SPAWN_Y
            );


        return (
            verticalDistance <
            this.PLAYER_SAFE_DISTANCE
        );
    }


    private pickSpawnLane(
        type: VehicleType
    ): number | null {

        const safe: number[] = [];


        for (
            let lane = 0;
            lane < this.LANES.length;
            lane++
        ) {

            if (
                !this.isLaneSafeForSpawn(
                    lane,
                    this.SPAWN_Y,
                    type
                )
            ) {

                continue;
            }


            if (
                this.isPlayerTooCloseToSpawn(
                    lane
                )
            ) {

                continue;
            }


            safe.push(lane);
        }


        if (!safe.length) {

            return null;
        }


        let minimum =
            Infinity;


        for (
            const lane of
            safe
        ) {

            minimum =
                Math.min(
                    minimum,
                    this.carsInLane(
                        lane
                    ).length
                );
        }


        const emptiest =
            safe.filter(
                lane =>
                    this.carsInLane(
                        lane
                    ).length ===
                    minimum
            );


        return Phaser.Utils.Array.GetRandom(
            emptiest
        );
    }


    // =========================================================================
    // SPAWN
    // =========================================================================

    private spawnVehicle(
        lane: number,
        type: VehicleType,
        speedMultiplier: number
    ): boolean {

        if (
            this.cars.length >=
            this.MAX_TRAFFIC
        ) {

            return false;
        }


        const safeLane =
            Phaser.Math.Clamp(
                Math.floor(lane),
                0,
                this.LANES.length - 1
            );


        const textures =
            this.getAllowedTextures(
                type.textures
            );


        if (!textures.length) {

            if (type.isEnemy) {
                console.log("[ENEMY DEBUG] blocked: no allowed textures at all for", type.key, "(raw list was", type.textures, ")");
            }
            return false;
        }


        const texture =
            Phaser.Utils.Array.GetRandom(
                textures
            );


        if (
            !this.scene.textures.exists(
                texture
            )
        ) {

            if (type.isEnemy) {
                console.log(
                    "[ENEMY DEBUG] blocked: texture NOT LOADED in scene ->",
                    texture,
                    "| this means the enemy was chosen correctly but its image was never preloaded.",
                    "Loaded texture keys:", this.scene.textures.getTextureKeys()
                );
            }
            return false;
        }

        if (type.isEnemy) {
            console.log("[ENEMY DEBUG] spawnVehicle: texture OK, spawning enemy", type.key, "texture=", texture, "lane=", safeLane);
        }


        const x =
            this.LANES[
                safeLane
            ];


        const size =
            this.getVehicleDisplaySize(
                type,
                texture
            );


        const playerForSpawn = this.getPlayer();
        const hunterSpawnY = type.isEnemy && playerForSpawn
            ? Phaser.Math.Clamp(playerForSpawn.y - 400, this.ROAD_TOP + 20, this.DESPAWN_Y - 70)
            : this.SPAWN_Y;

        const sprite =
            this.scene.add.sprite(
                x,
                hunterSpawnY,
                texture
            );


        // FINAL gameplay footprint is canonical. Do not fit-to-box here:
        // fitScale would make taxi1/bus1 smaller whenever their source canvas
        // has a different aspect ratio. Player and Traffic must end at the same
        // dimensions, so the sprite is rendered at the exact canonical size.
        sprite.setDisplaySize(
            size.width,
            size.height
        );


        sprite.setDepth(30);


        sprite.setName(
            `traffic_${type.key}_${Date.now()}_${Math.random()}`
        );


        const rawSpeed =
            Phaser.Math.FloatBetween(
                type.minSpeed,
                type.maxSpeed
            );


        const safeSpeedMultiplier =
            Number.isFinite(
                speedMultiplier
            )
                ? speedMultiplier
                : 1;


        const speed =
            rawSpeed *
            safeSpeedMultiplier;


        const hitH =
            size.height *
            0.28;


        // ==================== تغییرات اصلی اینجا ====================
        // ضریب فاصله بر اساس اندازه ماشین
        let gapMultiplier = 3.0;  // پیش‌فرض

        if (type.key === "sport") gapMultiplier = 3.5;
        if (type.key === "taxi") gapMultiplier = 4.0;
        if (type.key === "truck") gapMultiplier = 5.5;
        if (type.key === "bus") gapMultiplier = 6.0;
        if (type.key === "super") gapMultiplier = 3.0;
        if (type.key.startsWith("enemy")) {
            const tier = parseInt(type.key.replace("enemy", ""));
            gapMultiplier = 2.8 + (tier / 8); // enemy1=2.9, enemy3=3.2, enemy31=6.7
        }
        // ===========================================================

        const enemy:
            EnemyCar = {

            sprite,

            typeKey:
                type.key,

            behavior:
                type.key,

            lane:
                safeLane,

            laneX:
                x,

            targetLane:
                safeLane,

            changingLane:
                false,

            laneChangeTimer:
                Phaser.Math.Between(
                    2200,
                    5000
                ),

            laneChangeProgress:
                0,

            laneReleaseTimer:
                0,

            behaviorTimer:
                Phaser.Math.Between(
                    1500,
                    4000
                ),

            blockedTimer:
                0,

            brakeTimer:
                0,

            currentSpeed:
                speed,

            targetSpeed:
                speed,

            minSpeed:
                type.minSpeed *
                safeSpeedMultiplier,

            maxSpeed:
                type.maxSpeed *
                safeSpeedMultiplier,

            acceleration:
                type.acceleration,

            deceleration:
                type.deceleration,

            emergencyDeceleration:
                type.deceleration *
                3.4,

            brakeChance:
                type.brakeChance,

            laneChangeChance:
                type.laneChangeChance,

            aggressiveness:
                type.aggressiveness,

            // ==================== تغییرات اصلی اینجا ====================
            followGap: Math.max(type.followGap, hitH * gapMultiplier),  // ← ضریب جدید
            hardGap: hitH * (gapMultiplier * 0.6),  // ← ضریب جدید
            // ===========================================================

            hitW:
                size.width *
                0.20,

            hitH,

            mass:
                type.mass,

            prevX:
                x,

            prevY:
                hunterSpawnY,

            nearMissed:
                false,

            spawnTime:
                this.elapsed,

            overtaking:
                false,

            recentlyChangedLane:
                false,

            effectTimer:
                Phaser.Math.Between(
                    180,
                    500
                ),

            threat:
                type.isEnemy
                    ? 0.9
                    : type.key === "super"
                        ? 1
                        : type.key === "truck" ||
                          type.key === "bus"
                            ? 0.7
                            : 0.3,

            reactionTimer:
                Phaser.Math.Between(
                    300,
                    900
                ),

            nitroAvoidance:
                0,

            storyTagged:
                !!type.isEnemy,

            pursuitTriggered:
                false,

            chaseTimer:
                Phaser.Math.Between(
                    900,
                    1800
                ),
            hunterPhase: type.isEnemy ? "approach" : "recover",
            hunterDecisionTimer: type.isEnemy ? 60 : 1200,
            hunterCommitTimer: 0,
            hunterGoalLane: safeLane,
            hunterLastLane: safeLane,
            hunterPredictionX: x,
            hunterPredictionVX: 0,
            hunterConfidence: 0.35,
            hunterTrickTimer: Phaser.Math.Between(1000, 1800),
            hunterPlayerGap: Infinity,
            hunterPassWindow: false,
            hunterBlocked: false,
            hunterMemoryLane: safeLane
        };


        this.cars.push(
            enemy
        );


        this.rememberVehicle(
            type.key
        );


        if (
            type.key === "super"
        ) {

            this.emitEvent({
                type: "super",
                vehicle: enemy,
                lane: safeLane,
                zone: this.currentZone
            });
        }


        if (
            type.key === "truck" ||
            type.key === "bus"
        ) {

            this.emitEvent({
                type: "heavy",
                vehicle: enemy,
                lane: safeLane,
                zone: this.currentZone
            });
        }


        if (
            type.isEnemy
        ) {

            this.lastEnemySpawnElapsed =
                this.elapsed;


            // Enemy appearance event.
            this.emitEvent({
                type: "enemySpawn",
                vehicle: enemy,
                lane: safeLane,
                zone: this.currentZone
            });

            // IMPORTANT:
            // No pursuit event here.
            //
            // Pursuit is emitted later when the enemy
            // actually enters pursuit range.
        }


        this.emitEvent({
            type: "spawn",
            vehicle: enemy,
            lane: safeLane,
            zone: this.currentZone
        });


        return true;
    }


    private rememberVehicle(
        key: string
    ) {

        this.lastSpawnedTypes.push(
            key
        );


        if (
            this.lastSpawnedTypes.length >
            8
        ) {

            this.lastSpawnedTypes.shift();
        }
    }


    // =========================================================================
    // FRONT CAR
    // =========================================================================

    private getFrontCar(
        enemy: EnemyCar
    ): {
        car: EnemyCar | null;
        gap: number;
    } {

        let closest:
            EnemyCar | null = null;


        let closestGap =
            Infinity;


        for (
            const other of
            this.carsInLane(
                enemy.lane
            )
        ) {

            if (
                other === enemy ||
                !other.sprite.active
            ) {

                continue;
            }


            const gap =
                other.sprite.y -
                enemy.sprite.y;


            if (
                gap > 0 &&
                gap < closestGap
            ) {

                closestGap =
                    gap;

                closest =
                    other;
            }
        }


        return {
            car: closest,
            gap: closestGap
        };
    }


    // =========================================================================
    // PERSONALITY
    // =========================================================================

    private updateVehicleBehavior(
        enemy: EnemyCar,
        delta: number
    ) {

        enemy.behaviorTimer -=
            delta;


        if (
            enemy.behaviorTimer > 0
        ) {

            return;
        }


        enemy.behaviorTimer =
            Phaser.Math.Between(
                1600,
                3800
            );


        const profile =
            this.getZoneProfile(
                this.currentZone
            );


        if (
            Phaser.Math.Between(
                1,
                100
            ) <= 55
        ) {

            enemy.targetSpeed =
                Phaser.Math.FloatBetween(
                    enemy.minSpeed,
                    enemy.maxSpeed
                );
        }


        if (
            Phaser.Math.Between(
                1,
                100
            ) <=
            enemy.brakeChance
        ) {

            enemy.targetSpeed =
                Math.max(
                    enemy.minSpeed,
                    enemy.targetSpeed *
                    Phaser.Math.FloatBetween(
                        0.62,
                        0.82
                    )
                );

            enemy.brakeTimer =
                Phaser.Math.Between(
                    250,
                    500
                );

            this.createBrakeFlash(
                enemy
            );
        }


        if (
            enemy.typeKey.startsWith(
                "enemy"
            )
        ) {

            enemy.targetSpeed =
                Math.min(
                    enemy.maxSpeed,
                    enemy.targetSpeed +
                    profile.enemyAggression *
                    0.12
                );
        }


        enemy.aggressiveness =
            Phaser.Math.Clamp(

                enemy.aggressiveness +
                profile.enemyAggression *
                0.02,

                0,

                1
            );
    }


    // =========================================================================
    // SPEED
    // =========================================================================

    private moveSpeedTowards(
        enemy: EnemyCar,
        target: number,
        acceleration: number,
        delta: number
    ) {

        const frameScale =
            Phaser.Math.Clamp(
                delta / 16.6667,
                0,
                3
            );


        if (
            enemy.currentSpeed <
            target
        ) {

            enemy.currentSpeed =
                Math.min(

                    target,

                    enemy.currentSpeed +
                    acceleration *
                    frameScale
                );

        } else {

            enemy.currentSpeed =
                Math.max(

                    target,

                    enemy.currentSpeed -
                    enemy.deceleration *
                    frameScale
                );
        }
    }


    // =========================================================================
    // FOLLOWING
    // =========================================================================

    private avoidFrontCar(
        enemy: EnemyCar,
        delta: number
    ): boolean {

        const front =
            this.getFrontCar(
                enemy
            );


        if (
            !front.car
        ) {

            enemy.blockedTimer =
                Math.max(
                    0,
                    enemy.blockedTimer -
                    delta * 0.5
                );

            return false;
        }


        const leader =
            front.car;


        const gap =
            front.gap;


        if (
            gap >
            enemy.followGap
        ) {

            enemy.blockedTimer =
                Math.max(
                    0,
                    enemy.blockedTimer -
                    delta
                );

            return false;
        }


        enemy.blockedTimer +=
            delta;


        const desired =
            Math.max(
                0.15,
                leader.currentSpeed -
                0.05
            );


        enemy.targetSpeed =
            Math.min(
                enemy.targetSpeed,
                desired
            );


        const emergencyTarget =
            Math.max(
                0.15,
                leader.currentSpeed -
                0.25
            );


        enemy.targetSpeed =
            Math.min(
                enemy.targetSpeed,
                emergencyTarget
            );


        this.moveSpeedTowards(
            enemy,
            emergencyTarget,
            enemy.emergencyDeceleration,
            delta
        );


        if (
            gap <=
            enemy.hardGap
        ) {

            enemy.currentSpeed =
                Math.min(
                    enemy.currentSpeed,
                    leader.currentSpeed
                );
        }


        if (
            enemy.brakeTimer <= 0 &&
            gap <
            enemy.followGap * 1.2
        ) {

            enemy.brakeTimer =
                Phaser.Math.Between(
                    250,
                    500
                );

            this.createBrakeFlash(
                enemy
            );
        }


        return true;
    }


    // =========================================================================
    // LANE SAFETY
    // =========================================================================

    private isLaneSafeForTravel(
        lane: number,
        mover: EnemyCar
    ): boolean {

        if (
            lane < 0 ||
            lane >= this.LANES.length
        ) {

            return false;
        }


        for (
            const other of
            this.carsInLane(
                lane
            )
        ) {

            if (
                other === mover ||
                !other.sprite.active
            ) {

                continue;
            }


            const verticalGap =
                Math.abs(
                    other.sprite.y -
                    mover.sprite.y
                );


            // ==================== تغییرات اصلی اینجا ====================
            const requiredGap =
                Math.max(
                    250,  // ← از 150 به 250 افزایش
                    mover.followGap * 0.9,
                    other.followGap * 0.75
                );
            // ===========================================================


            if (
                verticalGap <
                requiredGap
            ) {

                return false;
            }
        }


        return true;
    }


    // =========================================================================
    // LANE CHANGE
    // =========================================================================

    private canVehicleChangeLane(
        enemy: EnemyCar
    ): boolean {

        if (
            !enemy.sprite.active
        ) {

            return false;
        }


        if (
            enemy.changingLane
        ) {

            return false;
        }


        const type =
            VEHICLE_TYPES.find(
                vehicle =>
                    vehicle.key ===
                    enemy.typeKey
            );


        return !!type?.canChangeLane;
    }


    private performLaneChange(
        enemy: EnemyCar,

        // Optional: when provided, the safe candidate lane
        // closest to this lane index is preferred instead of
        // simply the least-occupied lane. Used by enemy vehicles
        // to actively steer toward the player's lane.
        biasLane?: number
    ) {

        const candidates = [

            enemy.lane - 1,

            enemy.lane + 1
        ].filter(

            lane =>
                lane >= 0 &&
                lane <
                this.LANES.length
        );


        if (!candidates.length) {

            return;
        }


        const safe =
            candidates.filter(
                lane =>
                    this.isLaneSafeForTravel(
                        lane,
                        enemy
                    )
            );


        if (!safe.length) {

            return;
        }


        if (
            typeof biasLane ===
            "number"
        ) {

            safe.sort(

                (a, b) =>

                    Math.abs(
                        this.LANES[a] -
                        this.LANES[biasLane]
                    ) -

                    Math.abs(
                        this.LANES[b] -
                        this.LANES[biasLane]
                    )
            );

        }
        else {

            safe.sort(

                (a, b) =>
                    this.carsInLane(a)
                        .length -
                    this.carsInLane(b)
                        .length
            );

        }


        const targetLane =
            safe[0];


        const oldLane =
            enemy.lane;


        enemy.changingLane =
            true;


        enemy.targetLane =
            targetLane;


        enemy.recentlyChangedLane =
            true;


        enemy.lane =
            targetLane;


        enemy.laneX =
            this.LANES[
                targetLane
            ];


        const oldGroup =
            this.laneGroups.get(
                oldLane
            );


        if (oldGroup) {

            const index =
                oldGroup.indexOf(
                    enemy
                );


            if (
                index !== -1
            ) {

                oldGroup.splice(
                    index,
                    1
                );
            }
        }


        const newGroup =
            this.laneGroups.get(
                targetLane
            );


        if (
            newGroup &&
            !newGroup.includes(
                enemy
            )
        ) {

            newGroup.push(
                enemy
            );
        }


        const duration =

            enemy.typeKey ===
            "enemy3"

                ? 300

                : enemy.typeKey ===
                  "enemy2"

                    ? 360

                    : enemy.typeKey ===
                      "enemy1"

                        ? 440

                        : enemy.behavior ===
                          "truck" ||
                          enemy.behavior ===
                          "bus"

                            ? 1100

                            : enemy.behavior ===
                              "super"

                                ? 360

                                : 500;


        this.createLaneChangeEffect(
            enemy
        );


        const oldTween =
            this.laneChangeTweens.get(
                enemy
            );


        if (oldTween) {

            oldTween.stop();

            this.laneChangeTweens.delete(
                enemy
            );
        }


        const tween =
            this.scene.tweens.add({

                targets:
                    enemy.sprite,

                x:
                    this.LANES[
                        targetLane
                    ],

                duration,

                ease:
                    "Sine.easeInOut",

                onUpdate:
                    () => {

                        if (
                            !enemy.sprite.active
                        ) {

                            return;
                        }


                        const startX =
                            this.LANES[
                                oldLane
                            ];

                        const endX =
                            this.LANES[
                                targetLane
                            ];


                        enemy.laneChangeProgress =
                            Phaser.Math.Clamp(

                                Math.abs(
                                    enemy.sprite.x -
                                    startX
                                ) /
                                Math.max(
                                    1,
                                    Math.abs(
                                        endX -
                                        startX
                                    )
                                ),

                                0,

                                1
                            );
                    },


                onComplete:
                    () => {

                        this.laneChangeTweens.delete(
                            enemy
                        );


                        if (
                            !enemy.sprite.active
                        ) {

                            enemy.changingLane =
                                false;

                            return;
                        }


                        enemy.sprite.x =
                            this.LANES[
                                targetLane
                            ];


                        enemy.laneX =
                            this.LANES[
                                targetLane
                            ];


                        enemy.laneChangeProgress =
                            1;


                        enemy.changingLane =
                            false;


                        enemy.overtaking =
                            true;


                        enemy.laneReleaseTimer =
                            Phaser.Math.Between(
                                700,
                                1400
                            );


                        this.emitEvent({

                            type:
                                "laneChange",

                            vehicle:
                                enemy,

                            lane:
                                targetLane,

                            zone:
                                this.currentZone
                        });
                    }
            });


        this.laneChangeTweens.set(
            enemy,
            tween
        );
    }


    // =========================================================================
    // LANE AI
    // =========================================================================

    private updateLaneAI(
        enemy: EnemyCar,
        blocked: boolean,
        delta: number
    ) {

        const profile =
            this.getZoneProfile(
                this.currentZone
            );


        if (
            enemy.laneReleaseTimer >
            0
        ) {

            enemy.laneReleaseTimer =
                Math.max(
                    0,
                    enemy.laneReleaseTimer -
                    delta
                );


            if (
                enemy.laneReleaseTimer <=
                0
            ) {

                enemy.recentlyChangedLane =
                    false;
            }
        }


        if (
            enemy.changingLane
        ) {

            return;
        }


        if (
            !this.canVehicleChangeLane(
                enemy
            )
        ) {

            return;
        }


        enemy.laneChangeTimer -=
            delta;


        const stuck =
            enemy.blockedTimer >
            (
                enemy.typeKey.startsWith(
                    "enemy"
                )
                    ? 400
                    : enemy.behavior ===
                      "super"
                        ? 450
                        : 750
            );


        if (
            enemy.laneChangeTimer > 0 &&
            !stuck
        ) {

            return;
        }


        const aggression =
            enemy.aggressiveness;


        enemy.laneChangeTimer =
            Phaser.Math.Between(
                2400,
                5600
            ) *
            (
                1 -
                aggression *
                0.30
            );


        let chance =
            enemy.laneChangeChance *
            0.20 *
            profile.laneChangeMultiplier;


        if (blocked) {

            chance += 18;
        }


        if (stuck) {

            chance +=
                aggression *
                45;
        }


        if (
            enemy.typeKey ===
            "enemy1"
        ) {

            chance += 12;
        }


        if (
            enemy.typeKey ===
            "enemy2"
        ) {

            chance += 20;
        }


        if (
            enemy.typeKey ===
            "enemy3"
        ) {

            chance += 28;
        }


        if (
            enemy.behavior ===
            "super"
        ) {

            chance += 10;
        }


        chance =
            Phaser.Math.Clamp(
                chance,
                0,
                95
            );


        if (
            Phaser.Math.Between(
                1,
                100
            ) <=
            chance
        ) {

            this.performLaneChange(
                enemy
            );
        }
    }



    // =========================================================================
    // INTEGRATED HUNTER BRAIN
    // =========================================================================
    // Hunters are real TrafficSystem vehicles. The brain reasons over the same
    // cars, lanes, collision envelopes and movement model as ordinary traffic.
    // There is no second movement system and no teleport-based steering.
    // =========================================================================

    private isHunter(enemy: EnemyCar): boolean {
        return !!enemy.typeKey?.startsWith("enemy");
    }

    private hunterTier(enemy: EnemyCar): number {
        const map: Record<string, number> = {
            enemy1: 1, enemy2: 2, enemy3: 3,
            enemy11: 4, enemy21: 5, enemy31: 6
        };
        return map[enemy.typeKey] ?? 1;
    }

    private hunterDecisionInterval(tier: number): number {
        return Math.max(85, 180 - tier * 14);
    }

    private hunterPredictPlayer(): { player: Phaser.GameObjects.Sprite | null; x: number; lane: number; roadSpeed: number } {
        const player = this.getPlayer();
        if (!player) return { player: null, x: 200, lane: 1, roadSpeed: Math.max(0.15, this.currentPlayerSpeed * 0.65) };
        const vx = (player.x - (this.previousPlayerX ?? player.x)) / 8;
        const x = Phaser.Math.Clamp(player.x + vx * 10, this.LANES[0], this.LANES[3]);
        let lane = 0;
        let best = Infinity;
        for (let i = 0; i < this.LANES.length; i++) {
            const d = Math.abs(this.LANES[i] - x);
            if (d < best) { best = d; lane = i; }
        }
        return { player, x, lane, roadSpeed: Math.max(0.15, this.currentPlayerSpeed * 0.65) };
    }

    private hunterLaneRisk(enemy: EnemyCar, lane: number, horizon: number): { risk: number; gap: number } {
        const x = this.LANES[lane];
        let risk = 0;
        let minGap = Infinity;
        const worldSpeed = Math.max(0.15, this.currentPlayerSpeed * 0.65);
        for (const other of this.cars) {
            if (other === enemy || !other.sprite.active) continue;
            if (Math.abs(other.sprite.x - x) > 64) continue;
            const projectedY = other.sprite.y + (worldSpeed - Math.max(0.15, other.currentSpeed)) * 60 * horizon;
            const gap = Math.abs(projectedY - enemy.sprite.y);
            minGap = Math.min(minGap, gap);
            const safe = (enemy.hitH + other.hitH) * 0.70 + 34;
            if (gap < safe * 2.4) risk = Math.max(risk, Phaser.Math.Clamp(1 - gap / Math.max(1, safe * 2.4), 0, 1));
        }
        return { risk, gap: minGap };
    }

    private hunterLaneEvaluation(enemy: EnemyCar, lane: number, targetLane: number, targetX: number, gapY: number): { score: number; safe: boolean } {
        let maxRisk = 0;
        let minGap = Infinity;
        for (const h of [0.16, 0.32, 0.50, 0.72]) {
            const r = this.hunterLaneRisk(enemy, lane, h);
            maxRisk = Math.max(maxRisk, r.risk);
            minGap = Math.min(minGap, r.gap);
        }
        const distance = Math.abs(this.LANES[lane] - targetX);
        const laneJump = Math.abs(lane - enemy.lane);
        const targetReward = Math.max(0, 0.48 - distance / 260);
        const forwardReward = gapY > 120 && lane === targetLane ? 0.22 : 0;
        const edgePenalty = lane === 0 || lane === 3 ? 0.035 : 0;
        return {
            score: maxRisk * 2.1 + laneJump * 0.08 + edgePenalty - targetReward - forwardReward,
            safe: maxRisk < 0.50 && minGap > 72
        };
    }

    private hunterChangeLane(enemy: EnemyCar, targetLane: number): boolean {
        if (!this.canVehicleChangeLane(enemy)) return false;
        if (Math.abs(targetLane - enemy.lane) !== 1) return false;
        const evaln = this.hunterLaneEvaluation(enemy, targetLane, targetLane, this.LANES[targetLane], 0);
        if (!evaln.safe) return false;
        enemy.hunterGoalLane = targetLane;
        enemy.hunterLastLane = enemy.lane;
        enemy.hunterCommitTimer = 650;
        this.performLaneChange(enemy, targetLane);
        return true;
    }

    private updateIntegratedHunter(enemy: EnemyCar, delta: number, blocked: boolean): void {
        if (!this.isHunter(enemy) || !enemy.sprite.active) return;
        const tier = this.hunterTier(enemy);
        const state = this.hunterPredictPlayer();
        if (!state.player) return;

        enemy.hunterDecisionTimer -= delta;
        enemy.hunterCommitTimer = Math.max(0, enemy.hunterCommitTimer - delta);
        enemy.hunterTrickTimer = Math.max(0, enemy.hunterTrickTimer - delta);
        enemy.hunterBlocked = blocked;
        enemy.hunterPlayerGap = state.player.y - enemy.sprite.y;
        enemy.hunterPredictionX = state.x;
        enemy.hunterConfidence = 0.55 + tier * 0.055;
        enemy.hunterMemoryLane = state.lane;

        // A real passing window for the player. Early Hunters yield enough for
        // the player to physically clear them instead of chasing speed forever.
        const playerBehind = enemy.hunterPlayerGap > 0;
        const playerClosing = state.roadSpeed > enemy.currentSpeed + 0.06;
        enemy.hunterPassWindow = playerBehind && playerClosing && enemy.hunterPlayerGap < 340;
        if (enemy.hunterPassWindow && tier <= 3) {
            enemy.targetSpeed = Math.min(enemy.targetSpeed, Math.max(enemy.minSpeed, state.roadSpeed - (0.22 + tier * 0.02)));
            enemy.hunterPhase = "recover";
        }

        if (enemy.hunterDecisionTimer > 0 && !blocked) return;
        enemy.hunterDecisionTimer = this.hunterDecisionInterval(tier);

        const gapY = enemy.hunterPlayerGap;
        const far = gapY > 270;
        const mid = gapY > 55 && gapY <= 270;
        const ahead = gapY < -30;

        // Stable target speed: small finite advantage only. No frame-by-frame rubber band.
        const catchAdv = [0.18, 0.24, 0.30, 0.36, 0.42, 0.46][tier - 1] ?? 0.18;
        let desired = state.roadSpeed + (far ? catchAdv : mid ? catchAdv * 0.45 : -0.03);
        desired = Phaser.Math.Clamp(desired, enemy.minSpeed, enemy.maxSpeed);

        // Evaluate every reachable lane using future traffic occupancy.
        const candidates = this.LANES.map((_, lane) => ({ lane, ...this.hunterLaneEvaluation(enemy, lane, state.lane, state.x, gapY) }))
            .sort((a, b) => a.score - b.score);
        const current = candidates.find(c => c.lane === enemy.lane) ?? candidates[0];
        const best = candidates[0];

        if (blocked || enemy.blockedTimer > 180) {
            if (best.safe && Math.abs(best.lane - enemy.lane) === 1) {
                this.hunterChangeLane(enemy, best.lane);
                enemy.hunterPhase = "maneuver";
            } else {
                const front = this.getFrontCar(enemy);
                desired = front.car
                    ? Math.min(desired, Math.max(enemy.minSpeed, front.car.currentSpeed - 0.05))
                    : Math.max(enemy.minSpeed, desired - 0.10);
                enemy.hunterPhase = "cover";
            }
        } else {
            // Only move toward the player's lane when that route is actually safe.
            const playerLaneEval = candidates.find(c => c.lane === state.lane);
            const usefulPlayerLane =
                playerLaneEval && playerLaneEval.safe &&
                Math.abs(state.lane - enemy.lane) === 1 &&
                (state.lane === best.lane || tier >= 3 && playerLaneEval.score < current.score - 0.08);
            if (usefulPlayerLane) {
                this.hunterChangeLane(enemy, state.lane);
                enemy.hunterPhase = "hunt";
            } else if (best.safe && best.lane !== enemy.lane && best.score + 0.12 < current.score) {
                this.hunterChangeLane(enemy, best.lane);
                enemy.hunterPhase = "maneuver";
            }
        }

        // Higher tiers occasionally make a safe feint; it is never a teleport or lock-on.
        if (tier >= 4 && enemy.hunterTrickTimer <= 0 && mid && !blocked && !enemy.changingLane) {
            enemy.hunterTrickTimer = 1700 + tier * 220;
            const adjacent = [enemy.lane - 1, enemy.lane + 1]
                .filter(l => l >= 0 && l < 4)
                .map(l => ({ lane: l, ...this.hunterLaneEvaluation(enemy, l, state.lane, state.x, gapY) }))
                .filter(c => c.safe)
                .sort((a,b) => a.score-b.score);
            if (adjacent.length && Math.random() < 0.12 + tier * 0.025) {
                this.hunterChangeLane(enemy, adjacent[0].lane);
                enemy.hunterPhase = "maneuver";
            }
        }

        if (ahead) {
            desired = Math.min(desired, state.roadSpeed * 0.96);
            enemy.hunterPhase = "recover";
        } else if (far) {
            enemy.hunterPhase = "approach";
        } else if (mid) {
            enemy.hunterPhase = "hunt";
        }

        enemy.targetSpeed = Phaser.Math.Clamp(desired, enemy.minSpeed, enemy.maxSpeed);
    }

    public isHunterChasing(): boolean {
        return this.cars.some(car => this.isHunter(car) && car.sprite.active && car.hunterPhase !== "recover");
    }

    public getActiveHunter(): EnemyCar | null {
        return this.cars.find(car => this.isHunter(car) && car.sprite.active) ?? null;
    }

    // =========================================================================
    // ENEMY CHASE (steer toward the player's lane)
    // =========================================================================

    private getPlayerLaneIndex(): number | null {

        const player =
            this.getPlayer();


        if (
            !player
        ) {

            return null;
        }


        let closestLane = 0;

        let closestDistance =
            Infinity;


        for (
            let lane = 0;
            lane < this.LANES.length;
            lane++
        ) {

            const distance =
                Math.abs(
                    this.LANES[lane] -
                    player.x
                );


            if (
                distance <
                closestDistance
            ) {

                closestDistance =
                    distance;

                closestLane =
                    lane;
            }
        }


        return closestLane;
    }


    private updateEnemyChaseBehavior(
        enemy: EnemyCar,
        delta: number
    ) {

        if (
            !enemy.typeKey.startsWith(
                "enemy"
            )
        ) {

            return;
        }


        if (
            enemy.changingLane
        ) {

            return;
        }


        enemy.chaseTimer -=
            delta;


        if (
            enemy.chaseTimer > 0
        ) {

            return;
        }


        // Re-check periodically rather than every frame.
        enemy.chaseTimer =
            Phaser.Math.Between(
                1300,
                2400
            );


        if (
            !this.canVehicleChangeLane(
                enemy
            )
        ) {

            return;
        }


        const playerLane =
            this.getPlayerLaneIndex();


        if (
            playerLane === null
        ) {

            return;
        }


        // Already in the player's lane — nothing to chase.
        if (
            enemy.lane ===
            playerLane
        ) {

            return;
        }


        // Higher aggressiveness / threat -> more likely to
        // actively cut toward the player's lane this cycle.
        const chaseChance =
            Phaser.Math.Clamp(

                35 +
                enemy.aggressiveness *
                40 +

                (
                    enemy.pursuitTriggered
                        ? 25
                        : 0
                ),

                0,

                95
            );


        if (
            Phaser.Math.Between(
                1,
                100
            ) >
            chaseChance
        ) {

            return;
        }


        this.performLaneChange(
            enemy,
            playerLane
        );
    }


    // =========================================================================
    // PURSUIT
    // =========================================================================

    private checkEnemyPursuit(
        enemy: EnemyCar
    ) {

        if (
            !enemy.typeKey.startsWith(
                "enemy"
            )
        ) {

            return;
        }


        if (
            enemy.pursuitTriggered
        ) {

            return;
        }


        if (
            !enemy.sprite.active
        ) {

            return;
        }


        const player =
            this.getPlayer();


        /*
         * If GameScene has a named player,
         * use the actual player position.
         *
         * Otherwise use the normal gameplay
         * player Y around 650.
         */
        const playerY =
            player?.y ?? 650;


        const playerX =
            player?.x ?? 200;


        const verticalDistance =
            Math.abs(
                enemy.sprite.y -
                playerY
            );


        const horizontalDistance =
            Math.abs(
                enemy.sprite.x -
                playerX
            );


        /*
         * Enemy must actually be close enough
         * to feel like a pursuit.
         */
        const verticalRange =
            enemy.typeKey ===
            "enemy3"
                ? 390
                : enemy.typeKey ===
                  "enemy2"
                    ? 360
                    : 330;


        const horizontalRange =
            105;


        if (
            verticalDistance >
            verticalRange
        ) {

            return;
        }


        if (
            horizontalDistance >
            horizontalRange
        ) {

            return;
        }


        enemy.pursuitTriggered =
            true;


        enemy.threat =
            Math.max(
                enemy.threat,
                1
            );


        this.playPursuitAlert();


        this.emitEvent({

            type:
                "pursuit",

            vehicle:
                enemy,

            lane:
                enemy.lane,

            zone:
                this.currentZone
        });
    }


    // =========================================================================
    // PURSUIT ALERT AUDIO
    // =========================================================================

    private playPursuitAlert() {

        // Avoid spamming the alert if multiple
        // enemies trigger pursuit close together.
        if (
            this.pursuitAlertCooldown >
            this.elapsed
        ) {

            return;
        }


        this.pursuitAlertCooldown =
            this.elapsed +
            this.PURSUIT_ALERT_COOLDOWN_MS;


        const audioKey =
            "enemy_pursuit";


        try {

            if (
                this.scene.cache.audio.exists(
                    audioKey
                )
            ) {

                const sound =
                    this.scene.sound.add(
                        audioKey
                    );


                sound.play();


                return;

            }

        }
        catch {

            // Fall through to TTS fallback below.

        }


        this.speakPursuitAlert();

    }


    private speakPursuitAlert() {

        try {

            if (
                !("speechSynthesis" in window)
            ) {

                return;

            }


            window.speechSynthesis.cancel();


            this.pursuitVoice =
                new SpeechSynthesisUtterance(
                    "Warning. Pursuit vehicle detected."
                );


            this.pursuitVoice.lang =
                "en-US";


            this.pursuitVoice.rate =
                1.0;


            this.pursuitVoice.pitch =
                0.85;


            this.pursuitVoice.volume =
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

                this.pursuitVoice.voice =
                    preferred;

            }


            window.speechSynthesis.speak(
                this.pursuitVoice
            );

        }
        catch {

            // Silently ignore — audio is not critical to gameplay.

        }

    }


    // =========================================================================
    // NITRO
    // =========================================================================

    private updateNitroReaction(
        enemy: EnemyCar,
        delta: number,
        nitro: boolean
    ) {

        if (nitro) {

            enemy.nitroAvoidance =
                Phaser.Math.Clamp(

                    enemy.nitroAvoidance +
                    delta *
                    0.002,

                    0,

                    1
                );


            if (
                (
                    enemy.behavior ===
                    "super" ||

                    enemy.typeKey.startsWith(
                        "enemy"
                    )
                ) &&
                enemy.reactionTimer <= 0
            ) {

                enemy.reactionTimer =
                    Phaser.Math.Between(
                        500,
                        1200
                    );


                const reactionBonus =
                    enemy.typeKey ===
                    "enemy3"
                        ? 0.42
                        : enemy.typeKey ===
                          "enemy2"
                            ? 0.34
                            : enemy.typeKey ===
                              "enemy1"
                                ? 0.28
                                : 0.25;


                enemy.targetSpeed =
                    Math.min(

                        enemy.maxSpeed,

                        enemy.targetSpeed +
                        reactionBonus
                    );
            }

        } else {

            enemy.nitroAvoidance =
                Math.max(

                    0,

                    enemy.nitroAvoidance -
                    delta *
                    0.003
                );
        }
    }


    // =========================================================================
    // DIFFICULTY
    // =========================================================================

    private getDifficulty(
        distance: number,
        level: number,
        zone: number
    ): number {

        const profile =
            this.getZoneProfile(
                zone
            );


        const levelFactor =
            Phaser.Math.Clamp(
                Math.max(
                    0,
                    level - 1
                ) *
                0.035,

                0,

                1
            );


        const distanceFactor =
            Phaser.Math.Clamp(
                Math.max(
                    0,
                    distance
                ) /
                12000,

                0,

                1
            );


        return Phaser.Math.Clamp(

            0.35 +
            levelFactor *
            0.40 +
            distanceFactor *
            0.15 +
            profile.enemyAggression *
            0.10,

            0,

            1
        );
    }


    // =========================================================================
    // MAX CARS
    // =========================================================================

    private getMaxCars(
        distance: number,
        level: number,
        zone: number
    ): number {

        const profile =
            this.getZoneProfile(
                zone
            );


        const difficulty =
            this.getDifficulty(
                distance,
                level,
                zone
            );


        const bonus =
            Math.floor(
                difficulty * 1.5
            );


        return Phaser.Math.Clamp(

            profile.maxCars +
            bonus,

            2,

            this.MAX_TRAFFIC
        );
    }


    // =========================================================================
    // SPAWN DELAY
    // =========================================================================

    private getSpawnDelay(
        distance: number,
        level: number,
        zone: number
    ): number {

        const profile =
            this.getZoneProfile(
                zone
            );


        const difficulty =
            this.getDifficulty(
                distance,
                level,
                zone
            );


        const base =
            Phaser.Math.FloatBetween(
                profile.spawnMin,
                profile.spawnMax
            );


        const difficultyMultiplier =
            Phaser.Math.Clamp(
                1 -
                difficulty *
                0.25,

                0.70,

                1
            );


        const density =
            Phaser.Math.Clamp(
                profile.trafficDensity,
                0.45,
                1.5
            );


        return Phaser.Math.Clamp(

            base *
            difficultyMultiplier /
            density,

            150,

            1800
        );
    }


    // =========================================================================
    // TRAFFIC SPEED
    // =========================================================================

    private getTrafficSpeedMultiplier(
        distance: number,
        level: number,
        zone: number
    ): number {

        const profile =
            this.getZoneProfile(
                zone
            );


        const difficulty =
            this.getDifficulty(
                distance,
                level,
                zone
            );


        return Phaser.Math.Clamp(

            profile.speedMultiplier +
            difficulty *
            0.12,

            0.80,

            1.45
        );
    }


    // =========================================================================
    // HEAVY TRAFFIC
    // =========================================================================

    private getHeavyTrafficChance(
        distance: number,
        level: number,
        zone: number
    ): number {

        const profile =
            this.getZoneProfile(
                zone
            );


        const difficulty =
            this.getDifficulty(
                distance,
                level,
                zone
            );


        return Phaser.Math.Clamp(

            profile.heavyChance +
            difficulty *
            8,

            0,

            45
        );
    }


    // =========================================================================
    // EFFECT SYSTEM
    // =========================================================================

    private canCreateEffect(): boolean {

        if (
            !this.effectLayer
        ) {

            return false;
        }


        if (
            !this.effectLayer.active
        ) {

            return false;
        }


        return (
            this.activeEffectCount <
            this.MAX_ACTIVE_EFFECTS
        );
    }


    private trackEffect(
        object: Phaser.GameObjects.GameObject
    ) {

        this.activeEffectCount++;


        object.once(

            Phaser.GameObjects.Events.DESTROY,

            () => {

                this.activeEffectCount =
                    Math.max(

                        0,

                        this.activeEffectCount -
                        1
                    );
            }
        );
    }


    private createBrakeFlash(
        enemy: EnemyCar
    ) {

        if (
            !this.canCreateEffect()
        ) {

            return;
        }


        const graphics =
            this.scene.add.graphics();


        graphics.fillStyle(
            0xff1f4d,
            0.95
        );


        graphics.fillCircle(

            enemy.sprite.x -
            10,

            enemy.sprite.y +
            enemy.hitH *
            0.34,

            3.5
        );


        graphics.fillCircle(

            enemy.sprite.x +
            10,

            enemy.sprite.y +
            enemy.hitH *
            0.34,

            3.5
        );


        this.effectLayer!.add(
            graphics
        );


        this.trackEffect(
            graphics
        );


        this.scene.tweens.add({

            targets:
                graphics,

            alpha:
                0,

            scale:
                2.5,

            duration:
                180,

            onComplete:
                () => {

                    if (
                        graphics.active
                    ) {

                        graphics.destroy();
                    }
                }
        });


        this.emitEvent({

            type:
                "brake",

            vehicle:
                enemy,

            lane:
                enemy.lane,

            zone:
                this.currentZone
        });
    }


    private createSpeedStreak(
        enemy: EnemyCar
    ) {

        if (
            !this.canCreateEffect()
        ) {

            return;
        }


        if (
            enemy.currentSpeed <
            enemy.maxSpeed *
            0.82
        ) {

            return;
        }


        const line =
            this.scene.add.rectangle(

                enemy.sprite.x,

                enemy.sprite.y +
                enemy.hitH *
                0.45,

                2,

                Phaser.Math.Between(
                    15,
                    35
                ),

                0xffffff,

                0.18
            );


        this.effectLayer!.add(
            line
        );


        this.trackEffect(
            line
        );


        this.scene.tweens.add({

            targets:
                line,

            y:
                line.y + 45,

            alpha:
                0,

            duration:
                180,

            onComplete:
                () => {

                    if (
                        line.active
                    ) {

                        line.destroy();
                    }
                }
        });
    }


    private createLaneChangeEffect(
        enemy: EnemyCar
    ) {

        if (
            !this.canCreateEffect()
        ) {

            return;
        }


        const ring =
            this.scene.add.circle(

                enemy.sprite.x,

                enemy.sprite.y,

                12,

                0x00ffff,

                0.08
            );


        ring.setStrokeStyle(
            1,
            0x00ffff,
            0.5
        );


        this.effectLayer!.add(
            ring
        );


        this.trackEffect(
            ring
        );


        this.scene.tweens.add({

            targets:
                ring,

            scale:
                2.2,

            alpha:
                0,

            duration:
                320,

            onComplete:
                () => {

                    if (
                        ring.active
                    ) {

                        ring.destroy();
                    }
                }
        });
    }


    private createNearMissEffect(
        player:
            Phaser.GameObjects.Sprite,

        enemy:
            EnemyCar
    ) {

        if (
            !this.canCreateEffect()
        ) {

            return;
        }


        const flash =
            this.scene.add.rectangle(

                player.x,

                player.y,

                90,

                150,

                0xffffff,

                0.08
            );


        this.effectLayer!.add(
            flash
        );


        this.trackEffect(
            flash
        );


        this.scene.tweens.add({

            targets:
                flash,

            alpha:
                0,

            scale:
                1.3,

            duration:
                180,

            onComplete:
                () => {

                    if (
                        flash.active
                    ) {

                        flash.destroy();
                    }
                }
        });


        this.scene.cameras.main.shake(
            80,
            0.0015
        );
    }


    private createImpactEffect(
        player:
            Phaser.GameObjects.Sprite,

        enemy:
            EnemyCar,

        impact:
            number
    ) {

        if (
            !this.effectLayer ||
            !this.canCreateEffect()
        ) {

            return;
        }


        const ring =
            this.scene.add.circle(

                enemy.sprite.x,

                enemy.sprite.y,

                15,

                0xffffff,

                0
            );


        ring.setStrokeStyle(
            3,
            0xff315d,
            0.9
        );


        this.effectLayer.add(
            ring
        );


        this.trackEffect(
            ring
        );


        this.scene.tweens.add({

            targets:
                ring,

            scale:
                2.5 +
                impact *
                0.08,

            alpha:
                0,

            duration:
                260,

            ease:
                "Cubic.easeOut",

            onComplete:
                () => {

                    if (
                        ring.active
                    ) {

                        ring.destroy();
                    }
                }
        });


        const sparks =
            Math.min(

                10,

                Math.max(

                    4,

                    Math.floor(
                        impact
                    )
                )
            );


        for (
            let i = 0;
            i < sparks;
            i++
        ) {

            if (
                !this.canCreateEffect()
            ) {

                break;
            }


            const angle =
                Phaser.Math.FloatBetween(
                    0,
                    Math.PI * 2
                );


            const distance =
                Phaser.Math.Between(
                    15,
                    45
                );


            const spark =
                this.scene.add.circle(

                    enemy.sprite.x,

                    enemy.sprite.y,

                    Phaser.Math.Between(
                        1,
                        3
                    ),

                    0xffffff,

                    0.9
                );


            this.effectLayer.add(
                spark
            );


            this.trackEffect(
                spark
            );


            this.scene.tweens.add({

                targets:
                    spark,

                x:
                    spark.x +
                    Math.cos(angle) *
                    distance,

                y:
                    spark.y +
                    Math.sin(angle) *
                    distance,

                alpha:
                    0,

                duration:
                    Phaser.Math.Between(
                        180,
                        340
                    ),

                onComplete:
                    () => {

                        if (
                            spark.active
                        ) {

                            spark.destroy();
                        }
                    }
            });
        }


        this.scene.cameras.main.shake(

            Phaser.Math.Clamp(
                100 +
                impact * 15,
                100,
                260
            ),

            Phaser.Math.Clamp(
                0.002 +
                impact * 0.0004,
                0.002,
                0.007
            )
        );
    }


    // =========================================================================
    // NEAR MISS
    // =========================================================================

    private checkNearMiss(
        player:
            Phaser.GameObjects.Sprite
    ) {

        const playerHalfW =
            this.playerWidth *
            0.34;

        const playerHalfH =
            this.playerHeight *
            0.36;


        for (
            const enemy of
            this.cars
        ) {

            if (
                !enemy.sprite.active ||
                enemy.nearMissed
            ) {

                continue;
            }


            const dx =
                Math.abs(
                    enemy.sprite.x -
                    player.x
                );


            const dy =
                Math.abs(
                    enemy.sprite.y -
                    player.y
                );


            const xLimit =
                playerHalfW +
                enemy.hitW +
                18;


            const yLimit =
                playerHalfH +
                enemy.hitH +
                25;


            if (
                dx <= xLimit &&
                dy <= yLimit
            ) {

                const overlapX =
                    dx <
                    playerHalfW +
                    enemy.hitW;


                const overlapY =
                    dy <
                    playerHalfH +
                    enemy.hitH;


                if (
                    !overlapX ||
                    !overlapY
                ) {

                    enemy.nearMissed =
                        true;


                    this.createNearMissEffect(
                        player,
                        enemy
                    );


                    this.emitEvent({

                        type:
                            "nearMiss",

                        vehicle:
                            enemy,

                        lane:
                            enemy.lane,

                        zone:
                            this.currentZone
                    });
                }
            }
        }
    }


    // =========================================================================
    // COLLISION
    // =========================================================================

    public checkCollision(
        player:
            Phaser.GameObjects.Sprite
    ): boolean {

        if (!player || !player.active) {
            return false;
        }

        // Collision uses CURRENT positions only.
        // Do not use prevX/prevY here: sweeping the old->new positions makes
        // a car collide while visibly passing beside the player.
        // Lane spacing is 60px, so the collision footprint is intentionally
        // much narrower than the rendered car sprite.
        const playerHalfW =
            Math.max(8, this.playerWidth * 0.18);
        const playerHalfH =
            Math.max(16, this.playerHeight * 0.28);

        const playerBox =
            new Phaser.Geom.Rectangle(
                player.x - playerHalfW,
                player.y - playerHalfH,
                playerHalfW * 2,
                playerHalfH * 2
            );

        let collision: EnemyCar | null = null;
        let strongestImpact = 0;

        for (const enemy of this.cars) {
            if (!enemy.sprite || !enemy.sprite.active) {
                continue;
            }

            const renderedW =
                Math.max(1, enemy.sprite.displayWidth);
            const renderedH =
                Math.max(1, enemy.sprite.displayHeight);

            const enemyHalfW =
                Math.max(10, renderedW * 0.23);
            const enemyHalfH =
                Math.max(16, renderedH * 0.48);

            const dx = Math.abs(player.x - enemy.sprite.x);
            const dy = Math.abs(player.y - enemy.sprite.y);

            // Adjacent lanes are 60px apart. With these footprints an adjacent
            // lane can never be considered a collision just because the
            // visible sprites are close to each other.
            if (
                dx >= playerHalfW + enemyHalfW ||
                dy >= playerHalfH + enemyHalfH
            ) {
                continue;
            }

            const enemyBox =
                new Phaser.Geom.Rectangle(
                    enemy.sprite.x - enemyHalfW,
                    enemy.sprite.y - enemyHalfH,
                    enemyHalfW * 2,
                    enemyHalfH * 2
                );

            if (!Phaser.Geom.Intersects.RectangleToRectangle(playerBox, enemyBox)) {
                continue;
            }

            const relativeSpeed =
                Math.abs(
                    this.currentPlayerSpeed -
                    enemy.currentSpeed
                );

            const impact = Phaser.Math.Clamp(
                relativeSpeed * 2.5 + enemy.mass,
                1,
                10
            );

            if (impact > strongestImpact) {
                strongestImpact = impact;
                collision = enemy;
            }
        }

        if (!collision) {
            return false;
        }

        collision.nearMissed = true;

        this.createImpactEffect(
            player,
            collision,
            strongestImpact
        );

        this.emitEvent({
            type: "collision",
            vehicle: collision,
            impact: strongestImpact,
            lane: collision.lane,
            zone: this.currentZone
        });

        return true;
    }

    // =========================================================================
    // UPDATE
    // =========================================================================

    public update(
        playerSpeed: number,

        distance: number,

        zone = 0,

        level = 1,

        nitro = false
    ) {

        if (
            !this.scene ||
            !this.scene.sys ||
            !this.scene.sys.isActive()
        ) {

            return;
        }


        const delta =
            Phaser.Math.Clamp(

                this.scene.game.loop.delta,

                0,

                50
            );


        const frameScale =
            delta /
            16.6667;


        this.elapsed +=
            delta;


        // ---------------------------------------------------------------------
        // WORLD STATE
        // ---------------------------------------------------------------------

        const levelZone =
            this.getZoneFromLevel(
                level
            );


        /*
         * FIX: GameScene's currentZone is 1-based (Zone 1 to 5),
         * but ZONE_PROFILES / VEHICLE_TYPES.zoneWeights are 0-based
         * (index 0 to 4). Without subtracting 1 here, every zone
         * was being treated as the NEXT zone's profile (e.g. Zone 1
         * incorrectly ran Zone 2's traffic settings).
         */
        const suppliedZone =
            Phaser.Math.Clamp(
                Math.floor(zone) - 1,
                0,
                4
            );


        /*
         * Level is authoritative when it indicates
         * a higher zone. This guarantees Zone 05
         * becomes active at Level 40+.
         */
        this.currentZone =
            Phaser.Math.Clamp(

                Math.max(
                    suppliedZone,
                    levelZone
                ),

                0,

                4
            );


        // Detect entering a new zone so the enemy grace
        // period restarts (gives the player a few clear
        // seconds before any enemy can spawn in it).
        if (
            this.currentZone !==
            this.previousZoneForPacing
        ) {

            this.previousZoneForPacing =
                this.currentZone;

            this.zoneEnteredAt =
                this.elapsed;
        }


        this.currentLevel =
            Math.max(
                1,
                Math.floor(level)
            );


        this.currentDistance =
            Math.max(

                0,

                Number.isFinite(
                    distance
                )
                    ? distance
                    : 0
            );


        this.currentPlayerSpeed =
            Number.isFinite(
                playerSpeed
            )
                ? Math.max(
                    0,
                    playerSpeed
                )
                : 0;


        this.currentNitro =
            !!nitro;


        // ---------------------------------------------------------------------
        // CLEAN DEAD
        // ---------------------------------------------------------------------

        const deadCars =
            this.cars.filter(
                car =>
                    !car.sprite ||
                    !car.sprite.active
            );


        for (
            const dead of
            deadCars
        ) {

            this.killLaneChangeTween(
                dead
            );
        }


        this.cars =
            this.cars.filter(
                car =>
                    car.sprite &&
                    car.sprite.active
            );


        // ---------------------------------------------------------------------
        // LANES
        // ---------------------------------------------------------------------

        this.rebuildLaneGroups();


        // ---------------------------------------------------------------------
        // SPAWN
        // ---------------------------------------------------------------------

        this.spawnTimer +=
            delta;


        let spawnDelay =
            this.getSpawnDelay(

                this.currentDistance,

                this.currentLevel,

                this.currentZone
            );


        /*
         * Nitro slightly reduces traffic
         * pressure while boosting.
         */
        if (
            nitro
        ) {

            spawnDelay *=
                1.35;
        }


        if (
            this.spawnTimer >=
            spawnDelay
        ) {

            this.spawnTimer =
                0;


            const maxCars =
                this.getMaxCars(

                    this.currentDistance,

                    this.currentLevel,

                    this.currentZone
                );


            if (
                this.cars.length <
                maxCars
            ) {

                const speedMultiplier =
                    this.getTrafficSpeedMultiplier(

                        this.currentDistance,

                        this.currentLevel,

                        this.currentZone
                    );


                // -------------------------------------------------------------
                // Integrated Hunter wave
                // Hunter is a first-class TrafficSystem vehicle.
                // The same spawn authority, lane occupancy and collision model
                // are used for normal traffic and Hunters.
                // -------------------------------------------------------------
                if (this.cars.length < maxCars) {
                    const hunter = this.chooseEnemy(this.currentZone);
                    if (hunter) {
                        const lane = this.pickHunterSpawnLane(hunter);
                        if (lane !== null) {
                            const spawned = this.spawnVehicle(lane, hunter, speedMultiplier);
                            console.log("[ENEMY DEBUG] spawnVehicle() returned:", spawned, "for", hunter.key);
                        }
                    }
                } else {
                    console.log(
                        "[ENEMY DEBUG] blocked: cars.length >= maxCars, hunter attempt skipped entirely",
                        "cars.length=", this.cars.length,
                        "maxCars=", maxCars,
                        "zone=", this.currentZone
                    );
                }

                // -------------------------------------------------------------
                // Normal traffic
                // -------------------------------------------------------------

                if (
                    this.cars.length <
                    maxCars
                ) {

                    const type =
                        this.chooseVehicle(
                            this.currentZone
                        );


                    const lane =
                        this.pickSpawnLane(
                            type
                        );


                    if (
                        lane !== null
                    ) {

                        this.spawnVehicle(

                            lane,

                            type,

                            speedMultiplier
                        );
                    }
                }


                // -------------------------------------------------------------
                // Secondary wave
                // -------------------------------------------------------------

                if (
                    this.cars.length <
                    maxCars
                ) {

                    const heavyChance =
                        this.getHeavyTrafficChance(

                            this.currentDistance,

                            this.currentLevel,

                            this.currentZone
                        );


                    if (
                        Phaser.Math.Between(
                            1,
                            100
                        ) <=
                        heavyChance
                    ) {

                        const secondType =
                            this.chooseVehicle(
                                this.currentZone
                            );


                        const secondLane =
                            this.pickSpawnLane(
                                secondType
                            );


                        if (
                            secondLane !== null
                        ) {

                            this.spawnVehicle(

                                secondLane,

                                secondType,

                                speedMultiplier
                            );
                        }
                    }
                }
            }
        }


        // ---------------------------------------------------------------------
        // UPDATE VEHICLES
        // ---------------------------------------------------------------------

        for (
            const enemy of
            this.cars
        ) {

            if (
                !enemy.sprite.active
            ) {

                continue;
            }


            enemy.prevX =
                enemy.sprite.x;


            enemy.prevY =
                enemy.sprite.y;


            enemy.brakeTimer =
                Math.max(
                    0,
                    enemy.brakeTimer -
                    delta
                );


            enemy.reactionTimer =
                Math.max(
                    0,
                    enemy.reactionTimer -
                    delta
                );


            // Personality
            this.updateVehicleBehavior(
                enemy,
                delta
            );


            // Following + integrated Hunter reasoning
            const blocked =
                this.avoidFrontCar(
                    enemy,
                    delta
                );

            if (this.isHunter(enemy)) {
                this.updateIntegratedHunter(enemy, delta, blocked);
            }

            // Nitro
            this.updateNitroReaction(
                enemy,
                delta,
                nitro
            );


            // Speed
            this.moveSpeedTowards(

                enemy,

                enemy.targetSpeed,

                enemy.acceleration,

                delta
            );


            enemy.currentSpeed =
                Phaser.Math.Clamp(

                    enemy.currentSpeed,

                    Math.max(
                        0.15,
                        enemy.minSpeed *
                        0.18
                    ),

                    enemy.maxSpeed
                );


            // Road movement
            const relativeSpeed =
                this.currentPlayerSpeed *
                0.65 -
                enemy.currentSpeed;


            enemy.sprite.y +=
                relativeSpeed *
                frameScale;


            // Lane lock
            if (
                !enemy.changingLane
            ) {

                enemy.sprite.x =
                    enemy.laneX;
            }


            // Hunters already planned a traffic-aware action above. Ordinary
            // traffic keeps the normal lane controller.
            if (!this.isHunter(enemy)) {
                this.updateLaneAI(
                    enemy,
                    blocked,
                    delta
                );
            }


            // Pursuit detection
            this.checkEnemyPursuit(
                enemy
            );


            // Speed FX
            enemy.effectTimer -=
                delta;


            if (
                enemy.effectTimer <=
                0
            ) {

                enemy.effectTimer =
                    Phaser.Math.Between(
                        180,
                        420
                    );


                this.createSpeedStreak(
                    enemy
                );
            }


            // Overtake
            if (
                enemy.overtaking &&
                enemy.prevY <=
                enemy.sprite.y &&
                enemy.sprite.y >
                enemy.prevY + 3
            ) {

                enemy.overtaking =
                    false;


                this.emitEvent({

                    type:
                        "overtake",

                    vehicle:
                        enemy,

                    lane:
                        enemy.lane,

                    zone:
                        this.currentZone
                });
            }


            // Despawn
            if (
                enemy.sprite.y >
                this.DESPAWN_Y
            ) {

                this.destroyEnemy(
                    enemy
                );

                continue;
            }


            // Invalid protection
            if (
                enemy.sprite.y <
                -5000 ||

                enemy.sprite.x <
                -500 ||

                enemy.sprite.x >
                900
            ) {

                this.destroyEnemy(
                    enemy
                );
            }
        }


        // ---------------------------------------------------------------------
        // FINAL CLEANUP
        // ---------------------------------------------------------------------

        this.cars =
            this.cars.filter(
                car =>
                    car.sprite &&
                    car.sprite.active
            );


        this.preventOverlap(
            delta
        );


        // ---------------------------------------------------------------------
        // NEAR MISS
        // ---------------------------------------------------------------------

        const player =
            this.getPlayer();


        if (
            player
        ) {

            this.checkNearMiss(
                player
            );
        }


        // ---------------------------------------------------------------------
        // SNAPSHOT
        // ---------------------------------------------------------------------

        if (
            this.elapsed -
            this.lastSnapshotTime >
            250
        ) {

            this.lastSnapshotTime =
                this.elapsed;


            this.emitSnapshot();
        }


        // ---------------------------------------------------------------------
        // SAVE PLAYER POSITION
        // ---------------------------------------------------------------------

        if (
            player
        ) {

            this.previousPlayerX =
                player.x;

            this.previousPlayerY =
                player.y;
        }
    }


    // =========================================================================
    // OVERLAP PROTECTION
    // =========================================================================

    private preventOverlap(
        delta: number
    ) {

        const frameScale =
            Phaser.Math.Clamp(

                delta /
                16.6667,

                0,

                3
            );


        for (
            const [, cars] of
            this.laneGroups
        ) {

            if (
                cars.length < 2
            ) {

                continue;
            }


            cars.sort(

                (a, b) =>
                    a.sprite.y -
                    b.sprite.y
            );


            for (
                let i = 1;
                i < cars.length;
                i++
            ) {

                const front =
                    cars[i - 1];


                const back =
                    cars[i];


                if (
                    !front.sprite.active ||
                    !back.sprite.active
                ) {

                    continue;
                }


                // ==================== تغییرات اصلی اینجا ====================
                const minimumGap =
                    Math.max(
                        100,  // ← از 50 به 100 افزایش
                        (front.hitH + back.hitH) * 1.5  // ← از 0.62 به 1.5 افزایش
                    );
                // ===========================================================


                const actualGap =
                    back.sprite.y -
                    front.sprite.y;


                if (
                    actualGap <
                    minimumGap
                ) {

                    const correction =
                        minimumGap -
                        actualGap;


                    back.sprite.y +=
                        correction *
                        Math.min(
                            1,
                            frameScale
                        );


                    back.currentSpeed =
                        Math.min(

                            back.currentSpeed,

                            front.currentSpeed
                        );
                }
            }
        }
    }


    // =========================================================================
    // CLEANUP
    // =========================================================================

    private killLaneChangeTween(
        enemy: EnemyCar
    ) {

        const tween =
            this.laneChangeTweens.get(
                enemy
            );


        if (tween) {

            tween.stop();

            this.laneChangeTweens.delete(
                enemy
            );
        }
    }


    private destroyEnemy(
        enemy: EnemyCar
    ) {

        this.killLaneChangeTween(
            enemy
        );


        enemy.changingLane =
            false;


        enemy.recentlyChangedLane =
            false;


        this.emitEvent({

            type:
                "destroy",

            vehicle:
                enemy,

            lane:
                enemy.lane,

            zone:
                this.currentZone
        });


        if (
            enemy.sprite &&
            enemy.sprite.active
        ) {

            enemy.sprite.destroy();
        }
    }


    // =========================================================================
    // PLAYER / AI BRIDGE API
    // =========================================================================

    public setPlayer(
        player: Phaser.GameObjects.Sprite
    ): void {
        this.playerSprite = player;
    }

    public setPlayerCollisionBounds(
        width: number,
        height: number
    ): void {
        if (Number.isFinite(width) && width > 0) {
            this.playerWidth = Phaser.Math.Clamp(width, 20, 120);
        }
        if (Number.isFinite(height) && height > 0) {
            this.playerHeight = Phaser.Math.Clamp(height, 40, 180);
        }
    }

    public getLaneCenters(): number[] {
        return [...this.LANES];
    }

    public getTrafficForAI(): Array<{
        sprite: Phaser.GameObjects.Sprite;
        lane: number;
        x: number;
        y: number;
        width: number;
        height: number;
        currentSpeed: number;
        targetLane: number;
        changingLane: boolean;
    }> {
        return this.cars
            .filter(car => car.sprite && car.sprite.active)
            .map(car => ({
                sprite: car.sprite,
                lane: car.lane,
                x: car.sprite.x,
                y: car.sprite.y,
                width: Math.max(12, car.hitW * 2),
                height: Math.max(24, car.hitH * 2),
                currentSpeed: car.currentSpeed,
                targetLane: car.targetLane,
                changingLane: car.changingLane
            }));
    }

    // =========================================================================
    // PUBLIC WORLD API
    // =========================================================================

    public setZone(
        zone: number
    ) {

        this.currentZone =
            Phaser.Math.Clamp(

                Math.floor(zone),

                0,

                4
            );
    }


    public setLevel(
        level: number
    ) {

        this.currentLevel =
            Math.max(
                1,
                Math.floor(level)
            );


        const zone =
            this.getZoneFromLevel(
                this.currentLevel
            );


        this.currentZone =
            Math.max(
                this.currentZone,
                zone
            );


        this.currentZone =
            Phaser.Math.Clamp(
                this.currentZone,
                0,
                4
            );
    }


    public getZone():
        number {

        return this.currentZone;
    }


    public getZoneName():
        string {

        return this.getZoneProfile(
            this.currentZone
        ).name;
    }


    public getSnapshot():
        TrafficSnapshot {

        return {

            count:
                this.cars.length,

            maxCars:
                this.getMaxCars(

                    this.currentDistance,

                    this.currentLevel,

                    this.currentZone
                ),

            difficulty:
                this.getDifficulty(

                    this.currentDistance,

                    this.currentLevel,

                    this.currentZone
                ),

            zone:
                this.currentZone,

            level:
                this.currentLevel,

            playerSpeed:
                this.currentPlayerSpeed,

            nitro:
                this.currentNitro
        };
    }


    public clear() {

        for (
            const car of
            this.cars
        ) {

            this.killLaneChangeTween(
                car
            );


            if (
                car.sprite &&
                car.sprite.active
            ) {

                car.sprite.destroy();
            }
        }


        this.cars = [];


        this.laneGroups.clear();


        for (
            let lane = 0;
            lane < this.LANES.length;
            lane++
        ) {

            this.laneGroups.set(
                lane,
                []
            );
        }


        this.spawnTimer = 0;

        this.lastSpawnedTypes = [];

        this.previousPlayerX = null;

        this.previousPlayerY = null;
    }


    public destroy() {

        this.clear();


        try {

            if (
                "speechSynthesis" in window
            ) {

                window.speechSynthesis.cancel();

            }

        }
        catch {}


        for (
            const tween of
            this.laneChangeTweens.values()
        ) {

            tween.stop();
        }


        this.laneChangeTweens.clear();


        if (
            this.effectLayer &&
            this.effectLayer.active
        ) {

            this.effectLayer.destroy();
        }


        this.eventListeners = [];

        this.snapshotListeners = [];
    }
}