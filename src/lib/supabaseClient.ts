// src/lib/supabaseClient.ts

// 从 @supabase/supabase-js 导入 createClient 函数，用于创建 Supabase 客户端实例
import { createClient } from '@supabase/supabase-js';

// 获取 Supabase URL 和匿名密钥 (Anon Key)
// 这些环境变量应该在项目的 .env 文件中定义 (例如 .env.local 或 .env.development)
// 注意：在 Astro 中，要在客户端（浏览器）代码中访问环境变量，它们必须以 `PUBLIC_` 开头。
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// 类型和存在性检查：确保环境变量已正确设置
// 如果 Supabase URL 未定义，则抛出错误，因为客户端无法在没有 URL 的情况下初始化
if (!supabaseUrl) {
  throw new Error("Supabase URL (PUBLIC_SUPABASE_URL) 未在环境变量中定义。");
}
// 如果 Supabase 匿名密钥未定义，则抛出错误
if (!supabaseAnonKey) {
  throw new Error("Supabase Anon Key (PUBLIC_SUPABASE_ANON_KEY) 未在环境变量中定义。");
}

// 创建并导出 Supabase 客户端实例
// 使用从环境变量中获取的 URL 和匿名密钥来初始化客户端
// 这个 'supabase' 对象将用于与您的 Supabase 后端进行所有交互 (例如，数据库操作、用户认证等)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // 设置认证重定向URL，确保邮箱确认后重定向到正确的地址
    // 在生产环境中使用Vercel域名，开发环境中使用localhost
    redirectTo: typeof window !== 'undefined'
      ? window.location.origin
      : (import.meta.env.PROD ? 'https://astrohqy20250414.vercel.app' : 'http://localhost:8110')
  }
});

// 可选的类型增强说明：
// 如果您的项目需要更强的类型支持（例如，针对您的数据库 schema），
// 您可以使用 Supabase CLI 生成类型定义文件 (通常命名为 database.types.ts 或类似名称)，
// 然后在创建客户端时指定这些类型。
// 例如:
// import type { Database } from './database.types'; // 假设类型文件路径
// export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
// 这将为您的数据库表、列和函数提供类型提示和自动完成，从而提高开发效率和代码质量。
// 要生成这些类型，通常需要在安装 Supabase CLI 后运行类似 `supabase gen types typescript --project-id <your-project-id> > src/lib/database.types.ts` 的命令。
// 请查阅最新的 Supabase 文档以获取准确的命令和指导。
