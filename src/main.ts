/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

const SCRIPT_VERSION = "1.7.1"; 
const LOG_PREFIX = "[WA-WAVE]"; 

WA.onInit().then(async () => {
    console.log(`${LOG_PREFIX} Script Loading: v${SCRIPT_VERSION}`);

    // --- 1. THE PERMISSIONS FIXER ---
    // This banner stays until the user clicks it, "unlocking" audio/notifications for the session.
    const unlockBanner = WA.ui.displayActionMessage({
        message: "Click here to enable Wave Notifications & Sound",
        type: "message",
        callback: () => {
            // This is a "User Gesture" - Browsers now trust the script
            if ("Notification" in window) {
                Notification.requestPermission().then(permission => {
                    WA.chat.sendChatMessage(`Notifications: ${permission}`, "System");
                });
            }
            // Play a silent "blip" to unlock the audio engine
            try { WA.sound.loadSound("message").play({volume: 0.1}); } catch(e){}
            unlockBanner.remove();
        }
    });

    // --- 2. THE LISTENER ---
    WA.event.on('wave-event').subscribe((event) => {
        const data = event.data as any;
        const sender = data.senderName;

        // A. Desktop Notification
        if ("Notification" in window && Notification.permission === "granted") {
            try {
                new Notification(`Wave from ${sender}`, {
                    body: `${sender} is waving at you!`,
                    tag: "wa-wave"
                });
            } catch (err) {
                console.error("Desktop Notification failed:", err);
            }
        }

        // B. Audio (Using native WA sound)
        try {
            WA.sound.loadSound("message").play({volume: 0.8, loop: false});
        } catch(e) {
            console.warn("Audio failed - still needs user gesture");
        }

        // C. Visual Banner
        const waveNotice = WA.ui.displayActionMessage({
            message: `👋 ${sender} is waving! Click to join.`,
            type: "warning",
            callback: () => {
                WA.player.moveTo(data.senderX, data.senderY);
                waveNotice.remove();
            }
        });
        setTimeout(() => { waveNotice.remove(); }, 30000);
    });

    // --- 3. THE SENDER ---
    WA.ui.onRemotePlayerClicked.subscribe((remotePlayer) => {
        remotePlayer.addAction('Wave 👋', async () => {
            const myPosition = await WA.player.getPosition();
            WA.event.broadcast('wave-event', {
                senderName: WA.player.name,
                senderX: myPosition.x,
                senderY: myPosition.y
            });
        });
    });

    bootstrapExtra();

}).catch(err => console.error(`${LOG_PREFIX} Init error:`, err));

export {};