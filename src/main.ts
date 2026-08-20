import Phaser from "phaser";


import BootScene from "./scenes/BootScene";
import MenuScene from "./scenes/MenuScene";
import GarageScene from "./scenes/GarageScene";
import GameScene from "./scenes/GameScene";
import PauseScene from "./scenes/PauseScene";
import SettingsScene from "./scenes/SettingsScene";


const config: Phaser.Types.Core.GameConfig = {



type: Phaser.AUTO,



width: 400,


height: 800,



backgroundColor:"#05040A",



parent:"app",



pixelArt:false,





scale:{


mode: Phaser.Scale.FIT,


autoCenter: Phaser.Scale.CENTER_BOTH


},






physics:{


default:"arcade",


arcade:{


debug:false


}


},






scene:[


BootScene,


MenuScene,


GarageScene,


GameScene,

PauseScene,

SettingsScene
]





};






new Phaser.Game(config);