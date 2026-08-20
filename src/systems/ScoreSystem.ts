// ============================================================
// ScoreSystem.ts
// NOVA OVERDRIVE
// Premium Arcade Score System
//
// Designed for:
// • Endless Racing
// • Crystals
// • Combo
// • Near Miss
// • Speed
// • Nitro
// • Level / Zone progression
// • Best Score
// • Mobile performance
// ============================================================

export type ScoreEventType =
    | "distance"
    | "crystal"
    | "nearMiss"
    | "combo"
    | "speed"
    | "zone"
    | "level"
    | "nitro";

export interface ScoreEvent {
    type: ScoreEventType;
    amount: number;
    total: number;
}

export default class ScoreSystem {

    // ============================================================
    // SCORE
    // ============================================================

    private score = 0;

    private bestScore = 0;

    // ============================================================
    // COMBO
    // ============================================================

    private combo = 0;

    private comboTimer = 0;

    /**
     * Maximum time between combo actions.
     */
    private readonly comboWindow = 3000;

    /**
     * Maximum multiplier.
     */
    private readonly maxComboMultiplier = 10;

    // ============================================================
    // CRYSTALS
    // ============================================================

    private crystalsCollected = 0;

    private crystalScore = 0;

    // ============================================================
    // NEAR MISS
    // ============================================================

    private nearMisses = 0;

    private nearMissScore = 0;

    // ============================================================
    // DISTANCE
    // ============================================================

    private distanceScore = 0;

    private distanceAccumulator = 0;

    // ============================================================
    // SPEED
    // ============================================================

    private currentSpeed = 0;

    private speedScore = 0;

    // ============================================================
    // NITRO
    // ============================================================

    private nitroActive = false;

    private nitroScore = 0;

    private nitroTime = 0;

    // ============================================================
    // LEVEL / ZONE
    // ============================================================

    private currentLevel = 1;

    private currentZone = 1;

    private levelBonusScore = 0;

    private zoneBonusScore = 0;

    // ============================================================
    // RUN STATE
    // ============================================================

    private running = true;

    private elapsedTime = 0;

    // ============================================================
    // EVENTS
    // ============================================================

    private lastEvent?: ScoreEvent;

    // ============================================================
    // CONFIG
    // ============================================================

    /**
     * Base score for each crystal.
     *
     * CrystalSystem already converts:
     *
     * normal = 1
     * gold   = 5
     * red    = 15
     *
     * So we keep this at 10.
     */
    private readonly CRYSTAL_SCORE_MULTIPLIER = 10;

    /**
     * Near miss base score.
     */
    private readonly NEAR_MISS_BASE = 100;

    /**
     * Score gained from driving.
     *
     * At speed 80:
     * around 100 score / second.
     */
    private readonly SPEED_SCORE_RATE = 1.25;

    /**
     * Extra score while using Nitro.
     */
    private readonly NITRO_SCORE_RATE = 1.5;

    /**
     * Every level reached.
     */
    private readonly LEVEL_BONUS = 500;

    /**
     * Every new zone.
     */
    private readonly ZONE_BONUS = 2500;

    // ============================================================
    // CONSTRUCTOR
    // ============================================================

    constructor() {

        this.reset();
    }

    // ============================================================
    // RESET
    // ============================================================

    public reset(): void {

        this.score = 0;

        this.combo = 0;

        this.comboTimer = 0;

        this.crystalsCollected = 0;

        this.crystalScore = 0;

        this.nearMisses = 0;

        this.nearMissScore = 0;

        this.distanceScore = 0;

        this.distanceAccumulator = 0;

        this.currentSpeed = 0;

        this.speedScore = 0;

        this.nitroActive = false;

        this.nitroScore = 0;

        this.nitroTime = 0;

        this.currentLevel = 1;

        this.currentZone = 1;

        this.levelBonusScore = 0;

        this.zoneBonusScore = 0;

        this.elapsedTime = 0;

        this.running = true;

        this.lastEvent = undefined;
    }

