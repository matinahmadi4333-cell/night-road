
// ============================================================
// NOVA OVERDRIVE
// WorldManager.ts
// Endless Cyberpunk World Director
// ============================================================

import Phaser from "phaser";

// ============================================================
// TYPES
// ============================================================

export type WorldState = {
    distance: number;
    speed: number;
    speedMultiplier: number;

    zone: number;
    zoneProgress: number;

    time: number;

    intensity: number;
    threat: number;

    scrollOffset: number;

    roadSpeed: number;

    isPaused: boolean;
};

export type WorldConfig = {
    baseSpeed?: number;
    maxSpeed?: number;

    zoneLength?: number;
    maxZone?: number;

    acceleration?: number;
    deceleration?: number;

    intensityGrowth?: number;
    threatGrowth?: number;
};

export type WorldEvent =
    | "ZONE_CHANGED"
    | "SPEED_CHANGED"
    | "INTENSITY_CHANGED"
    | "WORLD_RESET";

export type WorldEventData = {
    type: WorldEvent;

    zone: number;
    previousZone: number;

    speed: number;
    distance: number;

    intensity: number;
    threat: number;
};

// ============================================================
// WORLD MANAGER
// ============================================================

export default class WorldManager {

    // ========================================================
    // SCENE
    // ========================================================

    private scene:
        Phaser.Scene | null;

    // ========================================================
    // CONFIG
    // ========================================================

    private readonly baseSpeed:
        number;

    private readonly maxSpeed:
        number;

    private readonly zoneLength:
        number;

    private readonly maxZone:
        number;

    private readonly acceleration:
        number;

    private readonly deceleration:
        number;

    private readonly intensityGrowth:
        number;

    private readonly threatGrowth:
        number;

    // ========================================================
    // STATE
    // ========================================================

    private distance =
        0;

    private speed =
        8;

    private targetSpeed =
        8;

    private speedMultiplier =
        1;

    private zone =
        1;

    private previousZone =
        1;

    private time =
        0;

    private intensity =
        0;

    private threat =
        0;

    private scrollOffset =
        0;

    private roadSpeed =
        0;

    private isPaused =
        false;

    // ========================================================
    // EVENTS
    // ========================================================

    private listeners:
        Map<
            WorldEvent,
            Array<
                (
                    data: WorldEventData
                ) => void
            >
        > =
        new Map();

    // ========================================================
    // CONSTRUCTOR
    // ========================================================

    constructor(
        scene?: Phaser.Scene,
        config?: WorldConfig
    ) {

        this.scene =
            scene ?? null;

        this.baseSpeed =
            config?.baseSpeed ??
            8;

        this.maxSpeed =
            config?.maxSpeed ??
            30;

        this.zoneLength =
            config?.zoneLength ??
            5000;

        this.maxZone =
            config?.maxZone ??
            20;

        this.acceleration =
            config?.acceleration ??
            8;

        this.deceleration =
            config?.deceleration ??
            12;

        this.intensityGrowth =
            config?.intensityGrowth ??
            0.000025;

        this.threatGrowth =
            config?.threatGrowth ??
            0.00002;

        this.speed =
            this.baseSpeed;

        this.targetSpeed =
            this.baseSpeed;

    }

    // ========================================================
    // UPDATE
    // ========================================================

    update(
        delta: number,
        externalSpeed?: number
    ): void {

        if (
            this.isPaused
        ) {

            return;

        }

        const dt =
            Math.max(
                0,
                delta
            ) /
            1000;

        if (
            dt <= 0
        ) {

            return;

        }

        this.time +=
            dt;

        // ----------------------------------------------------
        // EXTERNAL SPEED
        // ----------------------------------------------------

        if (
            Number.isFinite(
                externalSpeed
            )
        ) {

            this.targetSpeed =
                this.clamp(
                    externalSpeed ?? this.speed,
                    0,
                    this.maxSpeed
                );

        }

        // ----------------------------------------------------
        // SPEED
        // ----------------------------------------------------

        this.updateSpeed(
            dt
        );

        // ----------------------------------------------------
        // DISTANCE
        // ----------------------------------------------------

        this.updateDistance(
            dt
        );

        // ----------------------------------------------------
        // ZONE
        // ----------------------------------------------------

        this.updateZone();

        // ----------------------------------------------------
        // INTENSITY
        // ----------------------------------------------------

        this.updateIntensity();

        // ----------------------------------------------------
        // THREAT
        // ----------------------------------------------------

        this.updateThreat();

        // ----------------------------------------------------
        // ROAD SCROLL
        // ----------------------------------------------------

        this.updateScroll(
            dt
        );

    }

