import Phaser from "phaser";


export default class UISystem {


scene: Phaser.Scene;


score!: Phaser.GameObjects.Text;
distance!: Phaser.GameObjects.Text;
speed!: Phaser.GameObjects.Text;
crystal!: Phaser.GameObjects.Text;
health!: Phaser.GameObjects.Text;
nitro!: Phaser.GameObjects.Text;
level!: Phaser.GameObjects.Text;
combo!: Phaser.GameObjects.Text;
zone!: Phaser.GameObjects.Text;



constructor(scene: Phaser.Scene){

    this.scene = scene;

    this.create();

}





create(){



    this.score =
    this.createText(
        20,
        25,
        "🏆 SCORE 0",
        "#ffffff"
    );



    this.distance =
    this.createText(
        20,
        65,
        "📍 0 m",
        "#cccccc"
    );



    this.speed =
    this.createText(
        20,
        105,
        "⚡ 80 KM/H",
        "#00ff99"
    );



    this.crystal =
    this.createText(
        20,
        145,
        "💎 0",
        "#00ffff"
    );



    this.health =
    this.createText(
        20,
        185,
        "❤️❤️❤️",
        "#ff5555"
    );



    this.nitro =
    this.createText(
        20,
        225,
        "🔥 READY",
        "#ffaa00"
    );



    this.level =
    this.createText(
        20,
        265,
        "⭐ LEVEL 1",
        "#ffffff"
    );



    this.combo =
    this.createText(
        20,
        305,
        "🔥 COMBO x1",
        "#ff00ff"
    );



    this.zone =
    this.createText(
        20,
        345,
        "🌆 ZONE 1",
        "#66ffff"
    );

}





createText(

x:number,

y:number,

text:string,

color:string

){



const bg =
this.scene.add.rectangle(

x+110,

y+15,

220,

35,

0x000000,

0.45

);



bg.setStrokeStyle(

1,

0x00ffff,

0.3

);



bg.setDepth(900);



const t =
this.scene.add.text(

x,

y,

text,

{

fontSize:"20px",

fontFamily:"Arial",

color:color,

fontStyle:"bold"

}

);



t.setDepth(901);



return t;



}







update(data:any){



if(data.score!==undefined)

this.score.setText(

"🏆 SCORE "+data.score

);



if(data.distance!==undefined)

this.distance.setText(

"📍 "+Math.floor(data.distance)+" m"

);



if(data.speed!==undefined)

this.speed.setText(

"⚡ "+Math.floor(data.speed)+" KM/H"

);



if(data.crystal!==undefined)

this.crystal.setText(

"💎 "+data.crystal

);



if(data.health!==undefined)

this.health.setText(

"❤️".repeat(data.health)

);



if(data.nitro!==undefined)

this.nitro.setText(

data.nitro ?

"🔥 ACTIVE"

:

"🔥 READY"

);



if(data.level!==undefined)

this.level.setText(

"⭐ LEVEL "+data.level

);



if(data.combo!==undefined)

this.combo.setText(

"🔥 COMBO x"+data.combo

);



if(data.zone!==undefined)

this.zone.setText(

"🌆 ZONE "+data.zone

);



}






}