    // ============================================================
    // UPDATE
    // ============================================================

    /**
     * Called every frame from GameScene.
     *
     * GameScene already calls:
     *
     * this.scoreSystem.update(delta);
     */
    public update(delta: number): void {

        if (!this.running) {
            return;
        }

        if (!Number.isFinite(delta)) {
            return;
        }

        // --------------------------------------------------------
        // Clamp delta
        // --------------------------------------------------------

        const safeDelta =
            Math.min(
                Math.max(delta, 0),
                100
            );

        this.elapsedTime += safeDelta;

        // --------------------------------------------------------
        // Combo timer
        // --------------------------------------------------------

        if (this.combo > 0) {

            this.comboTimer += safeDelta;

            if (
                this.comboTimer >=
                this.comboWindow
            ) {

                this.resetCombo();
            }
        }

        // --------------------------------------------------------
        // Driving score
        // --------------------------------------------------------

        if (this.currentSpeed > 0) {

            const seconds =
                safeDelta / 1000;

            const base =
                this.currentSpeed *
                this.SPEED_SCORE_RATE *
                seconds;

            const multiplier =
                this.getComboMultiplier();

            const gained =
                base * multiplier;

            this.score += gained;

            this.speedScore += gained;
        }

        // --------------------------------------------------------
        // Nitro bonus
        // --------------------------------------------------------

        if (this.nitroActive) {

            const seconds =
                safeDelta / 1000;

            const gained =
                this.currentSpeed *
                this.NITRO_SCORE_RATE *
                seconds;

            this.score += gained;

            this.nitroScore += gained;

            this.nitroTime +=
                safeDelta;
        }

        // --------------------------------------------------------
        // Best score
        // --------------------------------------------------------

        this.updateBestScore();
    }

    // ============================================================
    // SPEED
    // ============================================================

    /**
     * GameScene can call this when speed changes.
     */
    public setSpeed(speed: number): void {

        if (!Number.isFinite(speed)) {
            return;
        }

        this.currentSpeed =
            Math.max(0, speed);
    }

    public getSpeed(): number {
        return this.currentSpeed;
    }

    // ============================================================
    // NITRO
    // ============================================================

    /**
     * GameScene can use this when Nitro starts/stops.
     */
    public setNitro(active: boolean): void {

        this.nitroActive = active === true;
    }

    public isNitroActive(): boolean {
        return this.nitroActive;
    }

    // ============================================================
    // DISTANCE
    // ============================================================

    /**
     * Optional API.
     *
     * GameScene can send its distance here.
     *
     * It is intentionally NOT required because the current
     * GameScene already scores continuously from speed.
     */
    public addDistance(
        distance: number
    ): void {

        if (
            !Number.isFinite(distance) ||
            distance <= 0
        ) {
            return;
        }

        this.distanceAccumulator +=
            distance;

        /*
         * Every 100 distance units
         * gives a small score bonus.
         */
        while (
            this.distanceAccumulator >= 100
        ) {

            this.distanceAccumulator -=
                100;

            const gained =
                25 *
                this.getComboMultiplier();

            this.score += gained;

            this.distanceScore += gained;
        }

        this.updateBestScore();
    }

    // ============================================================
    // CRYSTAL
    // ============================================================

    /**
     * Called directly by GameScene:
     *
     * this.scoreSystem.addCrystal(
     *     this.crystal.lastCollected
     * );
     */
    public addCrystal(
        amount: number = 1
    ): void {

        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {
            return;
        }

        const safeAmount =
            Math.max(
                1,
                Math.floor(amount)
            );

        // --------------------------------------------------------
        // Crystal count
        // --------------------------------------------------------

        this.crystalsCollected +=
            safeAmount;

        // --------------------------------------------------------
        // Combo
        // --------------------------------------------------------

        this.addCombo();

        // --------------------------------------------------------
        // Crystal score
        // --------------------------------------------------------

        const multiplier =
            this.getComboMultiplier();

        const gained =
            safeAmount *
            this.CRYSTAL_SCORE_MULTIPLIER *
            multiplier;

        this.score += gained;

        this.crystalScore += gained;

        // --------------------------------------------------------
        // Event
        // --------------------------------------------------------

        this.lastEvent = {
            type: "crystal",
            amount: gained,
            total: this.score
        };

        this.updateBestScore();
    }

