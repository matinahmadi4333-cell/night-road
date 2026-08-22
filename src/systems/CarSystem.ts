export type CarData = {
    id: string;
    name: string;

    speed: number;
    nitro: number;
    handling: number;

    // Hard normal (non-nitro) speed ceiling for this car (displaySpeed can
    // never exceed this while nitro is NOT active). Fixed per car — not
    // affected by upgrades.
    maxSpeed: number;

    // Hard nitro speed ceiling for this car (displaySpeed can never exceed
    // this while nitro is active). Fixed per car — not affected by upgrades.
    nitroMaxSpeed: number;

    price: number;

    texture: string;

    width: number;
    height: number;

    maxUpgrade: number;
    upgradeStep: number;
};

export type CalculatedStats = {
    speed: number;
    nitro: number;
    handling: number;
    maxSpeed: number;
    nitroMaxSpeed: number;
    width: number;
    height: number;
    crystalMultiplier: number;
};

export default class CarSystem {

    private cars: CarData[] = [

        // =========================================
        // STARTER
        // =========================================

        {
            id: "starter",
            name: "Street",

            speed: 110,
            nitro: 50,
            handling: 70,

            maxSpeed: 600,
            nitroMaxSpeed: 750,

            price: 0,

            texture: "player",

            width: 42,
            height: 72,

            maxUpgrade: 5,
            upgradeStep: 55 / 4,
        },

        // =========================================
        // TAXI
        // =========================================

        {
            id: "taxi",
            name: "Night Taxi",

            speed: 125,
            nitro: 60,
            handling: 80,

            maxSpeed: 650,
            nitroMaxSpeed: 800,

            price: 2000,

            texture: "taxi",

            width: 44,
            height: 75,

            maxUpgrade: 5,
            upgradeStep: 50 / 4,
        },

        // =========================================
        // SPORT
        // =========================================

        {
            id: "sport",
            name: "Shadow Sport",

            speed: 150,
            nitro: 90,
            handling: 85,

            maxSpeed: 700,
            nitroMaxSpeed: 850,

            price: 5000,

            texture: "sport",

            width: 46,
            height: 78,

            maxUpgrade: 6,
            upgradeStep: 12,
        },

        // =========================================
        // SUPER
        // =========================================

        {
            id: "super",
            name: "Night Beast",

            speed: 170,
            nitro: 120,
            handling: 95,

            // Most expensive car — highest speed ceilings in the game.
            maxSpeed: 750,
            nitroMaxSpeed: 950,

            price: 10000,

            texture: "super",

            width: 48,
            height: 82,

            maxUpgrade: 7,
            upgradeStep: 70 / 6,
        },

        // =========================================
        // TRUCK
        // =========================================

        {
            id: "truck",
            name: "Heavy Truck",

            speed: 105,
            nitro: 40,
            handling: 45,

            maxSpeed: 550,
            nitroMaxSpeed: 680,

            price: 4000,

            texture: "truck",

            width: 58,
            height: 105,

            maxUpgrade: 5,
            upgradeStep: 55 / 4,
        },

        // =========================================
        // BUS
        // =========================================

        {
            id: "bus",
            name: "Night Bus",

            speed: 95,
            nitro: 30,
            handling: 35,

            maxSpeed: 500,
            nitroMaxSpeed: 650,

            price: 7000,

            texture: "bus",

            width: 62,
            height: 115,

            maxUpgrade: 5,
            upgradeStep: 45 / 4,
        }
    ];


    // =========================================
    // GET ALL CARS
    // =========================================

    getCars(): CarData[] {
        return this.cars;
    }


    // =========================================
    // GET CAR
    // =========================================

    getCar(id: string): CarData | undefined {
        return this.cars.find(
            car => car.id === id
        );
    }


    // =========================================
    // DEFAULT CAR
    // =========================================

    getDefaultCar(): CarData {
        return this.cars[0];
    }


    // =========================================
    // CALCULATE UPGRADED STATS
    // =========================================

    getUpgradedStats(
        car: CarData,
        level: number
    ): CalculatedStats {

        const safeLevel =
            Number.isFinite(level) && level >= 1
                ? Math.floor(level)
                : 1;


        const clampedLevel =
            PhaserMathClamp(
                safeLevel,
                1,
                car.maxUpgrade
            );


        const bonus =
            (clampedLevel - 1) *
            car.upgradeStep;


        return {

            speed:
                Math.round(car.speed + bonus),

            nitro:
                Math.round(car.nitro + bonus),

            handling:
                Math.round(car.handling + bonus),

            // Fixed per car — upgrades don't raise the normal speed ceiling.
            maxSpeed:
                car.maxSpeed,

            // Fixed per car — upgrades don't raise the nitro speed ceiling.
            nitroMaxSpeed:
                car.nitroMaxSpeed,

            width:
                car.width,

            height:
                car.height,

            crystalMultiplier:
                1 + ((clampedLevel - 1) * 0.05)
        };
    }


    // =========================================
    // UPGRADE COST
    // =========================================

    getUpgradeCost(
        car: CarData,
        level: number
    ): number {

        if (level >= car.maxUpgrade) {
            return Infinity;
        }

        return level * 250;
    }


    // =========================================
    // CAN UPGRADE
    // =========================================

    canUpgrade(
        car: CarData,
        level: number
    ): boolean {

        return level < car.maxUpgrade;
    }


    // =========================================
    // FIND CAR BY TEXTURE
    // =========================================

    getCarByTexture(
        texture: string
    ): CarData | undefined {

        return this.cars.find(
            car => car.texture === texture
        );
    }
}


// =========================================
// SMALL SAFE CLAMP
// =========================================

function PhaserMathClamp(
    value: number,
    min: number,
    max: number
): number {

    return Math.max(
        min,
        Math.min(max, value)
    );
}