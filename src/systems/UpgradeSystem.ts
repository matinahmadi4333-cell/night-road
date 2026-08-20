import SaveSystem from "./SaveSystem";


export default class UpgradeSystem{


speedLevel:number;
boostLevel:number;
controlLevel:number;



constructor(){


const data = SaveSystem.load();



this.speedLevel =
data.speedLevel ?? 1;


this.boostLevel =
data.boostLevel ?? 1;


this.controlLevel =
data.controlLevel ?? 1;



}



private getCost(level:number){

return level * 100;

}





upgradeSpeed(){


const cost=this.getCost(this.speedLevel);


if(this.speedLevel>=10)
return false;



if(!SaveSystem.spendCrystal(cost))
return false;



this.speedLevel++;


SaveSystem.saveUpgrade(

this.speedLevel,

this.boostLevel,

this.controlLevel

);



return true;



}







upgradeBoost(){


const cost=this.getCost(this.boostLevel);


if(this.boostLevel>=10)
return false;



if(!SaveSystem.spendCrystal(cost))
return false;



this.boostLevel++;


SaveSystem.saveUpgrade(

this.speedLevel,

this.boostLevel,

this.controlLevel

);



return true;



}









upgradeControl(){


const cost=this.getCost(this.controlLevel);


if(this.controlLevel>=10)
return false;



if(!SaveSystem.spendCrystal(cost))
return false;



this.controlLevel++;


SaveSystem.saveUpgrade(

this.speedLevel,

this.boostLevel,

this.controlLevel

);



return true;



}









getStats(car:any){


return {


speed:
car.speed + (this.speedLevel-1)*5,


nitro:
car.nitro + (this.boostLevel-1)*5,


handling:
car.handling + (this.controlLevel-1)*3



};


}







getSpeed(){

return this.speedLevel;

}



getBoost(){

return this.boostLevel;

}



getControl(){

return this.controlLevel;

}



getSpeedCost(){

return this.getCost(this.speedLevel);

}



getBoostCost(){

return this.getCost(this.boostLevel);

}



getControlCost(){

return this.getCost(this.controlLevel);

}



}