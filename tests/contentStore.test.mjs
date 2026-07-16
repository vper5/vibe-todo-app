import assert from 'node:assert/strict';
import test from 'node:test';
import { deleteItem, loadContent, saveContent, upsertItem, STORAGE_KEY } from '../src/contentStore.js';

function createStorage() {
  const store = new Map();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
  };
}

test('saves and loads portal content', () => {
  const storage = createStorage();
  const content = { photos: [], videos: [], messages: [], textBlocks: [] };
  saveContent(content, storage);
  assert.equal(storage.getItem(STORAGE_KEY), JSON.stringify(content));
  assert.deepEqual(loadContent(storage), content);
});

test('upserts and deletes section items', () => {
  const content = { photos: [{ id: '1', title: 'Old' }], videos: [], messages: [], textBlocks: [] };
  const updated = upsertItem(content, 'photos', { id: '1', title: 'New' });
  assert.equal(updated.photos[0].title, 'New');

  const added = upsertItem(updated, 'photos', { id: '2', title: 'Second' });
  assert.equal(added.photos.length, 2);

  const removed = deleteItem(added, 'photos', '1');
  assert.deepEqual(removed.photos, [{ id: '2', title: 'Second' }]);
});
