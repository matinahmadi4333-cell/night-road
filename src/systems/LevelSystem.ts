
// ============================================================
// NOVA OVERDRIVE
// LevelSystem.ts
// Cinematic Dynamic Level / Difficulty Director
// ============================================================

export type LevelRank =
    | "ROOKIE"
    | "DRIVER"
    | "RUNNER"
    | "HUNTER"
    | "ELITE"
    | "APEX"
    | "OVERDRIVE";

export type LevelState = {
    level: number;
    rank: LevelRank;

    currentXP: number;
    requiredXP: number;
    totalXP: number;

    progress: number;

    distance: number;
    score: number;

    difficulty: number;
    multiplier: number;

    maxLevel: number;

    justLeveledUp: boolean;
};

export type LevelUpdateData = {
    delta?: number;

    distance?: number;
    score?: number;

    crystals?: number;
    combo?: number;

    survivalTime?: number;

    nearMisses?: number;
    overtakes?: number;

    eventCompleted?: boolean;

    eventRewardXP?: number;

    zone?: number;
    zoneThreat?: number;
};

export type LevelUpEvent = {
    previousLevel: number;
    newLevel: number;

    rank: LevelRank;

    xp: number;
    requiredXP: number;

    difficulty: number;

    rewardXP: number;
};

export type LevelSnapshot = {
    level: number;

    rank: LevelRank;

    currentXP: number;
    requiredXP: number;
    totalXP: number;

    distance: number;
    score: number;

    difficulty: number;
    multiplier: number;

    maxLevel: number;
};

// ============================================================
// LEVEL SYSTEM
// ============================================================

export default class LevelSystem {

    // ========================================================
    // CONFIG
    // ========================================================

    private readonly MAX_LEVEL =
        50;

    private readonly BASE_XP =
        1000;

    private readonly XP_GROWTH =
        1.28;

    private readonly MAX_DIFFICULTY =
        10;

    private readonly MIN_DIFFICULTY =
        1;

    // ========================================================
    // STATE
    // ========================================================

    private level =
        1;

    private rank:
        LevelRank =
        "ROOKIE";

    private currentXP =
        0;

    private totalXP =
        0;

    private requiredXP =
        this.calculateRequiredXP(
            1
        );

    private distance =
        0;

    private score =
        0;

    private difficulty =
        1;

    private multiplier =
        1;

    private lastDistanceXP =
        0;

    private lastScoreXP =
        0;

    private justLeveledUp =
        false;

    // ========================================================
    // ANTI FARM
    // ========================================================

    private distanceXPInterval =
        250;

    private scoreXPInterval =
        1000;

    private lastEventXPTime =
        0;

    private eventXPDelay =
        1200;

    private elapsed =
        0;

    // ========================================================
    // LISTENERS
    // ========================================================

    private levelUpListeners:
        Array<
            (
                event: LevelUpEvent
            ) => void
        > = [];

    // ========================================================
    // CONSTRUCTOR
    // ========================================================

    constructor() {

        this.reset();

    }

    // ========================================================
    // UPDATE
    // ========================================================

    update(
        data: LevelUpdateData
    ): LevelUpEvent[] {

        const delta =
            Math.max(
                0,
                data.delta ?? 16.67
            );

        this.elapsed +=
            delta;

        this.justLeveledUp =
            false;

        if (
            Number.isFinite(
                data.distance
            )
        ) {

            this.distance =
                Math.max(
                    this.distance,
                    data.distance ?? 0
                );

        }

        if (
            Number.isFinite(
                data.score
            )
        ) {

            this.score =
                Math.max(
                    this.score,
                    data.score ?? 0
                );

        }

        const xp =
            this.calculateFrameXP(
                data
            );

        if (
            xp > 0
        ) {

            this.addXP(
                xp
            );

        }

        this.updateDifficulty(
            data
        );

        this.updateMultiplier(
            data
        );

        this.updateRank();

        return [];

    }

    // ========================================================
    // FRAME XP
    // ========================================================

