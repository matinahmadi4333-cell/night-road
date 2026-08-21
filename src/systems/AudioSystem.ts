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
    // SAFETY NET — kills ANY sound
    // instance with this key, even
    // ones this class lost track of
    // (e.g. after a scene restart /
    // HMR reload left an orphaned
    // Sound object behind).
    // ==========================

    static stopAllByKey(key:string){

        const manager:any = this.scene?.sound;

        if(!manager || !manager.sounds)
            return;

        // iterate backwards: stop()/destroy() mutate the array
        for(let i = manager.sounds.length - 1; i >= 0; i--){

            const s = manager.sounds[i];

            if(s && s.key === key){

                s.stop();
                s.destroy();

            }

        }

    }

    // ==========================
    // MENU MUSIC
    // ==========================

    static playMenuMusic(){

        if(!this.musicEnabled)
            return;

        this.stopGameMusic();
        this.stopAllByKey("game_theme");

        if(this.menuMusic){

            this.menuMusic.setMute(false);
            this.menuMusic.setVolume(this.musicVolume);
            return;

        }

        // clear any orphaned menu_theme instance before making a new one
        this.stopAllByKey("menu_theme");

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

        this.stopAllByKey("menu_theme");

    }

    // ==========================
    // GAME MUSIC
    // ==========================

    static playGameMusic(){

        if(!this.musicEnabled)
            return;

        this.stopMenuMusic();

        if(this.gameMusic){

            this.gameMusic.setMute(false);
            this.gameMusic.setVolume(this.musicVolume);
            return;

        }

        // clear any orphaned game_theme instance before making a new one
        this.stopAllByKey("game_theme");

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

        this.stopAllByKey("game_theme");

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