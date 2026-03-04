
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
    "functions": {
      "create_via_editor_description": "Create and edit functions directly in the browser. Download to local at any time.",
      "create_via_assistant_description": "Let our AI assistant help you create functions. Perfect for kickstarting a function.",
      "create_via_cli_description": "Create and deploy functions using the Supabase CLI. Ideal for local development and version control.",
      "local_instructions": {
        "create_new_function": "Create a new edge function called <1>hello-world</1> in your project via the Supabase CLI.",
        "run_locally_description": "You can run your Edge Function locally using <1>supabase functions serve</1>.",
        "invoke_locally_description": "While serving your local Edge Functions, you can invoke it using cURL or one of the client libraries.",
        "self_hosting_description": "Supabase Edge Runtime consists of a web server based on the Deno runtime, capable of running Javascript, Typescript, and WASM services. You may self-host edge functions on providers like Fly.io, Digital Ocean, or AWS."
      },
      "open_editor": "Open Editor",
      "open_assistant": "Open Assistant",
      "view_cli_instructions": "View CLI Instructions"
    }
  };

  const keysZh = {
    "functions": {
      "create_via_editor_description": "直接在浏览器中创建和编辑函数。随时下载到本地。",
      "create_via_assistant_description": "让我们的 AI 助手帮您创建函数。非常适合快速启动函数。",
      "create_via_cli_description": "使用 Supabase CLI 创建和部署函数。非常适合本地开发和版本控制。",
      "local_instructions": {
        "create_new_function": "通过 Supabase CLI 在您的项目中创建一个名为 <1>hello-world</1> 的新 Edge Function。",
        "run_locally_description": "您可以使用 <1>supabase functions serve</1> 在本地运行 Edge Function。",
        "invoke_locally_description": "在本地运行 Edge Functions 时，您可以使用 cURL 或客户端库之一来调用它。",
        "self_hosting_description": "Supabase Edge Runtime 由基于 Deno 运行时的 Web 服务器组成，能够运行 Javascript、Typescript 和 WASM 服务。您可以在 Fly.io、Digital Ocean 或 AWS 等提供商上自托管 Edge Functions。"
      },
      "open_editor": "打开编辑器",
      "open_assistant": "打开助手",
      "view_cli_instructions": "查看 CLI 说明"
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
  console.log('Locales updated for Functions Instructions');
}

updateLocales();
