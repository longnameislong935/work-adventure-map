/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

const SCRIPT_VERSION = "3.9.1"; 
const LOG_PREFIX = "[WA-WAVE]"; 

const waveSound = WA.sound.loadSound("bell.mp3");

WA.onInit().then(async () => {
    console.log(`${LOG_PREFIX} v${SCRIPT_VERSION} Single Banner UI`);

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

        // 2. The Single Action Banner
        // This is the most reliable UI element for mobile/moving players.
        const waveNotice = WA.ui.displayActionMessage({
            message: `👋 ${data.senderName} is waving! Click here to JOIN them.`,
            type: "message",
            callback: () => {
                // ACTION: Join the person
                WA.player.moveTo(data.senderX, data.senderY);
                
                // Send automated Wave Back
                WA.event.broadcast('wave-event', {
                    senderId: WA.player.id,
                    senderName: WA.player.name,
                    targetId: data.senderId,
                    isResponse: true
                });
                waveNotice.remove();
            }
        });

        // Auto-remove after 15 seconds to keep the screen clear
        setTimeout(() => { 
            try { waveNotice.remove(); } catch(e) {}
        }, 15000);
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