    // ============================================================
    // NEAR MISS
    // ============================================================

    /**
     * Called directly by GameScene:
     *
     * this.scoreSystem.addNearMiss();
     */
    public addNearMiss(): void {

        this.nearMisses++;

        // --------------------------------------------------------
        // Combo
        // --------------------------------------------------------

        this.addCombo();

        // --------------------------------------------------------
        // Score
        // --------------------------------------------------------

        const multiplier =
            this.getComboMultiplier();

        const gained =
            this.NEAR_MISS_BASE *
            multiplier;

        this.score += gained;

        this.nearMissScore += gained;

        // --------------------------------------------------------
        // Event
        // --------------------------------------------------------

        this.lastEvent = {
            type: "nearMiss",
            amount: gained,
            total: this.score
        };

        this.updateBestScore();
    }

    // ============================================================
    // COMBO
    // ============================================================

    private addCombo(): void {

        this.combo++;

        this.comboTimer = 0;

        /*
         * Combo itself doesn't directly add score.
         *
         * It increases the multiplier for:
         *
         * • Crystals
         * • Near Miss
         * • Driving
         */
    }

    public getCombo(): number {
        return this.combo;
    }

    public getComboMultiplier(): number {

        if (this.combo <= 0) {
            return 1;
        }

        /*
         * 1-2 combo = x1
         * 3-4      = x2
         * 5-6      = x3
         * ...
         *
         * Max x10
         */
        const multiplier =
            Math.floor(
                this.combo / 2
            ) + 1;

        return Math.min(
            multiplier,
            this.maxComboMultiplier
        );
    }

    // ============================================================
    // RESET COMBO
    // ============================================================

    /**
     * Called by GameScene after a crash.
     */
    public resetCombo(): void {

        this.combo = 0;

        this.comboTimer = 0;
    }

    // ============================================================
    // LEVEL
    // ============================================================

    /**
     * Optional.
     *
     * Call this when LevelSystem changes level.
     */
    public setLevel(
        level: number
    ): void {

        if (
            !Number.isFinite(level)
        ) {
            return;
        }

        const safeLevel =
            Math.max(
                1,
                Math.floor(level)
            );

        if (
            safeLevel <=
            this.currentLevel
        ) {
            this.currentLevel =
                safeLevel;

            return;
        }

        const levelsPassed =
            safeLevel -
            this.currentLevel;

        this.currentLevel =
            safeLevel;

        const gained =
            levelsPassed *
            this.LEVEL_BONUS *
            this.getComboMultiplier();

        this.score += gained;

        this.levelBonusScore +=
            gained;

        this.lastEvent = {
            type: "level",
            amount: gained,
            total: this.score
        };

        this.updateBestScore();
    }

    public getLevel(): number {
        return this.currentLevel;
    }

    // ============================================================
    // ZONE
    // ============================================================

    /**
     * Optional.
     *
     * Use when player enters Zone 2, 3, 4, 5.
     */
    public setZone(
        zone: number
    ): void {

        if (
            !Number.isFinite(zone)
        ) {
            return;
        }

        const safeZone =
            Math.max(
                1,
                Math.floor(zone)
            );

        if (
            safeZone <=
            this.currentZone
        ) {
            this.currentZone =
                safeZone;

            return;
        }

        const zonesPassed =
            safeZone -
            this.currentZone;

        this.currentZone =
            safeZone;

        const gained =
            zonesPassed *
            this.ZONE_BONUS *
            this.getComboMultiplier();

        this.score += gained;

        this.zoneBonusScore +=
            gained;

        this.lastEvent = {
            type: "zone",
            amount: gained,
            total: this.score
        };

        this.updateBestScore();
    }

