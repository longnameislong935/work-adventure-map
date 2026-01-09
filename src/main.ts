/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

console.log('Script started successfully');

let currentPopup: any = undefined;

WA.onInit().then(async () => {
    console.log('Scripting API ready');

    // Required to see other players and interact with them
    await WA.players.configureTracking();

    // --- CLOCK LOGIC ---
    WA.room.area.onEnter('clock').subscribe(() => {
        const today = new Date();
        const time = today.getHours() + ":" + today.getMinutes().toString().padStart(2, '0');
        currentPopup = WA.ui.openPopup("clockPopup", "It's " + time, []);
    })

    WA.room.area.onLeave('clock').subscribe(closePopup)

    // --- WAVE & JOIN LOGIC ---

    // 1. Add the "Wave" button to the menu
    WA.ui.onRemotePlayerClicked.subscribe((remotePlayer) => {
        remotePlayer.addAction('Wave 👋', async () => {
            // Get your current position to send to the other player
            const myPosition = await WA.player.getPosition();

            remotePlayer.sendEvent('wave-event', {
                senderName: WA.player.name,
                senderX: myPosition.x,
                senderY: myPosition.y
            });
            WA.chat.sendChatMessage(`You waved at ${remotePlayer.name}`, "System");
        });
    });

    // 2. Listen for the wave and show "Wave Back" or "Join"
    WA.event.on('wave-event').subscribe((event) => {
        const sender = event.data.senderName;
        const targetX = event.data.senderX;
        const targetY = event.data.senderY;

        WA.ui.openPopup("clockPopup", `${sender} is waving at you!`, [
            {
                label: "Join",
                className: "primary", // Usually blue/prominent
                callback: (popup) => {
                    // This makes your character walk to the sender
                    WA.player.moveTo(targetX, targetY);
                    popup.close();
                }
            },
            {
                label: "Wave Back",
                className: "success",
                callback: (popup) => {
                    WA.chat.sendChatMessage(`You waved back at ${sender}!`);
                    popup.close();
                }
            },
            {
                label: "Close",
                className: "normal",
                callback: (popup) => {
                    popup.close();
                }
            }
        ]);
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