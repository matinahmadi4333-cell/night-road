import Phaser from "phaser";

import { StatusBar, Style } from "@capacitor/status-bar";

import BootScene from "./scenes/BootScene";
import MenuScene from "./scenes/MenuScene";
import GarageScene from "./scenes/GarageScene";
import GameScene from "./scenes/GameScene";
import PauseScene from "./scenes/PauseScene";
import SettingsScene from "./scenes/SettingsScene";


const config: Phaser.Types.Core.GameConfig = {

    type: Phaser.WEBGL,

    // Base game size
    width: 400,
    height: 800,

    backgroundColor: "#05040A",

    parent: "app",

    pixelArt: false,

    // Render performance tuning.
    antialias: true,

    roundPixels: true,

    render: {
        powerPreference: "high-performance"
    },

    // Don't let the canvas render at more physical pixels than it
    // needs to — this is usually the single biggest mobile FPS win.
    // (Removed the `resolution` key: your installed Phaser version's
    // type defs don't expose it on GameConfig — see note below.)

    fps: {
        target: 60,
        min: 30,
        smoothStep: true
    },

    scale: {
        mode: Phaser.Scale.ENVELOP,
        autoCenter: Phaser.Scale.CENTER_BOTH
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