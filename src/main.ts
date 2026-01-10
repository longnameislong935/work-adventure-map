/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

const SCRIPT_VERSION = "1.4.6"; 
const LOG_PREFIX = "[WA-OFFICE]"; 

console.log(`${LOG_PREFIX} Script Loading: v${SCRIPT_VERSION}`);

// Relative path
const waveSound = new Audio("bell.mp3");

// --- AUTO-UNLOCK AUDIO ---
// This listens for the very first click on the map to "enable" sound for the browser
const unlockAudio = () => {
    waveSound.play().then(() => {
        // Sound works! Stop and reset so it's ready for a wave
        waveSound.pause();
        waveSound.currentTime = 0;
        console.log(`${LOG_PREFIX} Audio unlocked and ready.`);
        window.removeEventListener('click', unlockAudio);
    }).catch(() => {
        // Still locked, wait for next click
    });
};
window.addEventListener('click', unlockAudio);

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
            waveSound.play()
                .then(() => console.log(`${LOG_PREFIX} Bell sound played.`))
                .catch((err) => {
                    console.warn(`${LOG_PREFIX} Audio still blocked. Please click the map.`, err);
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
        });
    });

    bootstrapExtra().then(() => {
        console.log(`${LOG_PREFIX} Scripting API Extra ready`);
    }).catch(err => console.error(`${LOG_PREFIX} Extra error:`, err));

}).catch(err => console.error(`${LOG_PREFIX} Init error:`, err));

export {};