import Phaser from "phaser";

import BootScene from "./scenes/BootScene";
import MenuScene from "./scenes/MenuScene";
import GarageScene from "./scenes/GarageScene";
import GameScene from "./scenes/GameScene";


const config: Phaser.Types.Core.GameConfig = {

    type: Phaser.AUTO,

    width: 400,
    height: 800,

    parent: "game",

    backgroundColor: "#05040A",

    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },

    render: {
        antialias: true,
        pixelArt: false
    },

    scene: [
        BootScene,
        MenuScene,
        GarageScene,
        GameScene
    ]
};


new Phaser.Game(config);