/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

const SCRIPT_VERSION = "1.6.3"; 
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

            // 1. USE CHAT FOR AUDIO (Native WA Sound)
            // This is the Mac-specific fix. It uses the game's internal audio.
            if (isResponse) {
                WA.chat.sendChatMessage(`${sender} waved back! 👋`, "Wave System");
            } else {
                WA.chat.sendChatMessage(`${sender} is waving!`, "Wave System");
            }

            // 2. DESKTOP NOTIFICATION
            // Removed 'renotify' to fix TS2353 build error
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification(isResponse ? "Wave Back" : "New Wave", {
                    body: isResponse ? `${sender} waved back!` : `${sender} is waving at you!`,
                    tag: "wa-wave"
                });
            }

            // 3. INTERACTIVE BANNER
            if (!isResponse) {
                const waveNotice = WA.ui.displayActionMessage({
                    message: `👋 ${sender} is waving! (Click for options)`,
                    type: "message",
                    callback: () => {
                        WA.ui.openPopup("clockPopup", `${sender} is waving!`, [
                            {
                                label: "Wave Back 👋",
                                className: "success",
                                callback: (popup) => {
                                    WA.event.broadcast('wave-event', { senderName: WA.player.name, isResponse: true });
                                    popup.close();
                                    waveNotice.remove();
                                }
                            },
                            {
                                label: "Join 🚶",
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