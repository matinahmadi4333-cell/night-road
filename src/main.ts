import Phaser from "phaser";

import { StatusBar, Style } from "@capacitor/status-bar";

import BootScene from "./scenes/BootScene";
import MenuScene from "./scenes/MenuScene";
import GarageScene from "./scenes/GarageScene";
import GameScene from "./scenes/GameScene";
import PauseScene from "./scenes/PauseScene";
import SettingsScene from "./scenes/SettingsScene";

const config: Phaser.Types.Core.GameConfig = {

    type: Phaser.AUTO,

    // ثابت نگه می‌داریم چون تمام بازی روی 400x800 ساخته شده
    width: 400,
    height: 800,

    backgroundColor: "#05040A",

    parent: "app",

    pixelArt: false,

    scale: {

        // مهم: حفظ نسبت تصویر و پر کردن کامل موبایل
        mode: Phaser.Scale.ENVELOP,

        autoCenter: Phaser.Scale.CENTER_BOTH,

        expandParent: true
    },

    physics: {

        default: "arcade",

        arcade: {

            debug: false
        }
    },

    scene: [
        BootScene,
        MenuScene,
        GarageScene,
        GameScene,
        PauseScene,
        SettingsScene
    ]
};


// اجرای بعد از آماده شدن Capacitor
async function startGame() {

    try {

        await StatusBar.hide();

        await StatusBar.setStyle({
            style: Style.Dark
        });

    } catch (error) {

        console.log("StatusBar not available:", error);

    }


    new Phaser.Game(config);

}


startGame();