const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_FILE = path.join(__dirname, '..', 'data', 'items.json');
const SEED_FILE = path.join(__dirname, '..', 'data', 'seed.json');

function ensureDataFile() {
  if (fs.existsSync(DATA_FILE)) return;

  const seed = fs.existsSync(SEED_FILE)
    ? JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'))
    : [];
  const withIds = seed.map((item) => ({ id: crypto.randomUUID(), ...item }));
  fs.writeFileSync(DATA_FILE, JSON.stringify(withIds, null, 2));
}

function readItems() {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeItems(items) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2));
}

function addItem(item) {
  const items = readItems();
  const newItem = { id: crypto.randomUUID(), ...item };
  items.push(newItem);
  writeItems(items);
  return newItem;
}

function deleteItem(id) {
  const items = readItems();
  const filtered = items.filter((item) => item.id !== id);
  const removed = filtered.length !== items.length;
  writeItems(filtered);
  return removed;
}

module.exports = { readItems, writeItems, addItem, deleteItem };
