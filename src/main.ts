/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

const SCRIPT_VERSION = "1.0.6"; 
const LOG_PREFIX = "[WA-OFFICE]"; 

console.log(`${LOG_PREFIX} Script Loading: v${SCRIPT_VERSION}`);

WA.onInit().then(async () => {
    console.log(`${LOG_PREFIX} Scripting API fully ready (v${SCRIPT_VERSION})`);

    // Request permission for Desktop Notifications as soon as the map loads
    if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
    }

    try {
        await WA.players.configureTracking();
    } catch (e) {
        console.error(`${LOG_PREFIX} Tracking failed:`, e);
    }

    // --- SECTION: SENDING A WAVE ---
    WA.ui.onRemotePlayerClicked.subscribe((remotePlayer) => {
        remotePlayer.addAction('Wave 👋', async () => {
            const myPosition = await WA.player.getPosition();
            remotePlayer.sendEvent('wave-event', {
                senderName: WA.player.name,
                senderX: myPosition.x,
                senderY: myPosition.y
            });
            WA.chat.sendChatMessage(`You waved at ${remotePlayer.name}`, "System");
        });
    });

    // --- SECTION: RECEIVING A WAVE ---
    WA.event.on('wave-event').subscribe((event) => {
        console.log(`${LOG_PREFIX} Wave event received!`);
        
        try {
            const data = event.data as any;
            const sender = data.senderName;
            const targetX = data.senderX;
            const targetY = data.senderY;

            // 1. Play a Notification Sound (Uses a standard system beep)
            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
            audio.play().catch(e => console.log(`${LOG_PREFIX} Audio blocked by browser policy.`));

            // 2. Desktop Notification (Works even if the tab is hidden)
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification("WorkAdventure", {
                    body: `${sender} is waving at you!`,
                    icon: "https://workadventu.re/favicon.ico" 
                });
            }

            // 3. In-game Banner
            const waveNotice = WA.ui.displayActionMessage({
                message: `${sender} is waving! Click to walk to them.`,
                type: "message",
                callback: async () => {
                    WA.player.moveTo(targetX, targetY);
                    waveNotice.remove();
                }
            });

            setTimeout(() => { waveNotice.remove(); }, 20000);

        } catch (err) {
            console.error(`${LOG_PREFIX} Error handling wave:`, err);
        }
    });

    bootstrapExtra().then(() => {
        console.log(`${LOG_PREFIX} Scripting API Extra ready`);
    }).catch(e => console.error(`${LOG_PREFIX} Extra Library error:`, e));

}).catch(e => console.error(`${LOG_PREFIX} Initialization error:`, e));

export {};