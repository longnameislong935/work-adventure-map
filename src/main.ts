/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

const SCRIPT_VERSION = "3.4.0"; 
const LOG_PREFIX = "[WA-WAVE]"; 

// WEB-BASED AUDIO
const EXTERNAL_SOUND_URL = "https://actions.google.com/sounds/v1/alarms/beep_short.ogg";
const waveSound = WA.sound.loadSound(EXTERNAL_SOUND_URL);

WA.onInit().then(async () => {
    console.log(`${LOG_PREFIX} v${SCRIPT_VERSION} Initialized. My ID: ${WA.player.id}`);

    const unlockAudio = () => {
        try { waveSound.play({ volume: 0.01 }); } catch (err) {}
        window.removeEventListener('click', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);

    // --- RECEIVING A WAVE ---
    WA.event.on('wave-event').subscribe((event: any) => {
        try {
            const data = event.data;
            
            // 1. SENDER SILENCE
            if (data.senderId === WA.player.id) return; 

            // 2. STRICT PRIVACY FILTER
            // We now require a targetId. If it doesn't match ME, we stop.
            if (!data.targetId || data.targetId !== WA.player.id) {
                console.log(`${LOG_PREFIX} Wave ignored. Target: ${data.targetId}, Me: ${WA.player.id}`);
                return;
            }

            console.log(`${LOG_PREFIX} PRIVATE MATCH! Playing sound for ${WA.player.name}`);

            // 3. PLAY SOUND (Native WA Class)
            try {
                waveSound.play({ volume: 0.8, loop: false });
            } catch (soundErr) {
                console.error(`${LOG_PREFIX} Sound failed:`, soundErr);
            }

            // 4. DESKTOP NOTIFICATION
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification("Private Wave", { body: `${data.senderName} is waving at you!` });
            }

            // 5. VISUAL BANNER
            WA.ui.displayActionMessage({
                message: `👋 ${data.senderName} is waving!`,
                type: "message",
                callback: () => { WA.player.moveTo(data.senderX, data.senderY); }
            });

        } catch (err) {
            console.error(`${LOG_PREFIX} Error:`, err);
        }
    });

    // --- SENDING A WAVE ---
    WA.ui.onRemotePlayerClicked.subscribe((remotePlayer: any) => {
        remotePlayer.addAction('Wave 👋', async () => {
            const myPosition = await WA.player.getPosition();
            
            // Identify the recipient ID (Checking both common API properties)
            const recipientId = remotePlayer.id || remotePlayer.uuid;

            console.log(`${LOG_PREFIX} Sending wave to: ${recipientId}`);

            WA.event.broadcast('wave-event', {
                senderId: WA.player.id, 
                senderName: WA.player.name,
                senderX: myPosition.x,
                senderY: myPosition.y,
                targetId: recipientId // THIS WAS MISSING/UNDEFINED
            });

            WA.chat.sendChatMessage(`Wave sent to ${remotePlayer.name}`, "System");
        });
    });

    bootstrapExtra().catch(() => {});
});

export {};