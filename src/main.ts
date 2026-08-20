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

    // رزولوشن پایه بازی
    width: 400,
    height: 800,

    backgroundColor: "#05040A",

    parent: "app",

    pixelArt: false,


    scale: {

        // پر کردن صفحه موبایل با حفظ نسبت تصویر
        mode: Phaser.Scale.FIT,

        autoCenter: Phaser.Scale.CENTER_BOTH,

        width: 400,

        height: 800
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


// Android fullscreen
async function startGame() {

    try {

        await StatusBar.hide();

        await StatusBar.setStyle({

            style: Style.Dark

        });


    } catch (error) {

        console.log("StatusBar unavailable");

    }


    new Phaser.Game(config);

}


startGame();