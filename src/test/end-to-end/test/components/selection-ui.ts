/*
 * Copyright (C) con terra GmbH
 */

import { Page } from "@playwright/test";


export class SelectionUi {
    readonly page: Page;
    constructor(page: Page) {
        this.page = page;
    }
    async selectType(type: "rectangle" | "mapExtent"): Promise<void> {
        const selectionLabel =
            type === "rectangle" ? "Rectangle" : "Kartenausschnitt";
        const selectionButton = this.page.getByRole("button", {
            name: selectionLabel,
            exact: true
        });
        const isPressed =
            (await selectionButton.getAttribute("aria-pressed")) === "true";

        if (!isPressed) {
            await selectionButton.click();
            const isPressed =
                (await selectionButton.getAttribute("aria-pressed")) === "true";
            if (!isPressed) {
                throw new Error("Failed to start spatial selection");
            }
        }
    }

    async executeSelection(): Promise<void> {
        await this.page.getByLabel("Auswahl ausführen").click();
    }
}
