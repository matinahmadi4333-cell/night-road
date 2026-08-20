import Phaser from "phaser";

// ============================================================
// CrystalSystem.ts
// NOVA OVERDRIVE
// Stable + Mobile Optimized
// ============================================================

type CrystalType = "normal" | "gold" | "red";

type CrystalObject = {
    sprite: Phaser.GameObjects.Image;
    type: CrystalType;
    value: number;
};

export default class CrystalSystem {
    private scene: Phaser.Scene;

    // ============================================================
    // CRYSTALS
    // ============================================================

    public crystals: CrystalObject[] = [];

    public collected = 0;
    public lastCollected = 0;

    public combo = 0;

    private comboTimer = 0;

    // ============================================================
    // MAGNET
    // ============================================================

    public magnets: Phaser.GameObjects.Image[] = [];

    public magnetTimer = 0;
    public magnetActive = false;

    private readonly magnetDuration = 8000;
    private readonly magnetRange = 240;

    private magnetAura?: Phaser.GameObjects.Graphics;
    private magnetSound?: Phaser.Sound.BaseSound;

    // ============================================================
    // BONUS
    // ============================================================

    private crystalMultiplier = 1;

    private distance = 0;

    private lastMagnetDistance = -99999;

    private nitro = false;

    // ============================================================
    // CONFIG
    // ============================================================

    /**
     * این لاین‌ها باید با لاین‌های واقعی GameScene/TrafficSystem
     * هماهنگ باشند.
     */
    private readonly lanes = [120, 200, 280];

    /**
     * اندازه نهایی Crystal.
     *
     * عمداً کوچک نگه داشته شده تا کنار ماشین طبیعی باشد.
     */
    private readonly crystalSize = 50;

    private readonly magnetSize = 60;

    /**
     * جلوگیری از ایجاد تعداد بیش از حد Object
     */
    private readonly maxCrystals = 10;

    private readonly maxMagnets = 2;

    /**
     * سرعت Crystal نسبت به سرعت بازی
     */
    private readonly crystalSpeedMultiplier = 1;

    // ============================================================
    // CONSTRUCTOR
    // ============================================================

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    // ============================================================
    // PUBLIC API
    // ============================================================

    public setVehicleBonus(value: number): void {
        this.crystalMultiplier = Math.max(1, value);
    }

    public setNitro(value: boolean): void {
        this.nitro = value;
    }

    public getCrystals(): number {
        return this.collected;
    }

    public getCombo(): number {
        return this.combo;
    }

    public getLastCollected(): number {
        return this.lastCollected;
    }

    public isMagnetActive(): boolean {
        return this.magnetActive;
    }

    // ============================================================
    // CRYSTAL TYPE
    // ============================================================

    private chooseCrystalType(): CrystalType {
        /*
         * سه نوع Crystal داریم:
         *
         * normal = 1
         * gold   = 5
         * red    = 15
         *
         * فعلاً شانس‌ها را کنترل‌شده نگه می‌داریم.
         */

        const roll = Phaser.Math.Between(1, 100);

        if (roll <= 10) {
            return "red";
        }

        if (roll <= 20) {
            return "gold";
        }

        return "normal";
    }

    // ============================================================
    // TEXTURE
    // ============================================================

    private getTexture(type: CrystalType): string {
        switch (type) {
            case "gold":
                return "gold_crystal";

            case "red":
                return "red_crystal";

            default:
                return "crystal";
        }
    }

    // ============================================================
    // VALUE
    // ============================================================

    private getValue(type: CrystalType): number {
        switch (type) {
            case "gold":
                return 5;

            case "red":
                return 15;

            default:
                return 1;
        }
    }

    // ============================================================
    // CREATE CRYSTAL
    // ============================================================

    public createCrystal(): void {

        // --------------------------------------------------------
        // Safety limit
        // --------------------------------------------------------

        if (
            this.crystals.length >=
            this.maxCrystals
        ) {
            return;
        }

        const type =
            this.chooseCrystalType();

        const texture =
            this.getTexture(type);

        // --------------------------------------------------------
        // Texture validation
        // --------------------------------------------------------

        if (
            !this.scene.textures.exists(
                texture
            )
        ) {
            return;
        }

        // --------------------------------------------------------
        // Lane
        // --------------------------------------------------------

        const x =
            Phaser.Utils.Array.GetRandom(
                this.lanes
            );

        // --------------------------------------------------------
        // Create
        // --------------------------------------------------------

        const crystal =
            this.scene.add.image(
                x,
                -40,
                texture
            );

        // --------------------------------------------------------
        // IMPORTANT:
        // Force the final visual size.
        // --------------------------------------------------------

        crystal.setDisplaySize(
            this.crystalSize,
            this.crystalSize
        );

        crystal.setDepth(25);

        crystal.setActive(true);

        crystal.setVisible(true);

        // --------------------------------------------------------
        // Lightweight rotation
        // --------------------------------------------------------

        this.scene.tweens.add({
            targets: crystal,

            angle: 360,

            duration: 2200,

            repeat: -1,

            ease: "Linear"
        });

        // --------------------------------------------------------
        // Store
        // --------------------------------------------------------

        this.crystals.push({
            sprite: crystal,
            type,
            value: this.getValue(type)
        });
    }

