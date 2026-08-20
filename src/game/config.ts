import Phaser from "phaser";

import BootScene from "../scenes/BootScene";
import GarageScene from "../scenes/GarageScene";
import GameScene from "../scenes/GameScene";


const config: Phaser.Types.Core.GameConfig = {

    type: Phaser.AUTO,

    width: 400,
    height: 800,

    backgroundColor:"#08060D",

    scene:[
        BootScene,
        GarageScene,
        GameScene
    ],


    scale:{
        mode: Phaser.Scale.ENVELOP,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }

};


export default config;