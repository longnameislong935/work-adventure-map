/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

const SCRIPT_VERSION = "2.0.0"; 
const LOG_PREFIX = "[WA-WAVE]"; 

console.log(`${LOG_PREFIX} Script Loading: v${SCRIPT_VERSION}`);

WA.onInit().then(async () => {
    console.log(`${LOG_PREFIX} Scripting API fully ready (v${SCRIPT_VERSION})`);

    // Request desktop notification permission immediately
    if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
    }

    // --- RECEIVING A WAVE ---
    WA.event.on('wave-event').subscribe((event: any) => {
        try {
            const data = event.data;
            
            // SECURITY CHECK: Only show the wave if it was meant for ME
            // This ensures the wave is private between sender and receiver
            if (data.targetId !== WA.player.id) {
                return;
            }

            const sender = data.senderName;
            const targetX = data.senderX;
            const targetY = data.senderY;

            // 1. DESKTOP NOTIFICATION (OS Sound)
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification("New Wave", {
                    body: `${sender} is waving at you!`,
                    tag: "wa-wave"
                });
            }

            // 2. VISUAL BANNER WITH JOIN BUTTON
            const waveNotice = WA.ui.displayActionMessage({
                message: `👋 ${sender} is waving! (Click to Join)`,
                type: "message",
                callback: () => {
                    WA.player.moveTo(targetX, targetY);
                    waveNotice.remove();
                }
            });

            // Auto-hide banner after 30 seconds
            setTimeout(() => { waveNotice.remove(); }, 30000);

        } catch (err) {
            console.error(`${LOG_PREFIX} Error handling wave:`, err);
        }
    });

    // --- SENDING A WAVE ---
    WA.ui.onRemotePlayerClicked.subscribe((remotePlayer: any) => {
        remotePlayer.addAction('Wave 👋', async () => {
            const myPosition = await WA.player.getPosition();
            
            // Send event specifically to the person clicked
            // Using broadcast with a targetId is the most reliable cross-room method
            WA.event.broadcast('wave-event', {
                targetId: remotePlayer.id,
                senderName: WA.player.name,
                senderX: myPosition.x,
                senderY: myPosition.y
            });
            
            WA.chat.sendChatMessage(`You waved at ${remotePlayer.name}`, "System");
        });
    });

    bootstrapExtra();

}).catch(err => console.error(`${LOG_PREFIX} Init error:`, err));

export {};