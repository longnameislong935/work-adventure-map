/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

const SCRIPT_VERSION = "1.3.2"; 
const LOG_PREFIX = "[WA-OFFICE]"; 

console.log(`${LOG_PREFIX} Script Loading: v${SCRIPT_VERSION}`);

WA.onInit().then(async () => {
    console.log(`${LOG_PREFIX} Scripting API fully ready (v${SCRIPT_VERSION})`);

    // --- DESKTOP NOTIFICATION PERMISSION ---
    const requestNotifications = () => {
        if ("Notification" in window && Notification.permission !== "granted") {
            Notification.requestPermission().then(permission => {
                console.log(`${LOG_PREFIX} Notification permission: ${permission}`);
            });
        }
    };

    // Try to request on load
    requestNotifications();

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
            } catch (err) {
                console.error(`${LOG_PREFIX} Error sending wave:`, err);
            }
        });
    });

    // --- SECTION: RECEIVING A WAVE ---
    WA.event.on('wave-event').subscribe((event) => {
        console.log(`${LOG_PREFIX} Event received in logic`);
        
        try {
            const data = event.data as any;
            const sender = data.senderName;
            const targetX = data.senderX;
            const targetY = data.senderY;
            const isResponse = data.isResponse;

            // 1. SOUND & DESKTOP POPUP
            // We trigger these immediately when the event arrives
            const audio = new Audio("/bell.mp3");
            audio.play().catch(() => {
                console.warn(`${LOG_PREFIX} Audio blocked. User must click on map first.`);
            });

            if ("Notification" in window && Notification.permission === "granted") {
                new Notification("Office Wave", { body: `${sender} is waving!` });
            }

            // 2. STACKING BANNERS
            if (isResponse) {
                const backNotice = WA.ui.displayActionMessage({
                    message: `${sender} waved back! 👋`,
                    type: "message",
                    callback: () => { backNotice.remove(); }
                });
                setTimeout(() => { backNotice.remove(); }, 10000);
            } else {
                // To fix the "no options" issue, we use a simple two-step process
                const waveBanner = WA.ui.displayActionMessage({
                    message: `👋 ${sender} is waving! CLICK TO JOIN.`,
                    type: "message",
                    callback: () => {
                        console.log(`${LOG_PREFIX} Banner clicked for ${sender}`);
                        // Direct action on click to ensure it works
                        WA.player.moveTo(targetX, targetY);
                        
                        // After moving, offer to wave back in chat
                        WA.chat.sendChatMessage(`You joined ${sender}.`, "System");
                        waveBanner.remove();
                    }
                });

                setTimeout(() => { waveBanner.remove(); }, 60000);
            }

        } catch (err) {
            console.error(`${LOG_PREFIX} Error in wave logic:`, err);
        }
    });

    bootstrapExtra().then(() => {
        console.log(`${LOG_PREFIX} Scripting API Extra ready`);
    }).catch(err => console.error(`${LOG_PREFIX} Extra error:`, err));

}).catch(err => console.error(`${LOG_PREFIX} Init error:`, err));

export {};