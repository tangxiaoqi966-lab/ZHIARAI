
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

  // DownloadResultsButton & General
  const commonKeys = {
    "export": "Export",
    "copy_as_markdown": "Copy as markdown",
    "copy_as_json": "Copy as JSON",
    "download_csv": "Download CSV",
    "results_empty": "Results are empty",
    "downloading_csv": "Downloading results as CSV",
    "copied_to_clipboard": "Copied results to clipboard",
    "add_log_drain": "Add a Log Drain",
    "source": "Source",
    "primary_database": "Primary database",
    "read_replica": "Read replica",
    "create_new_read_replica": "Create a new read replica",
    "replica_status_unhealthy": "Replica unable to accept requests as its {{status}}. [View infrastructure settings]({{link}}) for more information.",
    "coming_up": "coming up",
    "not_healthy": "not healthy",
    "collapse": "Collapse",
    "expand": "Expand",
    "disable": "Disable",
    "enable": "Enable",
    "disabling": "Disabling",
    "enabling": "Enabling"
  };

  const commonKeysZh = {
    "export": "导出",
    "copy_as_markdown": "复制为 Markdown",
    "copy_as_json": "复制为 JSON",
    "download_csv": "下载 CSV",
    "results_empty": "结果为空",
    "downloading_csv": "正在下载 CSV 结果",
    "copied_to_clipboard": "结果已复制到剪贴板",
    "add_log_drain": "添加日志导出",
    "source": "来源",
    "primary_database": "主数据库",
    "read_replica": "只读副本",
    "create_new_read_replica": "创建新只读副本",
    "replica_status_unhealthy": "副本无法接受请求，因为其状态为 {{status}}。[查看基础设施设置]({{link}}) 以获取更多信息。",
    "coming_up": "正在启动",
    "not_healthy": "不健康",
    "collapse": "折叠",
    "expand": "展开",
    "disable": "禁用",
    "enable": "启用",
    "disabling": "正在禁用",
    "enabling": "正在启用"
  };

  // QueryDetail & Advisor
  const advisorKeys = {
    "query_pattern": "Query pattern",
    "explain_with_ai": "Explain with AI",
    "suggested_optimization": "Suggested optimization: Add an index",
    "optimization_description": "Adding an index will help this query execute faster",
    "view_suggestion": "View suggestion",
    "metadata": "Metadata"
  };

  const advisorKeysZh = {
    "query_pattern": "查询模式",
    "explain_with_ai": "使用 AI 解释",
    "suggested_optimization": "建议优化：添加索引",
    "optimization_description": "添加索引将帮助此查询执行得更快",
    "view_suggestion": "查看建议",
    "metadata": "元数据"
  };

  // GridHeaderActions / Table Editor
  const tableEditorKeys = {
    "security_definer_view": "Security Definer view",
    "secure_your_view": "Secure your View",
    "security_definer_description_1": "This view is defined with the Security Definer property, giving it permissions of the view's creator (Postgres), rather than the permissions of the querying user.",
    "security_definer_description_2": "Since this view is in the public schema, it is accessible via your project's APIs.",
    "learn_more": "Learn more",
    "autofix": "Autofix"
  };

  const tableEditorKeysZh = {
    "security_definer_view": "安全定义者视图",
    "secure_your_view": "保护您的视图",
    "security_definer_description_1": "此视图使用安全定义者属性定义，使其拥有视图创建者 (Postgres) 的权限，而不是查询用户的权限。",
    "security_definer_description_2": "由于此视图位于 public 模式中，因此可以通过您的项目 API 访问它。",
    "learn_more": "了解更多",
    "autofix": "自动修复"
  };

  // Apply updates
  Object.entries(commonKeys).forEach(([k, v]) => addKey(en, `common.${k}`, v));
  Object.entries(commonKeysZh).forEach(([k, v]) => addKey(zh, `common.${k}`, v));

  Object.entries(advisorKeys).forEach(([k, v]) => addKey(en, `advisor.${k}`, v));
  Object.entries(advisorKeysZh).forEach(([k, v]) => addKey(zh, `advisor.${k}`, v));

  Object.entries(tableEditorKeys).forEach(([k, v]) => addKey(en, `table_editor.${k}`, v));
  Object.entries(tableEditorKeysZh).forEach(([k, v]) => addKey(zh, `table_editor.${k}`, v));

  fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
  fs.writeFileSync(zhPath, JSON.stringify(zh, null, 2));

  console.log('Locales updated for Export, Source, QueryDetail, and GridHeaderActions');
}

updateLocales();
