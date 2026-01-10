/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

const SCRIPT_VERSION = "1.4.1"; 
const LOG_PREFIX = "[WA-OFFICE]"; 

console.log(`${LOG_PREFIX} Script Loading: v${SCRIPT_VERSION}`);

WA.onInit().then(async () => {
    console.log(`${LOG_PREFIX} Scripting API fully ready (v${SCRIPT_VERSION})`);

    // Ensure we have notification permissions
    if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
    }

    try {
        await WA.players.configureTracking();
    } catch (err) {
        console.error(`${LOG_PREFIX} Tracking failed:`, err);
    }

    // --- RECEIVING A WAVE ---
    WA.event.on('wave-event').subscribe((event) => {
        console.log(`${LOG_PREFIX} Wave received!`);
        
        try {
            const data = event.data as any;
            const sender = data.senderName;

            // 1. PLAY CUSTOM AUDIO FIRST
            // We use the root path to find bell.mp3 in the public folder
            const audio = new Audio("bell.mp3"); 
            audio.volume = 1.0;
            
            audio.play()
                .then(() => console.log(`${LOG_PREFIX} Custom bell sound played.`))
                .catch((err) => console.warn(`${LOG_PREFIX} Custom sound blocked.`, err));

            // 2. DESKTOP NOTIFICATION (Silent mode)
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification("Office Wave", {
                    body: `${sender} is waving at you!`,
                    silent: true // This stops the OS from playing its default 'ding'
                });
            }

            // 3. VISUAL BANNER
            WA.ui.displayActionMessage({
                message: `👋 ${sender} is waving at you!`,
                type: "message",
                callback: () => { /* Logic here if needed later */ }
            });

        } catch (err) {
            console.error(`${LOG_PREFIX} Error in wave logic:`, err);
        }
    });

    // --- SENDING A WAVE ---
    WA.ui.onRemotePlayerClicked.subscribe((remotePlayer) => {
        remotePlayer.addAction('Wave 👋', async () => {
            const myPosition = await WA.player.getPosition();
            remotePlayer.sendEvent('wave-event', {
                senderName: WA.player.name,
                senderX: myPosition.x,
                senderY: myPosition.y
            });
            console.log(`${LOG_PREFIX} Wave sent to ${remotePlayer.name}`);
        });
    });

    bootstrapExtra().then(() => {
        console.log(`${LOG_PREFIX} Scripting API Extra ready`);
    }).catch(err => console.error(`${LOG_PREFIX} Extra error:`, err));

}).catch(err => console.error(`${LOG_PREFIX} Init error:`, err));

export {};