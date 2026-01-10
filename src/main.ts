/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

// --- VERSION TRACKING ---
const SCRIPT_VERSION = "1.0.3"; 
console.log(`%c WorkAdventure Script Loading: v${SCRIPT_VERSION}`, "color: #00ff00; font-weight: bold;");

let currentPopup: any = undefined;

WA.onInit().then(async () => {
    console.log(`Scripting API fully ready (v${SCRIPT_VERSION})`);

    // Enable tracking so players can "talk" to each other
    try {
        await WA.players.configureTracking();
        console.log("Player tracking enabled.");
    } catch (e) {
        console.error("Tracking failed to initialize:", e);
    }

    // --- SECTION 1: THE CLOCK ---
    WA.room.area.onEnter('clock').subscribe(() => {
        const today = new Date();
        const time = today.getHours() + ":" + today.getMinutes().toString().padStart(2, '0');
        WA.chat.sendChatMessage("The time is " + time, "System");
    });

    // --- SECTION 2: SENDING A WAVE ---
    WA.ui.onRemotePlayerClicked.subscribe((remotePlayer) => {
        console.log("Clicked on player:", remotePlayer.name);
        
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
                console.log("Wave event sent to", remotePlayer.id);
            } catch (err) {
                console.error("Error sending wave:", err);
            }
        });
    });

    // --- SECTION 3: RECEIVING A WAVE ---
    WA.event.on('wave-event').subscribe((event) => {
        console.log("Wave event received!", event);
        
        try {
            const data = event.data as any;
            const sender = data.senderName;
            const targetX = data.senderX;
            const targetY = data.senderY;

            // 1. Send a chat message (as a backup in case the banner fails)
            WA.chat.sendChatMessage(`${sender} is waving at you!`, "System");

            // 2. Show the Action Message banner
            const waveNotice = WA.ui.displayActionMessage({
                message: `${sender} is waving! Click to walk to them.`,
                type: "message", // Must be "message" or "warning"
                callback: async () => {
                    console.log("Join clicked. Moving to:", targetX, targetY);
                    WA.player.moveTo(targetX, targetY);
                    waveNotice.remove();
                }
            });

            // Auto-remove after 20 seconds
            setTimeout(() => {
                waveNotice.remove();
            }, 20000);

        } catch (err) {
            console.error("Error handling received wave:", err);
        }
    });

    bootstrapExtra().then(() => {
        console.log('Scripting API Extra ready');
    }).catch(e => console.error(e));

}).catch(e => console.error(e));

export {};