    // ========================================================
    // SPEED
    // ========================================================

    private updateSpeed(
        dt: number
    ): void {

        const difference =
            this.targetSpeed -
            this.speed;

        if (
            Math.abs(
                difference
            ) <
            0.01
        ) {

            this.speed =
                this.targetSpeed;

            return;

        }

        const rate =
            difference > 0
                ? this.acceleration
                : this.deceleration;

        const step =
            rate *
            dt;

        if (
            difference > 0
        ) {

            this.speed =
                Math.min(
                    this.targetSpeed,
                    this.speed +
                    step
                );

        } else {

            this.speed =
                Math.max(
                    this.targetSpeed,
                    this.speed -
                    step
                );

        }

        this.speed =
            this.clamp(
                this.speed,
                0,
                this.maxSpeed
            );

        this.roadSpeed =
            this.speed *
            this.speedMultiplier;

    }

    // ========================================================
    // DISTANCE
    // ========================================================

    private updateDistance(
        dt: number
    ): void {

        const distancePerSecond =
            this.speed *
            10 *
            this.speedMultiplier;

        this.distance +=
            distancePerSecond *
            dt;

    }

    // ========================================================
    // ZONE
    // ========================================================

    private updateZone(): void {

        const calculatedZone =
            Math.floor(
                this.distance /
                this.zoneLength
            ) + 1;

        const nextZone =
            this.clamp(
                calculatedZone,
                1,
                this.maxZone
            );

        if (
            nextZone ===
            this.zone
        ) {

            return;

        }

        this.previousZone =
            this.zone;

        this.zone =
            nextZone;

        this.emit(
            "ZONE_CHANGED"
        );

    }

    // ========================================================
    // INTENSITY
    // ========================================================

    private updateIntensity(): void {

        const calculated =
            this.distance *
            this.intensityGrowth;

        this.intensity =
            this.clamp(
                calculated,
                0,
                1
            );

        this.emit(
            "INTENSITY_CHANGED"
        );

    }

    // ========================================================
    // THREAT
    // ========================================================

    private updateThreat(): void {

        const calculated =
            this.distance *
            this.threatGrowth;

        const zoneThreat =
            (
                this.zone -
                1
            ) *
            0.08;

        this.threat =
            this.clamp(
                calculated +
                zoneThreat,
                0,
                1
            );

    }

    // ========================================================
    // SCROLL
    // ========================================================

    private updateScroll(
        dt: number
    ): void {

        this.scrollOffset +=
            this.roadSpeed *
            10 *
            dt;

        if (
            this.scrollOffset >=
            1000000
        ) {

            this.scrollOffset -=
                1000000;

        }

    }

    // ========================================================
    // SET SPEED
    // ========================================================

    setSpeed(
        speed: number
    ): void {

        if (
            !Number.isFinite(
                speed
            )
        ) {

            return;

        }

        const previous =
            this.targetSpeed;

        this.targetSpeed =
            this.clamp(
                speed,
                0,
                this.maxSpeed
            );

        if (
            Math.abs(
                previous -
                this.targetSpeed
            ) >
            0.01
        ) {

            this.emit(
                "SPEED_CHANGED"
            );

        }

    }

    // ========================================================
    // SPEED MULTIPLIER
    // ========================================================

    setSpeedMultiplier(
        multiplier: number
    ): void {

        if (
            !Number.isFinite(
                multiplier
            )
        ) {

            return;

        }

        this.speedMultiplier =
            this.clamp(
                multiplier,
                0,
                5
            );

        this.roadSpeed =
            this.speed *
            this.speedMultiplier;

    }

    // ========================================================
    // ADD SPEED MULTIPLIER
    // ========================================================

    multiplySpeed(
        amount: number
    ): void {

        if (
            !Number.isFinite(
                amount
            )
        ) {

            return;

        }

        this.setSpeedMultiplier(
            this.speedMultiplier *
            amount
        );

    }

    // ========================================================
    // DISTANCE
    // ========================================================

    setDistance(
        distance: number
    ): void {

        if (
            !Number.isFinite(
                distance
            )
        ) {

            return;

        }

        this.distance =
            Math.max(
                0,
                distance
            );

        this.updateZone();
        this.updateIntensity();
        this.updateThreat();

    }