    // ============================================================
    // MAGNET CHANCE
    // ============================================================

    private getMagnetChance(
        speed: number
    ): number {

        let chance = 3;

        if (speed > 8) {
            chance += 5;
        }

        if (speed > 12) {
            chance += 5;
        }

        if (speed > 16) {
            chance += 7;
        }

        if (this.nitro) {
            chance += 5;
        }

        return Math.min(
            chance,
            25
        );
    }

    // ============================================================
    // CREATE MAGNET
    // ============================================================

    public createMagnet(
        speed: number
    ): void {

        if (
            this.magnets.length >=
            this.maxMagnets
        ) {
            return;
        }

        if (
            !this.scene.textures.exists(
                "magnet"
            )
        ) {
            return;
        }

        // --------------------------------------------------------
        // Distance protection
        // --------------------------------------------------------

        if (
            this.distance -
            this.lastMagnetDistance <
            1800
        ) {
            return;
        }

        const chance =
            this.getMagnetChance(
                speed
            );

        if (
            Phaser.Math.Between(
                1,
                100
            ) > chance
        ) {
            return;
        }

        const x =
            Phaser.Utils.Array.GetRandom(
                this.lanes
            );

        const magnet =
            this.scene.add.image(
                x,
                -50,
                "magnet"
            );

        magnet.setDisplaySize(
            this.magnetSize,
            this.magnetSize
        );

        magnet.setDepth(30);

        magnet.setActive(true);

        magnet.setVisible(true);

        this.magnets.push(
            magnet
        );

        this.lastMagnetDistance =
            this.distance;

        // --------------------------------------------------------
        // Rotation
        // --------------------------------------------------------

        this.scene.tweens.add({
            targets: magnet,

            angle: 360,

            duration: 1400,

            repeat: -1,

            ease: "Linear"
        });
    }

    // ============================================================
    // ACTIVATE MAGNET
    // ============================================================

    public activateMagnet(): void {

        this.magnetActive = true;

        this.magnetTimer =
            this.magnetDuration;

        // --------------------------------------------------------
        // Aura
        // --------------------------------------------------------

        if (!this.magnetAura) {

            this.magnetAura =
                this.scene.add.graphics();

            this.magnetAura.setDepth(
                90
            );

            this.magnetAura.setAlpha(
                0.7
            );
        }

        // --------------------------------------------------------
        // Sound
        // --------------------------------------------------------

        if (
            !this.magnetSound &&
            this.scene.cache.audio.exists(
                "magnet"
            )
        ) {

            this.magnetSound =
                this.scene.sound.add(
                    "magnet",
                    {
                        loop: true,
                        volume: 0.35
                    }
                );

            this.magnetSound.play();
        }
    }

    // ============================================================
    // UPDATE MAGNET
    // ============================================================

    private updateMagnet(
        player: Phaser.GameObjects.Sprite
    ): void {

        // --------------------------------------------------------
        // Aura
        // --------------------------------------------------------

        if (this.magnetAura) {

            this.magnetAura.clear();

            this.magnetAura.lineStyle(
                3,
                0x00ffff,
                0.7
            );

            this.magnetAura.strokeCircle(
                player.x,
                player.y,
                70
            );
        }

        if (!this.magnetActive) {
            return;
        }

        // --------------------------------------------------------
        // Pull crystals
        // --------------------------------------------------------

        for (
            const crystal
            of this.crystals
        ) {

            const sprite =
                crystal.sprite;

            if (
                !sprite.active ||
                !sprite.visible
            ) {
                continue;
            }

            const distance =
                Phaser.Math.Distance.Between(
                    player.x,
                    player.y,
                    sprite.x,
                    sprite.y
                );

            if (
                distance <
                this.magnetRange
            ) {

                sprite.x +=
                    (
                        player.x -
                        sprite.x
                    ) * 0.10;

                sprite.y +=
                    (
                        player.y -
                        sprite.y
                    ) * 0.10;
            }
        }
    }

    // ============================================================
    // UPDATE
    // ============================================================

