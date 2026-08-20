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

    // Base game size
    width: 400,
    height: 800,

    backgroundColor: "#05040A",

    parent: "app",

    pixelArt: false,

    scale: {
        // The game is authored in a 400x800 portrait composition.
        // ENVELOP fills the entire parent while preserving aspect ratio.
        // Unlike FIT, it never creates letterbox bars.
        mode: Phaser.Scale.ENVELOP,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        expandParent: false
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