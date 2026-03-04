
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

  // Advisor related keys
  const advisorKeys = {
    "ask_assistant": "Ask Assistant",
    "help_fix_issue": "Help me fix this issue",
    "no_security_issues_found": "No security issues found",
    "no_performance_issues_found": "No performance issues found",
    "security": "Security",
    "performance": "Performance",
    "open_security_advisor": "Open security advisor",
    "open_performance_advisor": "Open performance advisor",
    "slow_queries": "Slow Queries",
    "open_query_performance_advisor": "Open query performance advisor",
    "no_slow_queries_found": "No slow queries found",
    "issue": "issue",
    "issues": "issues",
    "attention": "attention",
    "query": "Query",
    "avg_time": "Avg. Time",
    "calls": "Calls",
    "enable_button": "Enable Index Advisor",
    "enable_description": "Enable the Index Advisor extension to get index recommendations for your queries.",
    "enable_success": "Successfully enabled index advisor!",
    "enable_error": "Failed to enable index advisor: {{error}}",
    "enable_dialog_title": "Enable Index Advisor",
    "enable_dialog_description": "This will enable the <1>index_advisor</1> and <3>hypopg</3> extensions in your database.",
    "enabling": "Enabling...",
    "recommendation_reason": "Recommendation Reason",
    "recommendation_for_column": "Recommendation for column",
    "based_on_query": "Based on the following query:",
    "indexes_in_use": "Indexes in Use",
    "indexes_in_use_description": "The following index{{plural}} were used for this query",
    "no_indexes_used": "No indexes used",
    "no_indexes_used_description": "This query does not use any indexes",
    "new_recommendations": "New Recommendations",
    "recommendations_not_available": "Recommendations not available",
    "recommendations_not_available_description": "The Index Advisor could not generate any recommendations for this query.",
    "query_optimized": "Query Optimized",
    "query_optimized_description": "This query is already optimized and does not require any additional indexes.",
    "recommendation_alert_title": "{{count}} recommended index{{plural}} found",
    "recommendation_alert_description": "Query performance can be improved by <1>{{improvement}}%</1> by creating the suggested {{indexes}}.",
    "recommendation_note": "Note: Creating an index may take some time depending on the size of your table.",
    "query_costs": "Query Costs",
    "total_cost": "Total Cost",
    "total_cost_description": "Estimated cost of the query execution",
    "startup_cost": "Startup Cost",
    "startup_cost_description": "Estimated cost to fetch the first row",
    "faq": "FAQ",
    "faq_units_title": "What do the cost units represent?",
    "faq_units_content": "The cost units are arbitrary units used by the Postgres query planner to compare different execution plans. They do not correspond to a specific time unit like milliseconds.",
    "faq_prioritize_title": "How should I prioritize which indexes to create?",
    "faq_prioritize_content_1": "You should prioritize indexes that provide the highest improvement percentage.",
    "faq_prioritize_content_2": "Also consider the number of times the query is executed (calls).",
    "faq_prioritize_content_3": "Creating too many indexes can impact write performance, so it's a balance between read and write performance.",
    "apply_index": "Apply Index",
    "apply_index_description": "Create the recommended index to improve query performance",
    "create_index": "Create Index",
    "no_issues_available": "No issues available",
    "newer_postgres_version_required": "Newer version of Postgres required",
    "extensions_required": "Postgres extensions `index_advisor` and `hypopg` required",
    "upgrade_postgres_description": "Upgrade to the latest version of Postgres to get recommendations on indexes for your queries",
    "extensions_description": "These extensions can help in recommending database indexes to reduce the costs of your query.",
    "upgrade_postgres_version": "Upgrade Postgres version",
    "enable_extensions": "Enable extensions"
  };

  const advisorKeysZh = {
    "ask_assistant": "询问助手",
    "help_fix_issue": "帮我解决此问题",
    "no_security_issues_found": "未发现安全问题",
    "no_performance_issues_found": "未发现性能问题",
    "security": "安全",
    "performance": "性能",
    "open_security_advisor": "打开安全顾问",
    "open_performance_advisor": "打开性能顾问",
    "slow_queries": "慢查询",
    "open_query_performance_advisor": "打开查询性能顾问",
    "no_slow_queries_found": "未发现慢查询",
    "issue": "个问题",
    "issues": "个问题",
    "attention": "关注",
    "query": "查询语句",
    "avg_time": "平均耗时",
    "calls": "调用次数",
    "enable_button": "启用索引顾问",
    "enable_description": "启用索引顾问扩展以获取查询的索引建议。",
    "enable_success": "成功启用索引顾问！",
    "enable_error": "启用索引顾问失败: {{error}}",
    "enable_dialog_title": "启用索引顾问",
    "enable_dialog_description": "这将在您的数据库中启用 <1>index_advisor</1> 和 <3>hypopg</3> 扩展。",
    "enabling": "正在启用...",
    "recommendation_reason": "推荐理由",
    "recommendation_for_column": "针对列的建议",
    "based_on_query": "基于以下查询：",
    "indexes_in_use": "正在使用的索引",
    "indexes_in_use_description": "此查询使用了以下索引",
    "no_indexes_used": "未使用索引",
    "no_indexes_used_description": "此查询未使用任何索引",
    "new_recommendations": "新建议",
    "recommendations_not_available": "暂无建议",
    "recommendations_not_available_description": "索引顾问无法为此查询生成任何建议。",
    "query_optimized": "查询已优化",
    "query_optimized_description": "此查询已优化，不需要任何额外的索引。",
    "recommendation_alert_title": "发现 {{count}} 个推荐索引",
    "recommendation_alert_description": "通过创建建议的{{indexes}}，查询性能可提高 <1>{{improvement}}%</1>。",
    "recommendation_note": "注意：创建索引可能需要一些时间，具体取决于表的大小。",
    "query_costs": "查询成本",
    "total_cost": "总成本",
    "total_cost_description": "查询执行的预估成本",
    "startup_cost": "启动成本",
    "startup_cost_description": "获取第一行的预估成本",
    "faq": "常见问题",
    "faq_units_title": "成本单位代表什么？",
    "faq_units_content": "成本单位是 Postgres 查询规划器用于比较不同执行计划的任意单位。它们不对应于特定的时间单位（如毫秒）。",
    "faq_prioritize_title": "我应该如何优先考虑创建哪些索引？",
    "faq_prioritize_content_1": "您应该优先考虑提供最高改进百分比的索引。",
    "faq_prioritize_content_2": "还要考虑查询执行的次数（调用次数）。",
    "faq_prioritize_content_3": "创建过多的索引会影响写入性能，因此需要在读取和写入性能之间取得平衡。",
    "apply_index": "应用索引",
    "apply_index_description": "创建推荐的索引以提高查询性能",
    "create_index": "创建索引",
    "no_issues_available": "没有发现问题",
    "newer_postgres_version_required": "需要更新版本的 Postgres",
    "extensions_required": "需要 Postgres 扩展 `index_advisor` 和 `hypopg`",
    "upgrade_postgres_description": "升级到最新版本的 Postgres 以获取查询的索引建议",
    "extensions_description": "这些扩展可以帮助推荐数据库索引以降低查询成本。",
    "upgrade_postgres_version": "升级 Postgres 版本",
    "enable_extensions": "启用扩展"
  };

  Object.entries(advisorKeys).forEach(([k, v]) => addKey(en, `advisor.${k}`, v));
  Object.entries(advisorKeysZh).forEach(([k, v]) => addKey(zh, `advisor.${k}`, v));

  fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
  fs.writeFileSync(zhPath, JSON.stringify(zh, null, 2));
  console.log('Locales updated for Advisor Widget and Query Indexes');
}

updateLocales();