    private calculateFrameXP(
        data: LevelUpdateData
    ): number {

        let gained =
            0;

        // ----------------------------------------------------
        // DISTANCE XP
        // ----------------------------------------------------

        const distance =
            this.distance;

        const distanceDelta =
            distance -
            this.lastDistanceXP;

        if (
            distanceDelta >=
            this.distanceXPInterval
        ) {

            const chunks =
                Math.floor(
                    distanceDelta /
                    this.distanceXPInterval
                );

            gained +=
                chunks *
                12;

            this.lastDistanceXP +=
                chunks *
                this.distanceXPInterval;

        }

        // ----------------------------------------------------
        // SCORE XP
        // ----------------------------------------------------

        const scoreDelta =
            this.score -
            this.lastScoreXP;

        if (
            scoreDelta >=
            this.scoreXPInterval
        ) {

            const chunks =
                Math.floor(
                    scoreDelta /
                    this.scoreXPInterval
                );

            gained +=
                chunks *
                20;

            this.lastScoreXP +=
                chunks *
                this.scoreXPInterval;

        }

        // ----------------------------------------------------
        // COMBO
        // ----------------------------------------------------

        if (
            Number.isFinite(
                data.combo
            )
        ) {

            const combo =
                Math.max(
                    0,
                    data.combo ?? 0
                );

            if (
                combo >= 5
            ) {

                gained +=
                    Math.min(
                        15,
                        Math.floor(
                            combo / 5
                        ) * 2
                    );

            }

        }

        // ----------------------------------------------------
        // NEAR MISS
        // ----------------------------------------------------

        if (
            Number.isFinite(
                data.nearMisses
            )
        ) {

            gained +=
                Math.min(
                    10,
                    Math.max(
                        0,
                        data.nearMisses ?? 0
                    )
                );

        }

        // ----------------------------------------------------
        // OVERTAKE
        // ----------------------------------------------------

        if (
            Number.isFinite(
                data.overtakes
            )
        ) {

            gained +=
                Math.min(
                    10,
                    Math.max(
                        0,
                        data.overtakes ?? 0
                    ) * 2
                );

        }

        // ----------------------------------------------------
        // EVENT
        // ----------------------------------------------------

        if (
            data.eventCompleted &&
            this.elapsed -
            this.lastEventXPTime >=
            this.eventXPDelay
        ) {

            gained +=
                Math.max(
                    0,
                    data.eventRewardXP ??
                    100
                );

            this.lastEventXPTime =
                this.elapsed;

        }

        // ----------------------------------------------------
        // ZONE
        // ----------------------------------------------------

        if (
            Number.isFinite(
                data.zone
            )
        ) {

            gained +=
                Math.max(
                    0,
                    Math.floor(
                        data.zone ?? 1
                    ) - 1
                ) *
                0.5;

        }

        return Math.max(
            0,
            Math.floor(
                gained
            )
        );

    }

    // ========================================================
    // ADD XP
    // ========================================================

    addXP(
        amount: number
    ): LevelUpEvent[] {

        if (
            !Number.isFinite(
                amount
            ) ||
            amount <= 0
        ) {

            return [];

        }

        if (
            this.level >=
            this.MAX_LEVEL
        ) {

            return [];

        }

        const events:
            LevelUpEvent[] = [];

        this.totalXP +=
            amount;

        this.currentXP +=
            amount;

        while (
            this.level <
            this.MAX_LEVEL &&
            this.currentXP >=
            this.requiredXP
        ) {

            this.currentXP -=
                this.requiredXP;

            const previousLevel =
                this.level;

            this.level++;

            this.requiredXP =
                this.calculateRequiredXP(
                    this.level
                );

            this.updateRank();

            this.updateDifficulty(
                {}
            );

            this.updateMultiplier(
                {}
            );

            this.justLeveledUp =
                true;

            const event:
                LevelUpEvent = {

                previousLevel,

                newLevel:
                    this.level,

                rank:
                    this.rank,

                xp:
                    this.currentXP,

                requiredXP:
                    this.requiredXP,

                difficulty:
                    this.difficulty,

                rewardXP:
                    amount

            };

            events.push(
                event
            );

            this.emitLevelUp(
                event
            );

        }

        return events;

    }

    // ========================================================
    // REQUIRED XP
    // ========================================================

    private calculateRequiredXP(
        level: number
    ): number {

        if (
            level <= 1
        ) {

            return this.BASE_XP;

        }

        const value =
            this.BASE_XP *
            Math.pow(
                this.XP_GROWTH,
                level - 1
            );

        return Math.floor(
            value
        );

    }

    // ========================================================
    // DIFFICULTY
    // ========================================================

