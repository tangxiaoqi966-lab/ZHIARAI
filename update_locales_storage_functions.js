
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
    "storage": {
      "files": "Files",
      "create_bucket": "Create a file bucket",
      "general_storage_description": "General file storage for most types of digital content",
      "general_storage_value_prop": "Store images, videos, documents, and any other file type.",
      "new_bucket": "New bucket"
    },
    "table_editor": {
      "primary_key_label": "Primary key",
      "identity_label": "Identity",
      "unique_label": "Unique",
      "nullable_label": "Nullable",
      "non_nullable_label": "Non-Nullable"
    },
    "functions": {
      "page_title": "Edge Functions",
      "page_description": "Run server-side logic close to your users",
      "search_placeholder": "Search function names",
      "deploy_first_function": "Deploy your first edge function",
      "create_via_cli": "Via CLI",
      "create_via_editor": "Via Editor",
      "create_via_assistant": "AI Assistant",
      "create_in_browser": "Create and edit functions directly in the browser",
      "start_with_template": "Start with a template",
      "explore_templates": "Explore our templates",
      "developing_locally": "Developing Edge Functions locally",
      "create_function": "Create an Edge Function",
      "run_locally": "Run Edge Functions locally",
      "invoke_locally": "Invoke Edge Functions locally",
      "self_hosting": "Self-hosting Edge Functions",
      "sorted_by": "Sorted by {{sort}}",
      "sort_by_name": "name",
      "sort_by_created_at": "created at",
      "sort_by_updated_at": "updated at",
      "sort_by_deployments": "deployments",
      "table_name": "Name",
      "table_url": "URL",
      "table_created": "Created",
      "table_updated": "Updated",
      "table_deployments": "Deployments",
      "templates": {
        "hello_world_name": "Simple Hello World",
        "hello_world_desc": "Basic function that returns a JSON response",
        "database_access_name": "Supabase Database Access",
        "database_access_desc": "Example using Supabase client to query your database",
        "storage_upload_name": "Supabase Storage Upload",
        "storage_upload_desc": "Upload files to Supabase Storage",
        "node_api_name": "Node Built-in API Example",
        "node_api_desc": "Example using Node.js built-in crypto and http modules",
        "express_name": "Express Server",
        "express_desc": "Example using Express.js for routing",
        "ai_stream_name": "Stream text with AI SDK",
        "ai_stream_desc": "Generate and stream text with Vercel AI SDK",
        "ai_recipes_name": "Generate recipes with AI SDK",
        "ai_recipes_desc": "Generate structured cooking recipes with Vercel AI SDK",
        "stripe_webhook_name": "Stripe Webhook Example",
        "stripe_webhook_desc": "Handle Stripe webhook events securely",
        "send_emails_name": "Send Emails",
        "send_emails_desc": "Send emails using the Resend API",
        "image_transform_name": "Image Transformation",
        "image_transform_desc": "Transform images using ImageMagick WASM",
        "websocket_name": "WebSocket Server Example",
        "websocket_desc": "Create a real-time WebSocket server"
      }
    },
    "schema_graph": {
      "copy_as_sql": "Copy as SQL",
      "download_as_png": "Download as PNG",
      "download_as_svg": "Download as SVG",
      "download_schema": "Download Schema",
      "download_current_view": "Download current view",
      "auto_layout": "Automatically arrange the layout of all nodes"
    },
    "header": {
      "copy_as_csv": "Copy as CSV",
      "copy_as_sql": "Copy as SQL",
      "copy_as_json": "Copy as JSON",
      "export_as_csv": "Export as CSV",
      "export_as_sql": "Export as SQL",
      "export_as_json": "Export as JSON",
      "export_via_cli": "Export via CLI",
      "insert_row": "Insert row",
      "insert_column": "Insert column",
      "import_data_csv": "Import data from CSV",
      "insert": "Insert",
      "copy": "Copy",
      "export": "Export"
    }
  };

  const keysZh = {
    "storage": {
      "files": "文件",
      "create_bucket": "创建文件存储桶",
      "general_storage_description": "适用于大多数数字内容的通用文件存储",
      "general_storage_value_prop": "存储图像、视频、文档和任何其他文件类型。",
      "new_bucket": "新建存储桶"
    },
    "table_editor": {
      "primary_key_label": "主键",
      "identity_label": "标识 (Identity)",
      "unique_label": "唯一",
      "nullable_label": "可为空",
      "non_nullable_label": "不可为空"
    },
    "functions": {
      "page_title": "Edge Functions",
      "page_description": "在离用户更近的地方运行服务端逻辑",
      "search_placeholder": "搜索函数名称",
      "deploy_first_function": "部署您的第一个 Edge Function",
      "create_via_cli": "通过 CLI",
      "create_via_editor": "通过编辑器",
      "create_via_assistant": "AI 助手",
      "create_in_browser": "直接在浏览器中创建和编辑函数",
      "start_with_template": "从模板开始",
      "explore_templates": "浏览我们的模板",
      "developing_locally": "在本地开发 Edge Functions",
      "create_function": "创建一个 Edge Function",
      "run_locally": "在本地运行 Edge Functions",
      "invoke_locally": "在本地调用 Edge Functions",
      "self_hosting": "自托管 Edge Functions",
      "sorted_by": "按{{sort}}排序",
      "sort_by_name": "名称",
      "sort_by_created_at": "创建时间",
      "sort_by_updated_at": "更新时间",
      "sort_by_deployments": "部署次数",
      "table_name": "名称",
      "table_url": "URL",
      "table_created": "创建时间",
      "table_updated": "更新时间",
      "table_deployments": "部署",
      "templates": {
        "hello_world_name": "简单的 Hello World",
        "hello_world_desc": "返回 JSON 响应的基础函数",
        "database_access_name": "Supabase 数据库访问",
        "database_access_desc": "使用 Supabase 客户端查询数据库的示例",
        "storage_upload_name": "Supabase 存储上传",
        "storage_upload_desc": "上传文件到 Supabase 存储",
        "node_api_name": "Node 内置 API 示例",
        "node_api_desc": "使用 Node.js 内置 crypto 和 http 模块的示例",
        "express_name": "Express 服务器",
        "express_desc": "使用 Express.js 进行路由的示例",
        "ai_stream_name": "使用 AI SDK 流式传输文本",
        "ai_stream_desc": "使用 Vercel AI SDK 生成并流式传输文本",
        "ai_recipes_name": "使用 AI SDK 生成食谱",
        "ai_recipes_desc": "使用 Vercel AI SDK 生成结构化烹饪食谱",
        "stripe_webhook_name": "Stripe Webhook 示例",
        "stripe_webhook_desc": "安全处理 Stripe webhook 事件",
        "send_emails_name": "发送邮件",
        "send_emails_desc": "使用 Resend API 发送邮件",
        "image_transform_name": "图像转换",
        "image_transform_desc": "使用 ImageMagick WASM 转换图像",
        "websocket_name": "WebSocket 服务器示例",
        "websocket_desc": "创建一个实时 WebSocket 服务器"
      }
    },
    "schema_graph": {
      "copy_as_sql": "复制为 SQL",
      "download_as_png": "下载为 PNG",
      "download_as_svg": "下载为 SVG",
      "download_schema": "下载架构",
      "download_current_view": "下载当前视图",
      "auto_layout": "自动排列所有节点的布局"
    },
    "header": {
      "copy_as_csv": "复制为 CSV",
      "copy_as_sql": "复制为 SQL",
      "copy_as_json": "复制为 JSON",
      "export_as_csv": "导出为 CSV",
      "export_as_sql": "导出为 SQL",
      "export_as_json": "导出为 JSON",
      "export_via_cli": "通过 CLI 导出",
      "insert_row": "插入行",
      "insert_column": "插入列",
      "import_data_csv": "从 CSV 导入数据",
      "insert": "插入",
      "copy": "复制",
      "export": "导出"
    }
  };

  const traverse = (obj, prefix, target) => {
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        traverse(obj[key], prefix ? `${prefix}.${key}` : key, target);
      } else {
        addKey(target, prefix ? `${prefix}.${key}` : key, obj[key]);
      }
    }
  };

  traverse(keys, '', en);
  traverse(keysZh, '', zh);

  fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
  fs.writeFileSync(zhPath, JSON.stringify(zh, null, 2));
  console.log('Locales updated for Storage, Functions, and Schema Graph');
}

updateLocales();
