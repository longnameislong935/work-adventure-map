/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

// --- CONFIGURATION ---
const SCRIPT_VERSION = "1.0.4"; 
const LOG_PREFIX = "[WA-OFFICE]"; // Search for this in your browser console!

console.log(`${LOG_PREFIX} Script Loading: v${SCRIPT_VERSION}`);

let currentPopup: any = undefined;

WA.onInit().then(async () => {
    console.log(`${LOG_PREFIX} Scripting API fully ready (v${SCRIPT_VERSION})`);

    // Enable tracking so players can "see" each other
    try {
        await WA.players.configureTracking();
        console.log(`${LOG_PREFIX} Player tracking enabled.`);
    } catch (e) {
        console.error(`${LOG_PREFIX} Tracking failed to initialize:`, e);
    }

    // --- SECTION 1: THE CLOCK ---
    WA.room.area.onEnter('clock').subscribe(() => {
        const today = new Date();
        const time = today.getHours() + ":" + today.getMinutes().toString().padStart(2, '0');
        WA.chat.sendChatMessage(`${LOG_PREFIX} The time is ${time}`, "System");
    });

    // --- SECTION 2: SENDING A WAVE ---
    WA.ui.onRemotePlayerClicked.subscribe((remotePlayer) => {
        console.log(`${LOG_PREFIX} Menu opened for player:`, remotePlayer.name);
        
        remotePlayer.addAction('Wave 👋', async () => {
            try {
                const myPosition = await WA.player.getPosition();
                
                // Send the event
                remotePlayer.sendEvent('wave-event', {
                    senderName: WA.player.name,
                    senderX: myPosition.x,
                    senderY: myPosition.y
                });
                
                WA.chat.sendChatMessage(`You waved at ${remotePlayer.name}`, "System");
                console.log(`${LOG_PREFIX} Wave event sent to: ${remotePlayer.name} (${remotePlayer.id})`);
            } catch (err) {
                console.error(`${LOG_PREFIX} Error sending wave:`, err);
            }
        });
    });

    // --- SECTION 3: RECEIVING A WAVE ---
    WA.event.on('wave-event').subscribe((event) => {
        console.log(`${LOG_PREFIX} Wave event received! Data:`, event);
        
        try {
            const data = event.data as any;
            const sender = data.senderName;
            const targetX = data.senderX;
            const targetY = data.senderY;

            // 1. Send a chat message (as a backup)
            WA.chat.sendChatMessage(`${sender} is waving at you!`, "System");

            // 2. Show the Action Message banner
            const waveNotice = WA.ui.displayActionMessage({
                message: `${sender} is waving! Click to walk to them.`,
                type: "message",
                callback: async () => {
                    console.log(`${LOG_PREFIX} Join clicked. Moving to sender's last position.`);
                    WA.player.moveTo(targetX, targetY);
                    waveNotice.remove();
                }
            });

            // Auto-remove after 20 seconds
            setTimeout(() => {
                waveNotice.remove();
            }, 20000);

        } catch (err) {
            console.error(`${LOG_PREFIX} Error handling received wave:`, err);
        }
    });

    bootstrapExtra().then(() => {
        console.log(`${LOG_PREFIX} Scripting API Extra ready`);
    }).catch(e => console.error(`${LOG_PREFIX} Extra Library error:`, e));

}).catch(e => console.error(`${LOG_PREFIX} Initialization error:`, e));

export {};