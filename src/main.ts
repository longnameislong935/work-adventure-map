/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

const SCRIPT_VERSION = "4.0.0"; 
const LOG_PREFIX = "[WA-WAVE]"; 

const waveSound = WA.sound.loadSound("bell.mp3");

WA.onInit().then(async () => {
    console.log(`${LOG_PREFIX} v${SCRIPT_VERSION} Banner Mode Active`);

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
        try { waveSound.play({ volume: 0.8 }); } catch (err) {}

        // 2. Open the Top Banner (Persistent & Highly Visible)
        WA.ui.banner.openBanner({
            id: "wave-banner",
            text: `👋 ${data.senderName} is waving at you!`,
            bgColor: "#1b263b",
            textColor: "#ffffff",
            closable: true,
            timeToClose: 10000 // Closes automatically after 10 seconds
        });

        // 3. The Clickable "Join" Action (Bottom of screen)
        const joinAction = WA.ui.displayActionMessage({
            message: `Click to Join ${data.senderName} 🚶`,
            type: "message",
            callback: () => {
                WA.player.moveTo(data.senderX, data.senderY);
                
                // Response event
                WA.event.broadcast('wave-event', {
                    senderId: WA.player.id,
                    senderName: WA.player.name,
                    targetId: data.senderId,
                    isResponse: true
                });

                joinAction.remove();
                WA.ui.banner.closeBanner();
            }
        });

        setTimeout(() => { joinAction.remove(); }, 10000);
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