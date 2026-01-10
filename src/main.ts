/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

const SCRIPT_VERSION = "3.3.0"; 
const LOG_PREFIX = "[WA-WAVE]"; 

// 1. WEB-BASED AUDIO (Using a reliable public notification sound)
const EXTERNAL_SOUND_URL = "https://actions.google.com/sounds/v1/alarms/beep_short.ogg";
console.log(`${LOG_PREFIX} Loading audio from: ${EXTERNAL_SOUND_URL}`);
const waveSound = WA.sound.loadSound(EXTERNAL_SOUND_URL);

WA.onInit().then(async () => {
    console.log(`${LOG_PREFIX} v${SCRIPT_VERSION} Script Initialized`);

    // --- AUDIO UNLOCKER ---
    const unlockAudio = () => {
        console.log(`${LOG_PREFIX} User clicked. Attempting to prime audio engine...`);
        waveSound.play({ volume: 0.01 }).catch(e => console.warn(`${LOG_PREFIX} Prime failed:`, e));
        window.removeEventListener('click', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);

    // --- RECEIVING A WAVE ---
    WA.event.on('wave-event').subscribe((event: any) => {
        try {
            const data = event.data;
            console.log(`${LOG_PREFIX} New event detected in room:`, data);

            // 1. SENDER SILENCE
            if (data.senderId === WA.player.id) {
                console.log(`${LOG_PREFIX} Ignoring: I am the sender.`);
                return; 
            }

            // 2. PRIVACY FILTER
            if (data.targetId && data.targetId !== WA.player.id) {
                console.log(`${LOG_PREFIX} Ignoring: Wave is for ${data.targetId}, not me (${WA.player.id}).`);
                return;
            }

            console.log(`${LOG_PREFIX} MATCH FOUND! Triggering notification and sound.`);

            // 3. PLAY SOUND (WA CLASS)
            console.log(`${LOG_PREFIX} Attempting WA.sound.play()...`);
            try {
                waveSound.play({ volume: 0.8, loop: false });
                console.log(`${LOG_PREFIX} Play command sent to engine.`);
            } catch (err) {
                console.error(`${LOG_PREFIX} WA Sound Engine crashed:`, err);
            }

            // 4. DESKTOP NOTIFICATION
            if ("Notification" in window && Notification.permission === "granted") {
                console.log(`${LOG_PREFIX} Triggering Desktop Notification.`);
                new Notification("Office Wave", { body: `${data.senderName} is waving!` });
            } else {
                console.warn(`${LOG_PREFIX} Notification skipped (Permission: ${Notification.permission})`);
            }

            // 5. VISUAL BANNER
            WA.ui.displayActionMessage({
                message: `👋 ${data.senderName} is waving!`,
                type: "message",
                callback: () => { WA.player.moveTo(data.senderX, data.senderY); }
            });

        } catch (err) {
            console.error(`${LOG_PREFIX} Fatal Error in Receive Loop:`, err);
        }
    });

    // --- SENDING A WAVE ---
    WA.ui.onRemotePlayerClicked.subscribe((remotePlayer: any) => {
        remotePlayer.addAction('Wave 👋', async () => {
            const myPosition = await WA.player.getPosition();
            
            console.log(`${LOG_PREFIX} Waving at ${remotePlayer.name} (ID: ${remotePlayer.id})`);

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

    bootstrapExtra().catch(() => {});
});

export {};