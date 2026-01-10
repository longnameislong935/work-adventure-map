/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

const SCRIPT_VERSION = "3.6.0"; 
const LOG_PREFIX = "[WA-WAVE]"; 

const waveSound = WA.sound.loadSound("bell.mp3");

WA.onInit().then(async () => {
    console.log(`${LOG_PREFIX} v${SCRIPT_VERSION} Native Menu Integration`);

    const unlockAudio = () => {
        try { waveSound.play({ volume: 0 }); } catch (err) {}
        window.removeEventListener('click', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);

    // --- RECEIVING A WAVE ---
    WA.event.on('wave-event').subscribe((event: any) => {
        const data = event.data;
        if (!data || data.senderId === WA.player.id) return; 
        if (!data.targetId || data.targetId !== WA.player.id) return;

        // 1. Play Sound
        try { waveSound.play({ volume: 0.7 }); } catch (err) {}

        // 2. OS Notification
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Office Wave", { body: `${data.senderName} is waving!` });
        }

        // 3. OPEN THE NATIVE MENU
        // This opens the menu OF the sender ON the receiver's screen.
        // The receiver can then click 'Talk' or 'Wave back' directly.
        WA.ui.openRemotePlayerMenu(data.senderId);

        // 4. Visual Hint (Optional)
        const hint = WA.ui.displayActionMessage({
            message: `👋 ${data.senderName} is waving! Menu opened.`,
            type: "message",
            callback: () => { hint.remove(); }
        });
        setTimeout(() => { hint.remove(); }, 10000);
    });

    // --- SENDING A WAVE ---
    // This is the function you provided, slightly tuned for the receiver's menu
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