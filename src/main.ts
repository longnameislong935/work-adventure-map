/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

// This allows you to ensure you are loading the correct script in the browser as caching can cause delays in loading changes. using dev tools in chrome and console
const SCRIPT_VERSION = "1.0.8"; 
// This allows for easy searching in the console for custom logging I.E. console.log(`${LOG_PREFIX} YOUR LOG HERE!`);
const LOG_PREFIX = "[WA-OFFICE]"; 

console.log(`${LOG_PREFIX} Script Loading: v${SCRIPT_VERSION}`);

WA.onInit().then(async () => {
    console.log(`${LOG_PREFIX} Scripting API fully ready (v${SCRIPT_VERSION})`);

    // Request permission for Desktop Notifications as soon as the map loads
    if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
    }

    try {
        await WA.players.configureTracking();
    } catch (err) {
        // Changed to 'err' and utilized in log to satisfy TS6133
        console.error(`${LOG_PREFIX} Tracking failed:`, err);
    }

    // --- SECTION: SENDING A WAVE ---
    WA.ui.onRemotePlayerClicked.subscribe((remotePlayer) => {
        remotePlayer.addAction('Wave 👋', async () => {
            try {
                const myPosition = await WA.player.getPosition();
                remotePlayer.sendEvent('wave-event', {
                    senderName: WA.player.name,
                    senderX: myPosition.x,
                    senderY: myPosition.y
                });
                WA.chat.sendChatMessage(`You waved at ${remotePlayer.name}`, "System");
            } catch (err) {
                console.error(`${LOG_PREFIX} Error sending wave:`, err);
            }
        });
    });

    // --- SECTION: RECEIVING A WAVE ---
    WA.event.on('wave-event').subscribe((event) => {
        console.log(`${LOG_PREFIX} Wave event received!`);
        
        try {
            const data = event.data as any;
            const sender = data.senderName;
            const targetX = data.senderX;
            const targetY = data.senderY;

            // 1. Play a Notification Sound (Uses a standard system beep)
            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
            audio.play().catch(() => {
                // Removed unused 'e' to satisfy TS6133
                console.log(`${LOG_PREFIX} Audio blocked by browser policy (requires user interaction first).`);
            });

            // 2. Desktop Notification (Works even if the tab is hidden)
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification("WorkAdventure", {
                    body: `${sender} is waving at you!`,
                    icon: "https://workadventu.re/favicon.ico" 
                });
            }

            // 3. In-game Banner
            const waveNotice = WA.ui.displayActionMessage({
                message: `${sender} is waving! Click to walk to them.`,
                type: "message",
                callback: async () => {
                    WA.player.moveTo(targetX, targetY);
                    waveNotice.remove();
                }
            });

            setTimeout(() => { waveNotice.remove(); }, 20000);

        } catch (err) {
            console.error(`${LOG_PREFIX} Error handling wave:`, err);
        }
    });

    // Bootstraps the Extra library
    bootstrapExtra().then(() => {
        console.log(`${LOG_PREFIX} Scripting API Extra ready`);
    }).catch(err => {
        console.error(`${LOG_PREFIX} Extra Library error:`, err);
    });

}).catch(err => {
    console.error(`${LOG_PREFIX} Initialization error:`, err);
});

export {};