    // ========================================================
    // ADD DISTANCE
    // ========================================================

    addDistance(
        amount: number
    ): void {

        if (
            !Number.isFinite(
                amount
            )
        ) {

            return;

        }

        this.setDistance(
            this.distance +
            amount
        );

    }

    // ========================================================
    // FORCE ZONE
    // ========================================================

    setZone(
        zone: number
    ): void {

        if (
            !Number.isFinite(
                zone
            )
        ) {

            return;

        }

        const nextZone =
            this.clamp(
                Math.floor(
                    zone
                ),
                1,
                this.maxZone
            );

        if (
            nextZone ===
            this.zone
        ) {

            return;

        }

        this.previousZone =
            this.zone;

        this.zone =
            nextZone;

        this.emit(
            "ZONE_CHANGED"
        );

    }

    // ========================================================
    // UNLOCK NEXT ZONE
    // ========================================================

    unlockNextZone(): number {

        if (
            this.zone >=
            this.maxZone
        ) {

            return this.zone;

        }

        this.previousZone =
            this.zone;

        this.zone++;

        this.emit(
            "ZONE_CHANGED"
        );

        return this.zone;

    }

    // ========================================================
    // INTENSITY
    // ========================================================

    setIntensity(
        value: number
    ): void {

        this.intensity =
            this.clamp(
                value,
                0,
                1
            );

    }

    // ========================================================
    // THREAT
    // ========================================================

    setThreat(
        value: number
    ): void {

        this.threat =
            this.clamp(
                value,
                0,
                1
            );

    }

    // ========================================================
    // PAUSE
    // ========================================================

    pause(): void {

        this.isPaused =
            true;

    }

    // ========================================================
    // RESUME
    // ========================================================

    resume(): void {

        this.isPaused =
            false;

    }

    // ========================================================
    // IS PAUSED
    // ========================================================

    getIsPaused():
        boolean {

        return this.isPaused;

    }

    // ========================================================
    // GET SPEED
    // ========================================================

    getSpeed():
        number {

        return this.speed;

    }

    // ========================================================
    // GET TARGET SPEED
    // ========================================================

    getTargetSpeed():
        number {

        return this.targetSpeed;

    }

    // ========================================================
    // GET ROAD SPEED
    // ========================================================

    getRoadSpeed():
        number {

        return this.roadSpeed;

    }

    // ========================================================
    // GET DISTANCE
    // ========================================================

    getDistance():
        number {

        return this.distance;

    }

    // ========================================================
    // GET ZONE
    // ========================================================

    getZone():
        number {

        return this.zone;

    }

    // ========================================================
    // GET PREVIOUS ZONE
    // ========================================================

    getPreviousZone():
        number {

        return this.previousZone;

    }

    // ========================================================
    // GET ZONE PROGRESS
    // ========================================================

    getZoneProgress():
        number {

        const insideZone =
            this.distance %
            this.zoneLength;

        return this.clamp(
            insideZone /
            this.zoneLength,
            0,
            1
        );

    }

    // ========================================================
    // GET INTENSITY
    // ========================================================

    getIntensity():
        number {

        return this.intensity;

    }

    // ========================================================
    // GET THREAT
    // ========================================================

    getThreat():
        number {

        return this.threat;

    }

    // ========================================================
    // GET TIME
    // ========================================================

    getTime():
        number {

        return this.time;

    }

    // ========================================================
    // GET SCROLL
    // ========================================================

    getScrollOffset():
        number {

        return this.scrollOffset;

    }

    // ========================================================
    // GET SPEED MULTIPLIER
    // ========================================================

    getSpeedMultiplier():
        number {

        return this.speedMultiplier;

    }

    // ========================================================
    // STATE
    // ========================================================

    getState():
        WorldState {

        return {

            distance:
                this.distance,

            speed:
                this.speed,

            speedMultiplier:
                this.speedMultiplier,

            zone:
                this.zone,

            zoneProgress:
                this.getZoneProgress(),

            time:
                this.time,

            intensity:
                this.intensity,

            threat:
                this.threat,

            scrollOffset:
                this.scrollOffset,

            roadSpeed:
                this.roadSpeed,

            isPaused:
                this.isPaused

        };

    }

    // ========================================================
    // EVENT LISTENER
    // ========================================================

