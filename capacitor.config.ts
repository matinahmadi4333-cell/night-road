import type { CapacitorConfig } from '@capacitor/cli';


const config: CapacitorConfig = {

    appId: "com.matin.novaoverdrive",

    appName: "NIGHT ROAD",

    webDir: "dist",


    android: {

        backgroundColor: "#05040A",

        allowMixedContent: true

    },


    plugins: {

        StatusBar: {

            overlaysWebView: true,

            style: "DARK",

            backgroundColor: "#05040A"

        }

    }

};


export default config;