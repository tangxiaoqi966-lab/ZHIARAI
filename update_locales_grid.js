
const fs = require('fs');
const path = require('path');

const enPath = path.join(process.cwd(), 'supabase/apps/studio/locales/en/common.json');
const zhPath = path.join(process.cwd(), 'supabase/apps/studio/locales/zh-CN/common.json');

function updateLocales() {
  const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const zh = JSON.parse(fs.readFileSync(zhPath, 'utf8'));

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

  const keys = {
    "query_details": "Query details",
    "indexes": "Indexes",
    "no_queries_detected": "No queries detected",
    "no_queries_criteria": "There are no actively running queries that match the criteria",
    "failed_load_data": "Failed to load query performance data",
    "try_again": "Try again",
    "sort_ascending": "Sort Ascending",
    "sort_descending": "Sort Descending"
  };

  const keysZh = {
    "query_details": "查询详情",
    "indexes": "索引",
    "no_queries_detected": "未检测到查询",
    "no_queries_criteria": "没有符合条件的活跃查询",
    "failed_load_data": "无法加载查询性能数据",
    "try_again": "重试",
    "sort_ascending": "升序排列",
    "sort_descending": "降序排列"
  };

  Object.entries(keys).forEach(([k, v]) => addKey(en, `advisor.${k}`, v));
  Object.entries(keysZh).forEach(([k, v]) => addKey(zh, `advisor.${k}`, v));

  fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
  fs.writeFileSync(zhPath, JSON.stringify(zh, null, 2));
  console.log('Locales updated for QueryPerformanceGrid');
}

updateLocales();
