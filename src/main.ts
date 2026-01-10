/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

// This allows you to ensure you are loading the correct script in the browser as caching can cause delays in loading changes. using dev tools in chrome and console
const SCRIPT_VERSION = "1.2.0"; 
// This allows for easy searching in the console for custom logging I.E. console.log(`${LOG_PREFIX} YOUR LOG HERE!`);
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

    // --- SECTION: SENDING A WAVE ---
    WA.ui.onRemotePlayerClicked.subscribe((remotePlayer) => {
        remotePlayer.addAction('Wave 👋', async () => {
            try {
                const myPosition = await WA.player.getPosition();
                remotePlayer.sendEvent('wave-event', {
                    senderName: WA.player.name,
                    senderX: myPosition.x,
                    senderY: myPosition.y,
                    isResponse: false
                });
                console.log(`${LOG_PREFIX} Wave sent to ${remotePlayer.name}`);
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
            const isResponse = data.isResponse;

            // 1. Play Local Bell Sound
            const audio = new Audio("/bell.mp3");
            audio.play().catch(() => {
                console.log(`${LOG_PREFIX} Audio blocked by browser policy.`);
            });

            // 2. Desktop Notification
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification(isResponse ? "Wave Back!" : "New Wave", {
                    body: isResponse ? `${sender} waved back at you!` : `${sender} is waving at you!`,
                });
            }

            // 3. Choice Banner (The logic for Wave Back and Join)
            if (isResponse) {
                // If this is just a "Wave Back", show a simple message
                WA.ui.displayActionMessage({
                    message: `${sender} waved back at you! 👋`,
                    type: "message"
                });
            } else {
                // If it's a new wave, show the two buttons
                const waveNotice = WA.ui.openPopup("clockPopup", `${sender} is waving at you!`, [
                    {
                        label: "Wave Back 👋",
                        className: "success",
                        callback: (popup) => {
                            // Find the sender in the room to send an event back
                            WA.event.sendEvent('wave-event', {
                                senderName: WA.player.name,
                                isResponse: true
                            });
                            popup.close();
                        }
                    },
                    {
                        label: "Join 🚶",
                        className: "primary",
                        callback: (popup) => {
                            WA.player.moveTo(targetX, targetY);
                            popup.close();
                        }
                    }
                ]);

                // Auto-close after 20 seconds
                setTimeout(() => { waveNotice.close(); }, 20000);
            }

        } catch (err) {
            console.error(`${LOG_PREFIX} Error handling wave:`, err);
        }
    });

    bootstrapExtra().then(() => {
        console.log(`${LOG_PREFIX} Scripting API Extra ready`);
    }).catch(err => {
        console.error(`${LOG_PREFIX} Extra Library error:`, err);
    });

}).catch(err => {
    console.error(`${LOG_PREFIX} Initialization error:`, err);
});

export {};