    public update(
        speed: number,
        player: Phaser.GameObjects.Sprite,
        nitro: boolean = false,
        distance: number = 0
    ): void {

        // --------------------------------------------------------
        // Safety
        // --------------------------------------------------------

        if (
            !this.scene ||
            !player ||
            !player.active
        ) {
            return;
        }

        this.nitro = nitro;

        this.distance = distance;

        const delta =
            this.scene.game.loop.delta;

        // ========================================================
        // MAGNET TIMER
        // ========================================================

        if (this.magnetActive) {

            this.magnetTimer -= delta;

            if (
                this.magnetTimer <= 0
            ) {

                this.disableMagnet();
            }
        }

        // ========================================================
        // MAGNET
        // ========================================================

        this.updateMagnet(
            player
        );

        // ========================================================
        // PLAYER BOUNDS
        // ========================================================

        const playerLeft =
            player.x - 25;

        const playerRight =
            player.x + 25;

        const playerTop =
            player.y - 45;

        const playerBottom =
            player.y + 45;

        // ========================================================
        // CRYSTALS
        // ========================================================

        const crystalsToRemove:
            CrystalObject[] = [];

        for (
            const crystal
            of this.crystals
        ) {

            const sprite =
                crystal.sprite;

            // ----------------------------------------------------
            // Invalid object
            // ----------------------------------------------------

            if (
                !sprite ||
                !sprite.active ||
                !sprite.scene
            ) {

                crystalsToRemove.push(
                    crystal
                );

                continue;
            }

            // ----------------------------------------------------
            // Move
            // ----------------------------------------------------

            sprite.y +=
                speed *
                this.crystalSpeedMultiplier;

            // ----------------------------------------------------
            // Fast despawn
            // ----------------------------------------------------

            if (
                sprite.y > 900
            ) {

                crystalsToRemove.push(
                    crystal
                );

                continue;
            }

            // ----------------------------------------------------
            // Crystal bounds
            // ----------------------------------------------------

            const crystalLeft =
                sprite.x - 12;

            const crystalRight =
                sprite.x + 12;

            const crystalTop =
                sprite.y - 12;

            const crystalBottom =
                sprite.y + 12;

            // ----------------------------------------------------
            // Collision
            // ----------------------------------------------------

            const hit =
                crystalRight >
                    playerLeft &&
                crystalLeft <
                    playerRight &&
                crystalBottom >
                    playerTop &&
                crystalTop <
                    playerBottom;

            if (!hit) {
                continue;
            }

            // ====================================================
            // COLLECT
            // ====================================================

            const amount =
                Math.max(
                    1,
                    Math.floor(
                        crystal.value *
                        this.crystalMultiplier
                    )
                );

            this.collected +=
                amount;

            this.lastCollected =
                amount;

            this.combo++;

            this.comboTimer = 0;

            // ----------------------------------------------------
            // Remove immediately
            // ----------------------------------------------------

            sprite.setActive(
                false
            );

            sprite.setVisible(
                false
            );

            // ----------------------------------------------------
            // Visual effect
            // ----------------------------------------------------

            this.collectEffect(
                sprite,
                amount
            );

            crystalsToRemove.push(
                crystal
            );
        }

        // ========================================================
        // REMOVE CRYSTALS
        // ========================================================

        if (
            crystalsToRemove.length > 0
        ) {

            const removeSet =
                new Set(
                    crystalsToRemove
                );

            for (
                const crystal
                of crystalsToRemove
            ) {

                const sprite =
                    crystal.sprite;

                if (
                    sprite &&
                    sprite.scene
                ) {

                    // Stop any tweens
                    this.scene.tweens.killTweensOf(
                        sprite
                    );

                    sprite.destroy();
                }
            }

            this.crystals =
                this.crystals.filter(
                    crystal =>
                        !removeSet.has(
                            crystal
                        ) &&
                        crystal.sprite &&
                        crystal.sprite.active &&
                        crystal.sprite.scene
                );
        }

        // ========================================================
        // MAGNET OBJECTS
        // ========================================================

        const magnetsToRemove:
            Phaser.GameObjects.Image[] = [];

        for (
            const magnet
            of this.magnets
        ) {

            if (
                !magnet ||
                !magnet.active ||
                !magnet.scene
            ) {

                magnetsToRemove.push(
                    magnet
                );

                continue;
            }

            magnet.y += speed;

            // ----------------------------------------------------
            // Despawn
            // ----------------------------------------------------

            if (
                magnet.y > 900
            ) {

                magnetsToRemove.push(
                    magnet
                );

                continue;
            }

            // ----------------------------------------------------
            // Player distance
            // ----------------------------------------------------

            const distanceToPlayer =
                Phaser.Math.Distance.Between(
                    player.x,
                    player.y,
                    magnet.x,
                    magnet.y
                );

            if (
                distanceToPlayer < 55
            ) {

                this.activateMagnet();

                magnetsToRemove.push(
                    magnet
                );
            }
        }

        // ========================================================
        // REMOVE MAGNETS
        // ========================================================

        if (
            magnetsToRemove.length > 0
        ) {

            for (
                const magnet
                of magnetsToRemove
            ) {

                if (
                    magnet &&
                    magnet.scene
                ) {

                    this.scene.tweens.killTweensOf(
                        magnet
                    );

                    magnet.destroy();
                }
            }

            const removeSet =
                new Set(
                    magnetsToRemove
                );

            this.magnets =
                this.magnets.filter(
                    magnet =>
                        !removeSet.has(
                            magnet
                        ) &&
                        magnet.active &&
                        magnet.scene
                );
        }

        // ========================================================
        // COMBO TIMER
        // ========================================================

        this.comboTimer += delta;

        if (
            this.comboTimer >
            3000
        ) {

            this.combo = 0;

            this.comboTimer = 0;
        }
    }

