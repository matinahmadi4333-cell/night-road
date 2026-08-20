import Phaser from "phaser";


export default class BackButton {


static create(

scene: Phaser.Scene

){


const bg =
scene.add.rectangle(

45,

45,

80,

45,

0x07131d,

0.85

);


bg.setStrokeStyle(

2,

0x00ffff

);



bg.setDepth(100);



const text =
scene.add.text(

45,

45,

"← BACK",

{

fontFamily:"Arial Black",

fontSize:"16px",

color:"#ffffff"

}

);



text.setOrigin(.5);

text.setDepth(101);





bg.setInteractive();





bg.on(

"pointerover",

()=>{


bg.setFillStyle(

0x003344,

0.9

);



scene.tweens.add({

targets:[bg,text],

scale:1.1,

duration:120

});


}

);






bg.on(

"pointerout",

()=>{


bg.setFillStyle(

0x07131d,

0.85

);



scene.tweens.add({

targets:[bg,text],

scale:1,

duration:120

});


}

);







bg.on(

"pointerdown",

()=>{


scene.scene.start(

"MenuScene"

);


});





return {

bg,

text

};


}



}