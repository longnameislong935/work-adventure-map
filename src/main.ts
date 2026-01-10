/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

// Back to basics: Removing custom audio to ensure 100% reliability without user interaction rules.
const SCRIPT_VERSION = "1.5.0"; 
const LOG_PREFIX = "[WA-OFFICE]"; 

console.log(`${LOG_PREFIX} Script Loading: v${SCRIPT_VERSION}`);

WA.onInit().then(async () => {
    console.log(`${LOG_PREFIX} Scripting API fully ready (v${SCRIPT_VERSION})`);

    // Request permission for Desktop Notifications
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

            // 1. DESKTOP NOTIFICATION (Using Default OS Sound)
            if ("Notification" in window && Notification.permission === "granted") {
                // By NOT setting 'silent: true', the OS plays its default 'Ping'
                new Notification("Office Wave", {
                    body: `${sender} is waving at you!`,
                });
            }

            // 2. VISUAL BANNER WITH JOIN BUTTON
            const waveNotice = WA.ui.displayActionMessage({
                message: `👋 ${sender} is waving! Click to join them.`,
                type: "message",
                callback: async () => {
                    console.log(`${LOG_PREFIX} Join clicked. Walking to ${sender}.`);
                    WA.player.moveTo(targetX, targetY);
                    waveNotice.remove();
                }
            });

            // Auto-hide banner after 60 seconds
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