/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";

console.log('Script started successfully');

// Initialize Extra features immediately at the top level
bootstrapExtra().then(() => {
    console.log('Scripting API Extra ready');
}).catch(e => console.error('Extra bootstrap failed:', e));

let currentPopup: any = undefined;

// Waiting for the API to be ready
WA.onInit().then(() => {
    console.log('Scripting API ready');
    console.log('Player tags: ', WA.player.tags);

    // Clock Feature
    WA.room.area.onEnter('clock').subscribe(() => {
        const today = new Date();
        const minutes = today.getMinutes().toString().padStart(2, '0');
        const time = today.getHours() + ":" + minutes;
        currentPopup = WA.ui.openPopup("clockPopup", "It's " + time, []);
    });

    WA.room.area.onLeave('clock').subscribe(closePopup);

}).catch(e => console.error('WA.onInit failed:', e));

function closePopup() {
    if (currentPopup !== undefined) {
        currentPopup.close();
        currentPopup = undefined;
    }
}

export {};