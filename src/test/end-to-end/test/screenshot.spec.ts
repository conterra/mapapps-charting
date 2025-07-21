///
/// Copyright (C) 2023 con terra GmbH (info@conterra.de)
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///         http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

import { test } from '@playwright/test';

import { expectToMatchScreenshot } from './common/testUtils';
import { MapCanvas } from "./components/map-canvas";
import { SelectionUi } from './components/selection-ui';

// test used to generate a screenshot for the bundle documentation
test('Create Screenshot for GitHub Page', async ({ page }) => {
    await page.goto('http://localhost:9090/');
    await page.getByRole("button", { name: "Spatial Selection" }).click();

    const selectionUi = new SelectionUi(page);
    await selectionUi.selectType("rectangle");

    const canvas = new MapCanvas(page);
    await canvas.loaded();
    await canvas.drawRectangle({ top: 50, left: 50, width: 1050, height: 1050 });

    await expectToMatchScreenshot(page, "screenshot.png", {
        timeout: 10000
    });
});