    on(
        event: WorldEvent,
        listener:
            (
                data: WorldEventData
            ) => void
    ): () => void {

        if (
            !this.listeners.has(
                event
            )
        ) {

            this.listeners.set(
                event,
                []
            );

        }

        this.listeners
            .get(event)!
            .push(
                listener
            );

        return () => {

            const list =
                this.listeners.get(
                    event
                );

            if (
                !list
            ) {

                return;

            }

            const index =
                list.indexOf(
                    listener
                );

            if (
                index >= 0
            ) {

                list.splice(
                    index,
                    1
                );

            }

        };

    }

    // ========================================================
    // EMIT
    // ========================================================

    private emit(
        event: WorldEvent
    ): void {

        const data:
            WorldEventData = {

            type:
                event,

            zone:
                this.zone,

            previousZone:
                this.previousZone,

            speed:
                this.speed,

            distance:
                this.distance,

            intensity:
                this.intensity,

            threat:
                this.threat

        };

        const listeners =
            this.listeners.get(
                event
            );

        if (
            !listeners
        ) {

            return;

        }

        for (
            const listener of
            [...listeners]
        ) {

            try {

                listener(
                    data
                );

            } catch {

                // Never allow a listener
                // to break the world manager.
            }

        }

    }

    // ========================================================
    // SNAPSHOT
    // ========================================================

    getSnapshot():
        WorldState {

        return this.getState();

    }

    // ========================================================
    // RESTORE
    // ========================================================

    restore(
        state: WorldState
    ): void {

        if (
            !state
        ) {

            return;

        }

        this.distance =
            Math.max(
                0,
                state.distance ?? 0
            );

        this.speed =
            this.clamp(
                state.speed ?? this.baseSpeed,
                0,
                this.maxSpeed
            );

        this.targetSpeed =
            this.speed;

        this.speedMultiplier =
            this.clamp(
                state.speedMultiplier ?? 1,
                0,
                5
            );

        this.zone =
            this.clamp(
                Math.floor(
                    state.zone ?? 1
                ),
                1,
                this.maxZone
            );

        this.previousZone =
            this.zone;

        this.time =
            Math.max(
                0,
                state.time ?? 0
            );

        this.intensity =
            this.clamp(
                state.intensity ?? 0,
                0,
                1
            );

        this.threat =
            this.clamp(
                state.threat ?? 0,
                0,
                1
            );

        this.scrollOffset =
            Math.max(
                0,
                state.scrollOffset ?? 0
            );

        this.roadSpeed =
            this.speed *
            this.speedMultiplier;

        this.isPaused =
            Boolean(
                state.isPaused
            );

    }

    // ========================================================
    // RESET
    // ========================================================

    reset(): void {

        this.distance =
            0;

        this.speed =
            this.baseSpeed;

        this.targetSpeed =
            this.baseSpeed;

        this.speedMultiplier =
            1;

        this.zone =
            1;

        this.previousZone =
            1;

        this.time =
            0;

        this.intensity =
            0;

        this.threat =
            0;

        this.scrollOffset =
            0;

        this.roadSpeed =
            this.baseSpeed;

        this.isPaused =
            false;

        this.emit(
            "WORLD_RESET"
        );

    }

    // ========================================================
    // DEBUG
    // ========================================================

    getDebugInfo() {

        return {

            distance:
                Math.floor(
                    this.distance
                ),

            speed:
                Number(
                    this.speed.toFixed(2)
                ),

            targetSpeed:
                Number(
                    this.targetSpeed.toFixed(2)
                ),

            roadSpeed:
                Number(
                    this.roadSpeed.toFixed(2)
                ),

            multiplier:
                Number(
                    this.speedMultiplier.toFixed(2)
                ),

            zone:
                this.zone,

            zoneProgress:
                Number(
                    this.getZoneProgress()
                        .toFixed(3)
                ),

            intensity:
                Number(
                    this.intensity.toFixed(3)
                ),

            threat:
                Number(
                    this.threat.toFixed(3)
                ),

            time:
                Number(
                    this.time.toFixed(2)
                ),

            paused:
                this.isPaused

        };

    }

    // ========================================================
    // CLAMP
    // ========================================================

    private clamp(
        value: number,
        min: number,
        max: number
    ): number {

        return Math.max(
            min,
            Math.min(
                max,
                value
            )
        );

    }

}
