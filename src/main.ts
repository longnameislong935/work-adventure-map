/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

const SCRIPT_VERSION = "1.4.4"; 
const LOG_PREFIX = "[WA-OFFICE]"; 

console.log(`${LOG_PREFIX} Script Loading: v${SCRIPT_VERSION}`);

// Pre-create the audio object at the top level to help the browser "prime" the resource
const waveSound = new Audio("resources/sounds/bell.mp3");

WA.onInit().then(async () => {
    console.log(`${LOG_PREFIX} Scripting API fully ready (v${SCRIPT_VERSION})`);

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
            const targetX = data.senderX;
            const targetY = data.senderY;

            // 1. PLAY CUSTOM AUDIO
            // We use the pre-defined object to avoid 'resource not suitable' errors
            waveSound.play()
                .then(() => console.log(`${LOG_PREFIX} Bell sound played successfully.`))
                .catch((err) => {
                    console.warn(`${LOG_PREFIX} Audio play failed. This is usually due to browser autoplay policies. Click the map!`, err);
                });

            // 2. DESKTOP NOTIFICATION
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification("Office Wave", {
                    body: `${sender} is waving at you!`,
                    silent: true 
                });
            }

            // 3. VISUAL BANNER
            const waveNotice = WA.ui.displayActionMessage({
                message: `👋 ${sender} is waving! Click to join them.`,
                type: "message",
                callback: async () => {
                    WA.player.moveTo(targetX, targetY);
                    waveNotice.remove();
                }
            });

            setTimeout(() => { waveNotice.remove(); }, 60000);

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