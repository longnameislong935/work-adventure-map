/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

const SCRIPT_VERSION = "3.3.1"; 
const LOG_PREFIX = "[WA-WAVE]"; 

// 1. WEB-BASED AUDIO
const EXTERNAL_SOUND_URL = "https://actions.google.com/sounds/v1/alarms/beep_short.ogg";
console.log(`${LOG_PREFIX} Loading audio from: ${EXTERNAL_SOUND_URL}`);

// We load it here, but we don't call .catch on the result of the load, 
// we only catch errors on the .play() call later.
const waveSound = WA.sound.loadSound(EXTERNAL_SOUND_URL);

WA.onInit().then(async () => {
    console.log(`${LOG_PREFIX} v${SCRIPT_VERSION} Script Initialized`);

    // --- AUDIO UNLOCKER ---
    const unlockAudio = () => {
        console.log(`${LOG_PREFIX} User clicked. Attempting to prime audio engine...`);
        try {
            // We play at near-zero volume to "wake up" the browser's audio context
            waveSound.play({ volume: 0.01 });
        } catch (err) {
            console.warn(`${LOG_PREFIX} Prime failed:`, err);
        }
        window.removeEventListener('click', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);

    // --- RECEIVING A WAVE ---
    WA.event.on('wave-event').subscribe((event: any) => {
        try {
            const data = event.data;
            console.log(`${LOG_PREFIX} Event detected:`, data);

            // 1. SENDER SILENCE
            if (data.senderId === WA.player.id) {
                return; 
            }

            // 2. PRIVACY FILTER
            if (data.targetId && data.targetId !== WA.player.id) {
                console.log(`${LOG_PREFIX} Wave for ${data.targetId}, ignoring.`);
                return;
            }

            console.log(`${LOG_PREFIX} MATCH FOUND! Processing...`);

            // 3. PLAY SOUND (Native WA Class)
            try {
                waveSound.play({ volume: 0.8, loop: false });
                console.log(`${LOG_PREFIX} Play command executed.`);
            } catch (soundErr) {
                console.error(`${LOG_PREFIX} Play failed:`, soundErr);
            }

            // 4. DESKTOP NOTIFICATION
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification("Office Wave", { body: `${data.senderName} is waving!` });
            }

            // 5. VISUAL BANNER
            WA.ui.displayActionMessage({
                message: `👋 ${data.senderName} is waving!`,
                type: "message",
                callback: () => { 
                    if (data.senderX && data.senderY) {
                        WA.player.moveTo(data.senderX, data.senderY);
                    }
                }
            });

        } catch (err) {
            console.error(`${LOG_PREFIX} Fatal Error:`, err);
        }
    });

    // --- SENDING A WAVE ---
    WA.ui.onRemotePlayerClicked.subscribe((remotePlayer: any) => {
        remotePlayer.addAction('Wave 👋', async () => {
            const myPosition = await WA.player.getPosition();
            
            console.log(`${LOG_PREFIX} Waving at ${remotePlayer.name}`);

            WA.event.broadcast('wave-event', {
                senderId: WA.player.id, 
                senderName: WA.player.name,
                senderX: myPosition.x,
                senderY: myPosition.y,
                targetId: remotePlayer.id
            });

            WA.chat.sendChatMessage(`Wave sent to ${remotePlayer.name}`, "System");
        });
    });

    bootstrapExtra().catch((e: any) => console.error("Extra error", e));
});

export {};