    private updateDifficulty(
        data: LevelUpdateData
    ): void {

        const levelFactor =
            (
                this.level - 1
            ) /
            (
                this.MAX_LEVEL - 1
            );

        const distanceFactor =
            Math.min(
                1,
                this.distance /
                30000
            );

        const threatFactor =
            Math.min(
                1,
                Math.max(
                    0,
                    (
                        data.zoneThreat ??
                        0
                    ) /
                    5
                )
            );

        const zoneFactor =
            Math.min(
                1,
                Math.max(
                    0,
                    (
                        (data.zone ?? 1) -
                        1
                    ) /
                    4
                )
            );

        const raw =
            1 +
            levelFactor * 5 +
            distanceFactor * 2 +
            threatFactor * 1.5 +
            zoneFactor * 1.5;

        this.difficulty =
            this.clamp(
                raw,
                this.MIN_DIFFICULTY,
                this.MAX_DIFFICULTY
            );

    }

    // ========================================================
    // MULTIPLIER
    // ========================================================

    private updateMultiplier(
        data: LevelUpdateData
    ): void {

        let value =
            1;

        value +=
            Math.max(
                0,
                this.level - 1
            ) *
            0.025;

        value +=
            Math.min(
                1.5,
                Math.max(
                    0,
                    (
                        data.combo ??
                        0
                    ) / 20
                )
            );

        value +=
            Math.min(
                0.5,
                this.difficulty *
                0.04
            );

        this.multiplier =
            this.clamp(
                value,
                1,
                4
            );

    }

    // ========================================================
    // RANK
    // ========================================================

    private updateRank(): void {

        if (
            this.level >=
            40
        ) {

            this.rank =
                "OVERDRIVE";

            return;

        }

        if (
            this.level >=
            30
        ) {

            this.rank =
                "APEX";

            return;

        }

        if (
            this.level >=
            22
        ) {

            this.rank =
                "ELITE";

            return;

        }

        if (
            this.level >=
            15
        ) {

            this.rank =
                "HUNTER";

            return;

        }

        if (
            this.level >=
            9
        ) {

            this.rank =
                "RUNNER";

            return;

        }

        if (
            this.level >=
            4
        ) {

            this.rank =
                "DRIVER";

            return;

        }

        this.rank =
            "ROOKIE";

    }

    // ========================================================
    // GET LEVEL
    // ========================================================

    getLevel():
        number {

        return this.level;

    }

    // ========================================================
    // GET RANK
    // ========================================================

    getRank():
        LevelRank {

        return this.rank;

    }

    // ========================================================
    // GET XP
    // ========================================================

    getXP():
        number {

        return this.currentXP;

    }

    // ========================================================
    // GET REQUIRED XP
    // ========================================================

    getRequiredXP():
        number {

        return this.requiredXP;

    }

    // ========================================================
    // GET TOTAL XP
    // ========================================================

    getTotalXP():
        number {

        return this.totalXP;

    }

    // ========================================================
    // GET PROGRESS
    // ========================================================

    getProgress():
        number {

        if (
            this.requiredXP <= 0
        ) {

            return 1;

        }

        return this.clamp(
            this.currentXP /
            this.requiredXP,
            0,
            1
        );

    }

    // ========================================================
    // DIFFICULTY
    // ========================================================

    getDifficulty():
        number {

        return this.difficulty;

    }

    // ========================================================
    // MULTIPLIER
    // ========================================================

    getMultiplier():
        number {

        return this.multiplier;

    }

    // ========================================================
    // STATE
    // ========================================================

    getState():
        LevelState {

        return {

            level:
                this.level,

            rank:
                this.rank,

            currentXP:
                this.currentXP,

            requiredXP:
                this.requiredXP,

            totalXP:
                this.totalXP,

            progress:
                this.getProgress(),

            distance:
                this.distance,

            score:
                this.score,

            difficulty:
                this.difficulty,

            multiplier:
                this.multiplier,

            maxLevel:
                this.MAX_LEVEL,

            justLeveledUp:
                this.justLeveledUp

        };

    }

    // ========================================================
    // LEVEL REACHED
    // ========================================================

    isLevelAtLeast(
        level: number
    ):
        boolean {

        return (
            this.level >=
            level
        );

    }

    // ========================================================
    // FORCE LEVEL
    // ========================================================

