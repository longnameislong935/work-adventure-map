/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

const SCRIPT_VERSION = "1.3.0"; 
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
        try {
            const data = event.data as any;
            const sender = data.senderName;
            const targetX = data.senderX;
            const targetY = data.senderY;
            const isResponse = data.isResponse;

            // Sound
            const audio = new Audio("/bell.mp3");
            audio.play().catch(() => {});

            if (isResponse) {
                // If someone waves back, show a simple non-clickable banner
                const backNotice = WA.ui.displayActionMessage({
                    message: `${sender} waved back! 👋`,
                    type: "message",
                    callback: () => { backNotice.remove(); }
                });
                setTimeout(() => { backNotice.remove(); }, 10000);
            } else {
                // NEW STACKING LOGIC:
                // We show one banner that, when clicked, opens the options.
                // Because these are "ActionMessages", if 3 people wave, 
                // you will see 3 banners stacked at the bottom of the screen.
                
                const waveBanner = WA.ui.displayActionMessage({
                    message: `👋 ${sender} is waving! (Click for options)`,
                    type: "message",
                    callback: () => {
                        // When they click the specific banner, then show the choice
                        const choicePopup = WA.ui.openPopup("clockPopup", `Options for ${sender}:`, [
                            {
                                label: "Wave Back 👋",
                                className: "success",
                                callback: (popup) => {
                                    WA.room.sendEvent('wave-event', { senderName: WA.player.name, isResponse: true });
                                    popup.close();
                                    waveBanner.remove();
                                }
                            },
                            {
                                label: "Join 🚶",
                                className: "primary",
                                callback: (popup) => {
                                    WA.player.moveTo(targetX, targetY);
                                    popup.close();
                                    waveBanner.remove();
                                }
                            }
                        ]);
                    }
                });

                // Auto-remove banners after 60 seconds
                setTimeout(() => { waveBanner.remove(); }, 60000);
            }

        } catch (err) {
            console.error(`${LOG_PREFIX} Error handling wave:`, err);
        }
    });

    bootstrapExtra().then(() => {
        console.log(`${LOG_PREFIX} Scripting API Extra ready`);
    }).catch(err => console.error(`${LOG_PREFIX} Extra error:`, err));

}).catch(err => console.error(`${LOG_PREFIX} Init error:`, err));

export {};