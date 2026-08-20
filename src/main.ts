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

    width: window.innerWidth,
    height: window.innerHeight,

    backgroundColor: "#05040A",

    parent: "app",

    pixelArt: false,

    scale: {
        mode: Phaser.Scale.RESIZE,
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


// Android fullscreen
StatusBar.hide();

StatusBar.setStyle({
    style: Style.Dark
});


new Phaser.Game(config);