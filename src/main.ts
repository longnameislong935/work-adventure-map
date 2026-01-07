/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

console.log('Script started successfully');

let currentPopup: any = undefined;

// Waiting for the API to be ready
WA.onInit().then(() => {
    console.log('Scripting API ready');
    console.log('Player tags: ', WA.player.tags);

    // Existing Clock Logic
    WA.room.area.onEnter('clock').subscribe(() => {
        const today = new Date();
        const time = today.getHours() + ":" + (today.getMinutes() < 10 ? '0' : '') + today.getMinutes();
        console.log('Clock area entered at: ' + time);
        currentPopup = WA.ui.openPopup("clockPopup", "It's " + time, []);
    });

    WA.room.area.onLeave('clock').subscribe(closePopup);

    // Bootstrap the Scripting API Extra library
    bootstrapExtra().then(() => {
        console.log("Testing bell variable existence:", (WA.state.getVariable('bell') as any));
        console.log('Scripting API Extra ready');

        // --- BELL LOGIC START ---
        // This listens for the 'bell' variable you set in Tiled
        WA.state.onVariableChange('bell').subscribe((value) => {
            console.log('Bell variable changed to:', value);

            if (value === true) {
                console.log('Ringing the bell...');

                // Opens a popup. "bellMessage" refers to the name of the rectangle in Tiled.
                currentPopup = WA.ui.openPopup("bellMessage", "Ding Dong! Someone is at the door.", [
                    {
                        label: "Close",
                        className: "success",
                        callback: (popup) => {
                            popup.close();
                            currentPopup = undefined;
                        }
                    }
                ]);

                // Auto-reset the variable to false after 3 seconds so it can be pressed again
                setTimeout(() => {
                    console.log('Resetting bell variable to false');
                    WA.state.saveVariable('bell', false);
                }, 3000);
            }
        });
        // --- BELL LOGIC END ---

    }).catch(e => console.error('Error bootstrapping Extra:', e));

}).catch(e => console.error('WA.onInit Error:', e));

function closePopup() {
    if (currentPopup !== undefined) {
        currentPopup.close();
        currentPopup = undefined;
    }
}

export {};