    // ============================================================
    // COLLECT EFFECT
    // ============================================================

    private collectEffect(
        sprite: Phaser.GameObjects.Image,
        amount: number
    ): void {

        if (
            !sprite ||
            !sprite.scene
        ) {
            return;
        }

        const x = sprite.x;
        const y = sprite.y;

        // --------------------------------------------------------
        // Crystal is already deactivated.
        // DO NOT tween the destroyed Crystal.
        // --------------------------------------------------------

        this.scene.tweens.killTweensOf(
            sprite
        );

        // --------------------------------------------------------
        // Floating value
        // --------------------------------------------------------

        const text =
            this.scene.add.text(
                x,
                y,
                `+${amount}`,
                {
                    fontSize: "18px",
                    fontFamily:
                        "Arial Black",
                    color: "#00ffff",
                    stroke: "#000000",
                    strokeThickness: 3
                }
            );

        text.setOrigin(0.5);

        text.setDepth(200);

        // --------------------------------------------------------
        // Small lightweight animation
        // --------------------------------------------------------

        this.scene.tweens.add({

            targets: text,

            y: y - 32,

            alpha: 0,

            duration: 400,

            ease: "Cubic.easeOut",

            onComplete: () => {

                if (
                    text &&
                    text.scene
                ) {
                    text.destroy();
                }
            }
        });
    }

    // ============================================================
    // DISABLE MAGNET
    // ============================================================

    private disableMagnet(): void {

        this.magnetActive = false;

        this.magnetTimer = 0;

        // --------------------------------------------------------
        // Aura
        // --------------------------------------------------------

        if (this.magnetAura) {

            this.magnetAura.destroy();

            this.magnetAura =
                undefined;
        }

        // --------------------------------------------------------
        // Sound
        // --------------------------------------------------------

        if (this.magnetSound) {

            this.magnetSound.stop();

            this.magnetSound.destroy();

            this.magnetSound =
                undefined;
        }
    }

    // ============================================================
    // RESET
    // ============================================================

    public reset(): void {

        this.destroyAll();

        this.collected = 0;

        this.lastCollected = 0;

        this.combo = 0;

        this.comboTimer = 0;

        this.distance = 0;

        this.lastMagnetDistance =
            -99999;

        this.crystalMultiplier = 1;

        this.nitro = false;
    }

    // ============================================================
    // DESTROY ALL
    // ============================================================

    public destroyAll(): void {

        // ========================================================
        // CRYSTALS
        // ========================================================

        for (
            const crystal
            of this.crystals
        ) {

            if (
                crystal &&
                crystal.sprite
            ) {

                this.scene.tweens.killTweensOf(
                    crystal.sprite
                );

                if (
                    crystal.sprite.scene
                ) {

                    crystal.sprite.destroy();
                }
            }
        }

        // ========================================================
        // MAGNETS
        // ========================================================

        for (
            const magnet
            of this.magnets
        ) {

            if (magnet) {

                this.scene.tweens.killTweensOf(
                    magnet
                );

                if (
                    magnet.scene
                ) {

                    magnet.destroy();
                }
            }
        }

        // ========================================================
        // AURA
        // ========================================================

        if (this.magnetAura) {

            this.magnetAura.destroy();

            this.magnetAura =
                undefined;
        }

        // ========================================================
        // SOUND
        // ========================================================

        if (this.magnetSound) {

            this.magnetSound.stop();

            this.magnetSound.destroy();

            this.magnetSound =
                undefined;
        }

        // ========================================================
        // RESET ARRAYS
        // ========================================================

        this.crystals = [];

        this.magnets = [];

        this.combo = 0;

        this.comboTimer = 0;

        this.collected = 0;

        this.lastCollected = 0;

        this.magnetTimer = 0;

        this.magnetActive = false;
    }

    // Phaser-style alias
    public destroy(): void {
        this.destroyAll();
    }
}