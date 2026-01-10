/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra, Bell } from "@workadventure/scripting-api-extra";

const SCRIPT_VERSION = "1.8.0"; 
const LOG_PREFIX = "[WA-WAVE]"; 

WA.onInit().then(async () => {
    console.log(`${LOG_PREFIX} Script Loading: v${SCRIPT_VERSION}`);

    // Initialize the Extra library
    const extra = await bootstrapExtra();

    // 1. SETUP THE NATIVE BELL
    // We create a bell instance. It expects a name and a sound file.
    // 'bell.mp3' must be in your public folder.
    const waveBell = new Bell('wave-bell', 'bell.mp3');

    // --- SECTION: RECEIVING A WAVE ---
    WA.event.on('wave-event').subscribe((event) => {
        try {
            const data = event.data as any;
            const sender = data.senderName;
            const targetX = data.senderX;
            const targetY = data.senderY;
            const isResponse = data.isResponse;

            // 1. RING THE BELL (The Mac-Friendly Fix)
            // This uses the scripting-extra logic to play the sound.
            waveBell.ring();

            // 2. DESKTOP NOTIFICATION
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification(isResponse ? "Wave Back" : "New Wave", {
                    body: isResponse ? `${sender} waved back! 👋` : `${sender} is waving at you!`,
                    tag: "wa-wave"
                });
            }

            // 3. VISUAL BANNER
            const waveNotice = WA.ui.displayActionMessage({
                message: isResponse ? `👋 ${sender} waved back!` : `👋 ${sender} is waving! (Click for options)`,
                type: "message",
                callback: () => {
                    if (!isResponse) {
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
                    } else {
                        waveNotice.remove();
                    }
                }
            });
            setTimeout(() => { waveNotice.remove(); }, 60000);

        } catch (err) {
            console.error(`${LOG_PREFIX} Error:`, err);
        }
    });

    // --- SECTION: SENDING A WAVE ---
    WA.ui.onRemotePlayerClicked.subscribe((remotePlayer) => {
        remotePlayer.addAction('Wave 👋', async () => {
            const myPosition = await WA.player.getPosition();
            WA.event.broadcast('wave-event', {
                senderName: WA.player.name,
                senderX: myPosition.x,
                senderY: myPosition.y,
                isResponse: false
            });
        });
    });

}).catch(err => console.error(`${LOG_PREFIX} Init error:`, err));

export {};