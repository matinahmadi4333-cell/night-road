import Phaser from "phaser";

export default class CityGenerator {

    scene: Phaser.Scene;

    buildings: Phaser.GameObjects.Rectangle[] = [];

    constructor(scene: Phaser.Scene){

        this.scene = scene;

        this.createCity();

    }


    createCity(){

        const positions = [
            -400,
            -150,
            100,
            350,
            600,
            850,
            1100
        ];


        for(const y of positions){


            const left = this.scene.add.rectangle(
                45,
                y,
                80,
                140,
                0x15151f
            );


            const right = this.scene.add.rectangle(
                355,
                y,
                80,
                140,
                0x15151f
            );


            left.setDepth(-1);
            right.setDepth(-1);


            this.buildings.push(left);
            this.buildings.push(right);

        }

    }


    update(speed:number){

        // فعلا ساختمان ها ثابت هستند
        // بعداً می‌توانیم حرکت شهر و اسکرول را اضافه کنیم

    }


    destroy(){

        for(const building of this.buildings){

            building.destroy();

        }


        this.buildings = [];

    }

}