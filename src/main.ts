/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

console.log('Script started successfully');

let currentPopup: any = undefined;

WA.onInit().then(async () => {
    console.log('Scripting API ready');

    // This allows players to track each other for the Wave menu
    await WA.players.configureTracking();

    // --- SECTION 1: THE CLOCK ---
    WA.room.area.onEnter('clock').subscribe(() => {
        const today = new Date();
        const time = today.getHours() + ":" + today.getMinutes().toString().padStart(2, '0');
        currentPopup = WA.ui.openPopup("clockPopup", "It's " + time, []);
    })

    WA.room.area.onLeave('clock').subscribe(closePopup)

    // --- SECTION 2: SENDING A WAVE ---
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

    // --- SECTION 3: RECEIVING A WAVE ---
    WA.event.on('wave-event').subscribe((event) => {
        const data = event.data as any;
        const sender = data.senderName;
        const targetX = data.senderX;
        const targetY = data.senderY;

        // Creating a popup notification with options
        const waveNotice = WA.ui.openPopup("clockPopup", `${sender} is waving at you!`, [
            {
                label: "Join",
                className: "primary",
                callback: (popup) => {
                    WA.player.moveTo(targetX, targetY);
                    popup.close();
                }
            },
            {
                label: "Wave Back",
                className: "success",
                callback: (popup) => {
                    WA.chat.sendChatMessage(`You waved back at ${sender}! 👋`);
                    popup.close();
                }
            }
        ]);

        // Auto-close the notification after 15 seconds if ignored
        setTimeout(() => {
            waveNotice.close();
        }, 15000);
    });

    bootstrapExtra().then(() => {
        console.log('Scripting API Extra ready');
    }).catch(e => console.error(e));

}).catch(e => console.error(e));

function closePopup(){
    if (currentPopup !== undefined) {
        currentPopup.close();
        currentPopup = undefined;
    }
}

export {};