
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
      "secrets": {
        "title": "Edge Function Secrets",
        "description": "Manage encrypted values for your functions",
        "local_dev_cli": "Local development & CLI",
        "local_secrets_description": "Local secrets and environment variables can be loaded in either of the following two ways",
        "env_file_method": "Through an <1>.env</1> file placed at <3>supabase/functions/.env</3>, which is automatically loaded on <5>supabase start</5>",
        "env_flag_method": "Through the <1>--env-file</1> option for <3>supabase functions serve</3>, for example: <5>supabase functions serve --env-file ./path/to/.env-file</5>",
        "self_hosted": "Self-Hosted Supabase",
        "change_settings": "Change settings in",
        "and": "and",
        "at": "at",
        "service": "service",
        "secrets_runtime_injection": "Secrets can also be loaded at runtime by injecting them into"
      },
      "sidebar": {
        "manage": "Manage",
        "functions": "Functions",
        "secrets": "Secrets"
      }
    }
  };

  const keysZh = {
    "functions": {
      "secrets": {
        "title": "Edge Function 密钥",
        "description": "管理函数的加密值",
        "local_dev_cli": "本地开发与 CLI",
        "local_secrets_description": "可以通过以下两种方式之一加载本地密钥和环境变量",
        "env_file_method": "通过放置在 <3>supabase/functions/.env</3> 的 <1>.env</1> 文件，该文件会在 <5>supabase start</5> 时自动加载",
        "env_flag_method": "通过 <3>supabase functions serve</3> 的 <1>--env-file</1> 选项，例如：<5>supabase functions serve --env-file ./path/to/.env-file</5>",
        "self_hosted": "自托管 Supabase",
        "change_settings": "在以下位置更改设置：",
        "and": "以及",
        "at": "位于",
        "service": "服务",
        "secrets_runtime_injection": "也可以在运行时通过将其注入到以下文件中来加载密钥："
      },
      "sidebar": {
        "manage": "管理",
        "functions": "函数",
        "secrets": "密钥"
      }
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
  console.log('Locales updated for Edge Function Secrets');
}

updateLocales();
