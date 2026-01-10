/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

const SCRIPT_VERSION = "2.0.1"; 
const LOG_PREFIX = "[WA-WAVE]"; 

// Pre-load the sound as a WA Sound Object based on the API docs
const waveSound = WA.sound.loadSound("bell.mp3");

WA.onInit().then(async () => {
    console.log(`${LOG_PREFIX} Script Loading: v${SCRIPT_VERSION}`);

    if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
    }

    // --- RECEIVING A WAVE ---
    WA.event.on('wave-event').subscribe((event: any) => {
        try {
            const data = event.data;
            
            // Privacy Filter
            if (data.targetId !== WA.player.id) return;

            const sender = data.senderName;

            // 1. PLAY NATIVE SOUND (Using the class methods from your docs)
            try {
                waveSound.play({
                    volume: 0.8,
                    loop: false,
                    mute: false
                });
            } catch (soundErr) {
                console.error(`${LOG_PREFIX} WA Sound Engine error:`, soundErr);
            }

            // 2. DESKTOP NOTIFICATION
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification("New Wave", {
                    body: `${sender} is waving at you!`,
                    tag: "wa-wave"
                });
            }

            // 3. VISUAL BANNER
            const waveNotice = WA.ui.displayActionMessage({
                message: `👋 ${sender} is waving! (Click to Join)`,
                type: "message",
                callback: () => {
                    WA.player.moveTo(data.senderX, data.senderY);
                    waveNotice.remove();
                }
            });
            setTimeout(() => { waveNotice.remove(); }, 30000);

        } catch (err) {
            console.error(`${LOG_PREFIX} Error:`, err);
        }
    });

    // --- SENDING A WAVE ---
    WA.ui.onRemotePlayerClicked.subscribe((remotePlayer: any) => {
        remotePlayer.addAction('Wave 👋', async () => {
            const myPosition = await WA.player.getPosition();
            
            WA.event.broadcast('wave-event', {
                targetId: remotePlayer.id,
                senderName: WA.player.name,
                senderX: myPosition.x,
                senderY: myPosition.y
            });
            
            WA.chat.sendChatMessage(`You waved at ${remotePlayer.name}`, "System");
        });
    });

    bootstrapExtra();

}).catch(err => console.error(`${LOG_PREFIX} Init error:`, err));

export {};