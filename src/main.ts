/// <reference types="@workadventure/iframe-api-typings" />

const SCRIPT_VERSION = "2.0.4"; 
const LOG_PREFIX = "[WA-WAVE]"; 

console.log(`${LOG_PREFIX} >>> SCRIPT LOADING: v${SCRIPT_VERSION} <<<`);

WA.onInit().then(() => {
    console.log(`${LOG_PREFIX} WA.onInit SUCCESS`);

    // 1. REQUEST PERMISSION
    // We do this immediately. On Mac, the user may need to click the map once 
    // for the browser to actually show the "Allow Notifications" prompt.
    if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
    }

    // --- RECEIVING LOGIC ---
    WA.event.on('wave-event').subscribe((event: any) => {
        const data = event.data;
        
        // PRIVACY FILTER: Only trigger if the wave is for ME
        if (data.targetId !== WA.player.id) return;

        console.log(`${LOG_PREFIX} Wave received for me from: ${data.senderName}`);

        // A. DESKTOP NOTIFICATION
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Office Wave", {
                body: `${data.senderName} is waving at you!`,
                icon: 'https://workadventu.re/favicon.ico', // Optional: adds an icon
                tag: "wa-wave" 
            });
        }

        // B. VISUAL BANNER (Interactive)
        const waveNotice = WA.ui.displayActionMessage({
            message: `👋 ${data.senderName} is waving! (Click to Join)`,
            type: "message",
            callback: () => {
                WA.player.moveTo(data.senderX, data.senderY);
                waveNotice.remove();
            }
        });
        setTimeout(() => { waveNotice.remove(); }, 20000);
    });

    // --- SENDING LOGIC ---
    WA.ui.onRemotePlayerClicked.subscribe((remotePlayer: any) => {
        remotePlayer.addAction('Wave 👋', async () => {
            const myPosition = await WA.player.getPosition();
            
            console.log(`${LOG_PREFIX} Sending wave to: ${remotePlayer.id}`);

            // Broadcast the data
            WA.event.broadcast('wave-event', {
                targetId: remotePlayer.id,
                senderName: WA.player.name,
                senderX: myPosition.x,
                senderY: myPosition.y
            });

            // Local confirmation for the sender
            WA.chat.sendChatMessage(`You waved at ${remotePlayer.name}`, "System");
        });
    });

}).catch(err => console.error(`${LOG_PREFIX} CRITICAL INIT ERROR:`, err));

export {};