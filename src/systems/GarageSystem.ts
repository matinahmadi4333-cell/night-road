import SaveSystem from "./SaveSystem";
import CarSystem from "./CarSystem";

export default class GarageSystem {

    carSystem: CarSystem;

    constructor() {
        this.carSystem = new CarSystem();
        SaveSystem.load();
    }

    buyCar(id: string) {
        const car = this.carSystem.getCar(id);

        if (!car) return false;

        if (SaveSystem.getOwnedCars().includes(id)) {
            return false;
        }

        if (SaveSystem.spendCrystal(car.price)) {
            SaveSystem.unlockCar(id);
            return true;
        }

        return false;
    }

    selectCar(id: string) {
        SaveSystem.selectCar(id);
    }

    getCars() {
        return this.carSystem.getCars();
    }

    isOwned(id: string) {
        return SaveSystem.getOwnedCars().includes(id);
    }

    getSelected() {
        return SaveSystem.getSelectedCar();
    }

    getBalance() {
        return SaveSystem.getCrystals();
    }
}