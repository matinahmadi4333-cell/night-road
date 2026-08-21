export default class SaveSystem {


static saveData:any = {



crystals:0,


bestScore:0,



ownedCars:[

"starter"

],



selectedCar:"starter",



sound:true,


music:true,


control:"mobile",




// UPGRADES (legacy, global — kept for backwards compatibility)

speedLevel:1,

boostLevel:1,

controlLevel:1,


// per-car upgrade levels, e.g. { starter: 3, sport: 1 }
carUpgrades:{}



};







static load(){



const data = localStorage.getItem(

"NOVA_OVERDRIVE_SAVE"

);





if(data){


this.saveData={


...this.saveData,


...JSON.parse(data)



};


}



return this.saveData;



}









static save(){



localStorage.setItem(


"NOVA_OVERDRIVE_SAVE",


JSON.stringify(this.saveData)



);



}









static addCrystal(amount:number){



this.saveData.crystals += amount;


this.save();



}









static spendCrystal(amount:number){



if(this.saveData.crystals >= amount){



this.saveData.crystals -= amount;


this.save();



return true;



}



return false;



}









static unlockCar(id:string){



if(

!this.saveData.ownedCars.includes(id)

){



this.saveData.ownedCars.push(id);


this.save();



}



}









static selectCar(id:string){



if(

this.saveData.ownedCars.includes(id)

){



this.saveData.selectedCar=id;


this.save();



}



}









static getSelectedCar(){



return this.saveData.selectedCar;



}









static getCrystals(){



return this.saveData.crystals;



}









static getOwnedCars(){



return this.saveData.ownedCars;



}









static updateBestScore(score:number){



if(score > this.saveData.bestScore){



this.saveData.bestScore=score;


this.save();



}



}









static saveUpgrade(

speed:number,

boost:number,

control:number

){



this.saveData.speedLevel=speed;


this.saveData.boostLevel=boost;


this.saveData.controlLevel=control;



this.save();



}









static getCarUpgradeLevel(id:string){


if(!this.saveData.carUpgrades || typeof this.saveData.carUpgrades !== "object"){
this.saveData.carUpgrades={};
}

const stored = this.saveData.carUpgrades[id];

const level = Number(stored);

if(!stored || isNaN(level) || level<1){
return 1;
}

return level;


}




static upgradeCar(id:string, cost:number){


if(!this.spendCrystal(cost)){
return false;
}

if(!this.saveData.carUpgrades){
this.saveData.carUpgrades={};
}

const current = this.getCarUpgradeLevel(id);

this.saveData.carUpgrades[id] = current + 1;

this.save();

return true;


}




static getUpgrade(){



return {



speedLevel:this.saveData.speedLevel,


boostLevel:this.saveData.boostLevel,


controlLevel:this.saveData.controlLevel



};



}









static toggleSound(){



this.saveData.sound =
!this.saveData.sound;



this.save();



}









static toggleMusic(){



this.saveData.music =
!this.saveData.music;



this.save();



}









static setControl(mode:string){



this.saveData.control=mode;


this.save();



}









static getSound(){



return this.saveData.sound;



}









static getMusic(){



return this.saveData.music;



}









static getControl(){



return this.saveData.control;



}









static reset(){



localStorage.removeItem(

"NOVA_OVERDRIVE_SAVE"

);



this.saveData={



crystals:0,


bestScore:0,


ownedCars:[

"starter"

],



selectedCar:"starter",



sound:true,


music:true,


control:"mobile",



speedLevel:1,


boostLevel:1,


controlLevel:1,


carUpgrades:{}



};



}



}