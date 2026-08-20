import Phaser from "phaser";

export default class AudioSystem {

    static scene: Phaser.Scene;

    static menuMusic?: any;
    static gameMusic?: any;

    // ==========================
    // SETTINGS
    // ==========================

    static musicVolume:number = 0.45;
    static sfxVolume:number = 0.80;

    static musicEnabled:boolean = true;
    static sfxEnabled:boolean = true;

    // ==========================
    // INIT
    // ==========================

    static init(scene: Phaser.Scene){

        this.scene = scene;

    }

    // ==========================
    // UI CLICK
    // ==========================

    static click(){

        if(!this.sfxEnabled) return;

        this.scene.sound.play(
            "ui_click",
            {
                volume:this.sfxVolume * 0.6
            }
        );

    }

    // ==========================
    // PURCHASE
    // ==========================

    static purchase(){

        if(!this.sfxEnabled) return;

        this.scene.sound.play(
            "purchase",
            {
                volume:this.sfxVolume * 0.8
            }
        );

    }
static carBuy(){

    if(!this.sfxEnabled) return;

    this.scene.sound.play(
        "car_buy",
        {
            volume:this.sfxVolume * 0.8
        }
    );

}
    // ==========================
    // CRYSTAL
    // ==========================

    static crystal(){

        if(!this.sfxEnabled) return;

        this.scene.sound.play(
            "crystal",
            {
                volume:this.sfxVolume * 0.7
            }
        );

    }

    // ==========================
    // CRASH
    // ==========================

    static crash(){

        if(!this.sfxEnabled) return;

        this.scene.sound.play(
            "crash",
            {
                volume:this.sfxVolume * 0.8
            }
        );

    }

    // ==========================
    // NITRO
    // ==========================

    static nitro(){

        if(!this.sfxEnabled) return;

        this.scene.sound.play(
            "nitro",
            {
                volume:this.sfxVolume * 0.9
            }
        );

    }
    // ==========================
    // MENU MUSIC
    // ==========================

    static playMenuMusic(){

        if(!this.musicEnabled)
            return;

        if(this.gameMusic){

            this.gameMusic.stop();
            this.gameMusic.destroy();
            this.gameMusic = undefined;

        }

        if(this.menuMusic){

            this.menuMusic.setMute(false);
            this.menuMusic.setVolume(this.musicVolume);
            return;

        }

        this.menuMusic = this.scene.sound.add(
            "menu_theme",
            {
                loop:true,
                volume:this.musicVolume
            }
        );

        this.menuMusic.play();
        this.menuMusic.setVolume(this.musicVolume);

    }

    static stopMenuMusic(){

        if(this.menuMusic){

            this.menuMusic.stop();
            this.menuMusic.destroy();
            this.menuMusic = undefined;

        }

    }

    // ==========================
    // GAME MUSIC
    // ==========================

    static playGameMusic(){

        if(!this.musicEnabled)
            return;

        if(this.menuMusic){

            this.menuMusic.stop();
            this.menuMusic.destroy();
            this.menuMusic = undefined;

        }

        if(this.gameMusic){

            this.gameMusic.setMute(false);
            this.gameMusic.setVolume(this.musicVolume);
            return;

        }

        this.gameMusic = this.scene.sound.add(
            "game_theme",
            {
                loop:true,
                volume:this.musicVolume
            }
        );

        this.gameMusic.play();
        this.gameMusic.setVolume(this.musicVolume);

    }

    static stopGameMusic(){

        if(this.gameMusic){

            this.gameMusic.stop();
            this.gameMusic.destroy();
            this.gameMusic = undefined;

        }

    }

    // ==========================
    // MUSIC VOLUME
    // ==========================

    static setMusicVolume(volume:number){

        this.musicVolume = Phaser.Math.Clamp(
            volume,
            0,
            1
        );

        if(this.menuMusic){

            this.menuMusic.setVolume(
                this.musicVolume
            );

        }

        if(this.gameMusic){

            this.gameMusic.setVolume(
                this.musicVolume
            );

        }

    }

    // ==========================
    // SFX VOLUME
    // ==========================

    static setSfxVolume(volume:number){

        this.sfxVolume = Phaser.Math.Clamp(
            volume,
            0,
            1
        );

    }
    // ==========================
    // TOGGLE MUSIC
    // ==========================

    static toggleMusic(){

        this.musicEnabled = !this.musicEnabled;

        if(!this.musicEnabled){

            if(this.menuMusic){

                this.menuMusic.setMute(true);

            }

            if(this.gameMusic){

                this.gameMusic.setMute(true);

            }

        }else{

            if(this.menuMusic){

                this.menuMusic.setMute(false);
                this.menuMusic.setVolume(this.musicVolume);

            }

            if(this.gameMusic){

                this.gameMusic.setMute(false);
                this.gameMusic.setVolume(this.musicVolume);

            }

        }

    }

    // ==========================
    // TOGGLE SFX
    // ==========================

    static toggleSfx(){

        this.sfxEnabled = !this.sfxEnabled;

    }

    // ==========================
    // GETTERS
    // ==========================

    static isMusicEnabled(){

        return this.musicEnabled;

    }

    static isSfxEnabled(){

        return this.sfxEnabled;

    }

    static getMusicVolume(){

        return this.musicVolume;

    }

    static getSfxVolume(){

        return this.sfxVolume;

    }

}