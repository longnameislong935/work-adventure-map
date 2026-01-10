/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

const SCRIPT_VERSION = "1.6.4"; 
const LOG_PREFIX = "[WA-OFFICE]"; 

console.log(`${LOG_PREFIX} Script Loading: v${SCRIPT_VERSION}`);

WA.onInit().then(async () => {
    console.log(`${LOG_PREFIX} Scripting API fully ready (v${SCRIPT_VERSION})`);

    // --- MAC FIX: Request permission ONLY on a specific action ---
    // Safari ignores requests that aren't tied to a click.
    const enableNotifications = () => {
        if ("Notification" in window && Notification.permission !== "granted") {
            Notification.requestPermission();
        }
    };

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

            // 1. MAC AUDIO FALLBACK: The 'warning' UI type
            // This UI type often triggers a system-level beep in Safari/Chrome on Mac.
            const audioAlert = WA.ui.displayActionMessage({
                message: isResponse ? `👋 ${sender} waved back!` : `🔔 WAVE: ${sender} is waving!`,
                type: isResponse ? "message" : "warning", // 'warning' is more likely to trigger a sound
                callback: () => { audioAlert.remove(); }
            });
            setTimeout(() => { audioAlert.remove(); }, 10000);

            // 2. DESKTOP NOTIFICATION
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification(isResponse ? "Wave Back" : "New Wave", {
                    body: isResponse ? `${sender} waved back!` : `${sender} is waving at you!`,
                    tag: "wa-wave"
                });
            }

            // 3. INTERACTIVE BANNER (Only for new waves)
            if (!isResponse) {
                const waveNotice = WA.ui.displayActionMessage({
                    message: `Options for ${sender} (Click to open)`,
                    type: "message",
                    callback: () => {
                        enableNotifications(); // Use this click to try and 'unlock' permissions
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
            enableNotifications(); // Prime notifications when you wave at someone else
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