/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

const SCRIPT_VERSION = "3.9.0"; 
const LOG_PREFIX = "[WA-WAVE]"; 

const waveSound = WA.sound.loadSound("bell.mp3");

WA.onInit().then(async () => {
    console.log(`${LOG_PREFIX} v${SCRIPT_VERSION} Mobile-Friendly UI`);

    // Audio Unlocker
    const unlockAudio = () => {
        try { waveSound.play({ volume: 0 }); } catch (err) {}
        window.removeEventListener('click', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);

    // --- RECEIVING A WAVE ---
    WA.event.on('wave-event').subscribe((event: any) => {
        const data = event.data;
        if (!data || data.senderId === WA.player.id || data.targetId !== WA.player.id) return;

        // 1. Play Sound
        try { waveSound.play({ volume: 0.7 }); } catch (err) {}

        // 2. The "Question" Banner
        const questionNotice = WA.ui.displayActionMessage({
            message: `👋 ${data.senderName} is waving! Click here to JOIN them.`,
            type: "message",
            callback: () => {
                // ACTION: User clicked YES (the banner itself)
                WA.player.moveTo(data.senderX, data.senderY);
                
                // Send automated Wave Back
                WA.event.broadcast('wave-event', {
                    senderId: WA.player.id,
                    senderName: WA.player.name,
                    targetId: data.senderId,
                    isResponse: true
                });
                questionNotice.remove();
            }
        });

        // 3. The "Dismiss" Banner (Optional second banner to act as the 'NO' button)
        const dismissNotice = WA.ui.displayActionMessage({
            message: `(Or click here to dismiss)`,
            type: "warning",
            callback: () => {
                questionNotice.remove();
                dismissNotice.remove();
            }
        });

        // Auto-clean after 20 seconds
        setTimeout(() => { 
            questionNotice.remove(); 
            dismissNotice.remove();
        }, 20000);
    });

    // --- SENDING A WAVE ---
    WA.ui.onRemotePlayerClicked.subscribe((remotePlayer: any) => {
        remotePlayer.addAction('Wave 👋', async () => {
            const myPosition = await WA.player.getPosition();
            const recipientId = remotePlayer.id || remotePlayer.uuid;

            WA.event.broadcast('wave-event', {
                senderId: WA.player.id, 
                senderName: WA.player.name,
                senderX: myPosition.x,
                senderY: myPosition.y,
                targetId: recipientId,
                isResponse: false
            });
            WA.chat.sendChatMessage(`You waved at ${remotePlayer.name}`, "System");
        });
    });

    bootstrapExtra().catch(() => {});
});

export {};