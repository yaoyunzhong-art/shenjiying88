import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createFoundationAlertMockRecords,
  foundationAlertDetailDemoPresets,
  foundationAlertListDemoPresets,
} from './FoundationAlertViews';

test('foundation alert demo presets: storefront detail ids align with generated list ids', () => {
  const records = createFoundationAlertMockRecords({
    count: 3,
    titles: foundationAlertListDemoPresets.storefront.titles,
    severityOrder: foundationAlertListDemoPresets.storefront.severityOrder,
    statusOrder: foundationAlertListDemoPresets.storefront.statusOrder,
    sourceOrder: foundationAlertListDemoPresets.storefront.sourceOrder,
  });

  assert.ok(foundationAlertDetailDemoPresets.storefront[records[0]!.id]);
  assert.ok(foundationAlertDetailDemoPresets.storefront[records[1]!.id]);
});

test('foundation alert demo presets: tob detail ids align with generated list ids', () => {
  const records = createFoundationAlertMockRecords({
    count: 2,
    titles: foundationAlertListDemoPresets.tob.titles,
    severityOrder: foundationAlertListDemoPresets.tob.severityOrder,
    statusOrder: foundationAlertListDemoPresets.tob.statusOrder,
    sourceOrder: foundationAlertListDemoPresets.tob.sourceOrder,
  });

  assert.ok(foundationAlertDetailDemoPresets.tob[records[0]!.id]);
  assert.ok(foundationAlertDetailDemoPresets.tob[records[1]!.id]);
});
