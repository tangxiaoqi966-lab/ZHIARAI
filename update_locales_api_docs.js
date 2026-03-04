
const fs = require('fs');
const path = require('path');

const enPath = path.join(process.cwd(), 'supabase/apps/studio/locales/en/common.json');
const zhPath = path.join(process.cwd(), 'supabase/apps/studio/locales/zh-CN/common.json');

function updateLocales() {
  const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const zh = JSON.parse(fs.readFileSync(zhPath, 'utf8'));

  // Helper to add keys
  const addKey = (obj, keyPath, value) => {
    const keys = keyPath.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    if (!current[keys[keys.length - 1]]) {
      current[keys[keys.length - 1]] = value;
    }
  };

  addKey(en, 'common.api_docs', 'API Docs');
  addKey(zh, 'common.api_docs', 'API 文档');

  fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
  fs.writeFileSync(zhPath, JSON.stringify(zh, null, 2));

  console.log('Locales updated for APIDocsButton');
}

updateLocales();
