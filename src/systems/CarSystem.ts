export type CarData = {
    id: string;
    name: string;

    speed: number;
    nitro: number;
    handling: number;

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

            speed: 60,
            nitro: 50,
            handling: 70,

            price: 0,

            texture: "player",

            width: 42,
            height: 72,

            maxUpgrade: 5,
            upgradeStep: 4
        },

        // =========================================
        // TAXI
        // =========================================

        {
            id: "taxi",
            name: "Night Taxi",

            speed: 75,
            nitro: 60,
            handling: 80,

            price: 500,

            texture: "taxi",

            width: 44,
            height: 75,

            maxUpgrade: 5,
            upgradeStep: 5
        },

        // =========================================
        // SPORT
        // =========================================

        {
            id: "sport",
            name: "Shadow Sport",

            speed: 110,
            nitro: 90,
            handling: 85,

            price: 1500,

            texture: "sport",

            width: 46,
            height: 78,

            maxUpgrade: 6,
            upgradeStep: 6
        },

        // =========================================
        // SUPER
        // =========================================

        {
            id: "super",
            name: "Night Beast",

            speed: 150,
            nitro: 120,
            handling: 95,

            price: 4000,

            texture: "super",

            width: 48,
            height: 82,

            maxUpgrade: 7,
            upgradeStep: 8
        },

        // =========================================
        // TRUCK
        // =========================================

        {
            id: "truck",
            name: "Heavy Truck",

            speed: 55,
            nitro: 40,
            handling: 45,

            price: 2500,

            texture: "truck",

            width: 58,
            height: 105,

            maxUpgrade: 5,
            upgradeStep: 5
        },

        // =========================================
        // BUS
        // =========================================

        {
            id: "bus",
            name: "Night Bus",

            speed: 45,
            nitro: 30,
            handling: 35,

            price: 2000,

            texture: "bus",

            width: 62,
            height: 115,

            maxUpgrade: 5,
            upgradeStep: 4
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
                car.speed + bonus,

            nitro:
                car.nitro + bonus,

            handling:
                car.handling + bonus,

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