    setLevel(
        level: number
    ): void {

        level =
            this.clamp(
                Math.floor(
                    level
                ),
                1,
                this.MAX_LEVEL
            );

        this.level =
            level;

        this.requiredXP =
            this.calculateRequiredXP(
                level
            );

        this.currentXP =
            0;

        this.updateRank();

        this.updateDifficulty(
            {}
        );

        this.updateMultiplier(
            {}
        );

    }

    // ========================================================
    // LISTENER
    // ========================================================

    onLevelUp(
        listener:
            (
                event: LevelUpEvent
            ) => void
    ): () => void {

        this.levelUpListeners.push(
            listener
        );

        return () => {

            const index =
                this.levelUpListeners.indexOf(
                    listener
                );

            if (
                index >= 0
            ) {

                this.levelUpListeners.splice(
                    index,
                    1
                );

            }

        };

    }

    // ========================================================
    // EMIT LEVEL UP
    // ========================================================

    private emitLevelUp(
        event: LevelUpEvent
    ): void {

        for (
            const listener of
            this.levelUpListeners
        ) {

            try {

                listener({
                    ...event
                });

            } catch {

                // Prevent one listener from
                // breaking the level system.
            }

        }

    }

    // ========================================================
    // SNAPSHOT
    // ========================================================

    getSnapshot():
        LevelSnapshot {

        return {

            level:
                this.level,

            rank:
                this.rank,

            currentXP:
                this.currentXP,

            requiredXP:
                this.requiredXP,

            totalXP:
                this.totalXP,

            distance:
                this.distance,

            score:
                this.score,

            difficulty:
                this.difficulty,

            multiplier:
                this.multiplier,

            maxLevel:
                this.MAX_LEVEL

        };

    }

    // ========================================================
    // RESTORE
    // ========================================================

    restore(
        snapshot: LevelSnapshot
    ): void {

        if (
            !snapshot
        ) {

            return;

        }

        this.level =
            this.clamp(
                Math.floor(
                    snapshot.level ?? 1
                ),
                1,
                this.MAX_LEVEL
            );

        this.rank =
            snapshot.rank ??
            "ROOKIE";

        this.currentXP =
            Math.max(
                0,
                snapshot.currentXP ?? 0
            );

        this.totalXP =
            Math.max(
                0,
                snapshot.totalXP ?? 0
            );

        this.distance =
            Math.max(
                0,
                snapshot.distance ?? 0
            );

        this.score =
            Math.max(
                0,
                snapshot.score ?? 0
            );

        this.difficulty =
            this.clamp(
                snapshot.difficulty ?? 1,
                this.MIN_DIFFICULTY,
                this.MAX_DIFFICULTY
            );

        this.multiplier =
            this.clamp(
                snapshot.multiplier ?? 1,
                1,
                4
            );

        this.requiredXP =
            this.calculateRequiredXP(
                this.level
            );

        this.updateRank();

        this.lastDistanceXP =
            Math.floor(
                this.distance /
                this.distanceXPInterval
            ) *
            this.distanceXPInterval;

        this.lastScoreXP =
            Math.floor(
                this.score /
                this.scoreXPInterval
            ) *
            this.scoreXPInterval;

    }

    // ========================================================
    // RESET
    // ========================================================

    reset(): void {

        this.level =
            1;

        this.rank =
            "ROOKIE";

        this.currentXP =
            0;

        this.totalXP =
            0;

        this.requiredXP =
            this.calculateRequiredXP(
                1
            );

        this.distance =
            0;

        this.score =
            0;

        this.difficulty =
            1;

        this.multiplier =
            1;

        this.lastDistanceXP =
            0;

        this.lastScoreXP =
            0;

        this.lastEventXPTime =
            0;

        this.elapsed =
            0;

        this.justLeveledUp =
            false;

    }

    // ========================================================
    // DEBUG
    // ========================================================

    getDebugInfo() {

        return {

            level:
                this.level,

            rank:
                this.rank,

            xp:
                this.currentXP,

            requiredXP:
                this.requiredXP,

            progress:
                this.getProgress(),

            totalXP:
                this.totalXP,

            distance:
                this.distance,

            score:
                this.score,

            difficulty:
                this.difficulty,

            multiplier:
                this.multiplier,

            maxLevel:
                this.MAX_LEVEL

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
