/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

const SCRIPT_VERSION = "1.5.1"; 
const LOG_PREFIX = "[WA-OFFICE]"; 

console.log(`${LOG_PREFIX} Script Loading: v${SCRIPT_VERSION}`);

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
        try {
            const data = event.data as any;
            const sender = data.senderName;
            const targetX = data.senderX;
            const targetY = data.senderY;
            const isResponse = data.isResponse;

            // 1. DESKTOP NOTIFICATION (System Sound)
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification(isResponse ? "Wave Received" : "Office Wave", {
                    body: isResponse ? `${sender} waved back! 👋` : `${sender} is waving at you!`,
                });
            }

            // 2. INTERACTIVE BANNER
            if (isResponse) {
                // If it's a "Wave Back", just show a simple notification banner
                const backNotice = WA.ui.displayActionMessage({
                    message: `${sender} waved back! 👋`,
                    type: "message",
                    callback: () => { backNotice.remove(); }
                });
                setTimeout(() => { backNotice.remove(); }, 10000);
            } else {
                // If it's a new wave, show the interactive "Click for options" banner
                const waveNotice = WA.ui.displayActionMessage({
                    message: `👋 ${sender} is waving! (Click for options)`,
                    type: "message",
                    callback: () => {
                        // Open the choice menu when they click the blue banner
                        WA.ui.openPopup("clockPopup", `${sender} is waving! What would you like to do?`, [
                            {
                                label: "Wave Back 👋",
                                className: "success",
                                callback: (popup) => {
                                    WA.event.broadcast('wave-event', { 
                                        senderName: WA.player.name, 
                                        isResponse: true 
                                    });
                                    popup.close();
                                    waveNotice.remove();
                                }
                            },
                            {
                                label: "Join🚶",
                                className: "primary",
                                callback: (popup) => {
                                    WA.player.moveTo(targetX, targetY);
                                    popup.close();
                                    waveNotice.remove();
                                }
                            }
                        ]);
                    }
                });
                setTimeout(() => { waveNotice.remove(); }, 60000);
            }

        } catch (err) {
            console.error(`${LOG_PREFIX} Error handling wave:`, err);
        }
    });

    // --- SENDING A WAVE ---
    WA.ui.onRemotePlayerClicked.subscribe((remotePlayer) => {
        remotePlayer.addAction('Wave 👋', async () => {
            const myPosition = await WA.player.getPosition();
            remotePlayer.sendEvent('wave-event', {
                senderName: WA.player.name,
                senderX: myPosition.x,
                senderY: myPosition.y,
                isResponse: false
            });
        });
    });

    bootstrapExtra().then(() => {
        console.log(`${LOG_PREFIX} Scripting API Extra ready`);
    }).catch(err => console.error(`${LOG_PREFIX} Extra error:`, err));

}).catch(err => console.error(`${LOG_PREFIX} Init error:`, err));

export {};