    public getZone(): number {
        return this.currentZone;
    }

    // ============================================================
    // SCORE
    // ============================================================

    public getScore(): number {

        return Math.max(
            0,
            Math.floor(this.score)
        );
    }

    // ============================================================
    // BEST SCORE
    // ============================================================

    private updateBestScore(): void {

        const current =
            Math.floor(this.score);

        if (
            current >
            this.bestScore
        ) {

            this.bestScore =
                current;
        }
    }

    public getBestScore(): number {
        return this.bestScore;
    }

    // ============================================================
    // RUN CONTROL
    // ============================================================

    public pause(): void {
        this.running = false;
    }

    public resume(): void {
        this.running = true;
    }

    public isRunning(): boolean {
        return this.running;
    }

    // ============================================================
    // STATISTICS
    // ============================================================

    public getCrystalsCollected(): number {
        return this.crystalsCollected;
    }

    public getCrystalScore(): number {
        return Math.floor(
            this.crystalScore
        );
    }

    public getNearMisses(): number {
        return this.nearMisses;
    }

    public getNearMissScore(): number {
        return Math.floor(
            this.nearMissScore
        );
    }

    public getDistanceScore(): number {
        return Math.floor(
            this.distanceScore
        );
    }

    public getSpeedScore(): number {
        return Math.floor(
            this.speedScore
        );
    }

    public getNitroScore(): number {
        return Math.floor(
            this.nitroScore
        );
    }

    public getNitroTime(): number {
        return this.nitroTime;
    }

    public getElapsedTime(): number {
        return this.elapsedTime;
    }

    // ============================================================
    // LAST EVENT
    // ============================================================

    public getLastEvent():
        ScoreEvent | undefined {

        return this.lastEvent;
    }

    public clearLastEvent(): void {
        this.lastEvent = undefined;
    }

    // ============================================================
    // SCORE BREAKDOWN
    // ============================================================

    public getBreakdown() {

        return {
            total:
                this.getScore(),

            best:
                this.getBestScore(),

            crystals:
                this.crystalsCollected,

            crystalScore:
                Math.floor(
                    this.crystalScore
                ),

            nearMisses:
                this.nearMisses,

            nearMissScore:
                Math.floor(
                    this.nearMissScore
                ),

            distanceScore:
                Math.floor(
                    this.distanceScore
                ),

            speedScore:
                Math.floor(
                    this.speedScore
                ),

            nitroScore:
                Math.floor(
                    this.nitroScore
                ),

            levelBonus:
                Math.floor(
                    this.levelBonusScore
                ),

            zoneBonus:
                Math.floor(
                    this.zoneBonusScore
                ),

            combo:
                this.combo,

            multiplier:
                this.getComboMultiplier(),

            level:
                this.currentLevel,

            zone:
                this.currentZone
        };
    }

    // ============================================================
    // SNAPSHOT
    // ============================================================

    public getSnapshot() {

        return {
            score:
                this.getScore(),

            bestScore:
                this.getBestScore(),

            combo:
                this.combo,

            multiplier:
                this.getComboMultiplier(),

            crystals:
                this.crystalsCollected,

            nearMisses:
                this.nearMisses,

            speed:
                this.currentSpeed,

            nitro:
                this.nitroActive,

            level:
                this.currentLevel,

            zone:
                this.currentZone,

            elapsed:
                this.elapsedTime
        };
    }

    // ============================================================
    // FINALIZE RUN
    // ============================================================

    /**
     * Call when the run ends.
     *
     * Returns the final score.
     */
    public finalize(): number {

        this.running = false;

        this.updateBestScore();

        return this.getScore();
    }

    // ============================================================
    // DESTROY
    // ============================================================

    public destroy(): void {

        this.running = false;

        this.score = 0;

        this.combo = 0;

        this.crystalsCollected = 0;

        this.nearMisses = 0;

        this.lastEvent = undefined;
    }
}