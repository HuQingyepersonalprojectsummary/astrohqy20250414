// supabase/functions/submit-comment/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'; // Using esm.sh for Deno environment
import { corsHeaders } from '../_shared/cors.ts'; // Assuming a shared CORS headers file

// Define the expected request body structure
// 定义期望的请求体结构
interface RequestBody {
  postSlug: string; // 博文的唯一标识 (slug)
  content: string;  // 评论内容
}

// Define the structure for a new comment to be inserted into the database
// 定义将要插入数据库的新评论的结构
interface NewComment {
  post_slug: string;  // 博文 slug
  user_id: string;    // 经过身份验证的用户的 UUID
  content: string;    // 评论内容
  ip_address?: string; // IP 地址将是字符串类型
  // parent_comment_id?: string; // 如果实现嵌套评论，可以添加此字段
}

console.log("Supabase Function 'submit-comment' invoked."); // 用于在 Supabase logs 中确认函数被调用

// Deno.serve 用于启动一个 HTTP 服务器来处理请求
Deno.serve(async (req) => {
  // 首先处理 OPTIONS 预检请求 (用于 CORS)
  // 浏览器在发送实际请求 (如 POST) 之前，会先发送 OPTIONS 请求来检查服务器是否允许跨域请求
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request for CORS preflight."); // 处理 OPTIONS 请求日志
    return new Response('ok', { headers: corsHeaders }); // 返回 'ok' 响应及 CORS 头部
  }

  try {
    // 1. 从请求中解析 JSON body
    // req.json() 是一个异步方法，用于读取请求体并将其解析为 JSON 对象
    const requestBody = await req.json() as RequestBody;
    const { postSlug, content } = requestBody; // 从请求体中解构出 postSlug 和 content
    console.log("Request body parsed:", { postSlug, content }); // 日志：请求体解析成功

    // 2. 校验请求体内容
    // 确保 postSlug 存在且为非空字符串
    if (!postSlug || typeof postSlug !== 'string' || postSlug.trim() === '') {
      return new Response(JSON.stringify({ error: '博文标识 (postSlug) 不能为空。' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, // 返回 JSON 格式的错误信息
        status: 400, // 状态码 400 (Bad Request)
      });
    }
    // 确保 content 存在且为非空字符串
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return new Response(JSON.stringify({ error: '评论内容不能为空。' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    // 限制评论长度，例如最大 5000 字符
    if (content.length > 5000) {
        return new Response(JSON.stringify({ error: '评论内容过长，最长限制5000字符。' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }

    // 3. 创建 Supabase Admin 客户端实例
    // 在 Edge Function 中，我们通常使用 anon key，并通过传递客户端的 Authorization header 来代表用户进行操作。
    // Supabase Edge Function 会自动识别并使用这个 Authorization header 中的 JWT 来确定用户身份。
    // 这依赖于项目的 RLS (行级安全) 策略来控制数据访问。
    // 如果需要执行管理员级别的操作 (例如绕过 RLS)，则应使用 SUPABASE_SERVICE_ROLE_KEY。
    // 但对于此场景 (用户提交自己的评论)，使用 anon key 和用户 JWT 是合适的。
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '', // 从环境变量获取 Supabase URL
      Deno.env.get('SUPABASE_ANON_KEY') ?? '', // 从环境变量获取 Supabase anon key
      {
        global: {
          headers: {
            Authorization: req.headers.get('Authorization')! // 将从客户端请求接收到的 Authorization header (包含用户 JWT) 传递给函数内的 Supabase 客户端
          }
        }
      }
    );
    console.log("Supabase client initialized in function."); // 日志：Supabase 客户端初始化成功

    // 4. 获取当前认证的用户信息
    // 使用函数内的 supabaseClient (已配置了用户的 JWT) 来获取用户信息
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    // 如果获取用户信息出错或用户未认证
    if (userError || !user) {
      console.error("User authentication error:", userError?.message || "No user found"); // 日志：用户认证错误
      return new Response(JSON.stringify({ error: '用户未认证或认证失败。' + (userError ? ` (${userError.message})` : '') }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401, // 状态码 401 (Unauthorized)
      });
    }
    console.log("User authenticated:", user.id); // 日志：用户认证成功，记录用户 ID

    // 5. 获取客户端 IP 地址
    // Supabase Edge Functions (Deno Deploy) 通常通过 'x-forwarded-for' header 提供原始客户端 IP。
    // Deno.connInfo 已被废弃。
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || // 取 x-forwarded-for 中的第一个 IP
                      req.headers.get('x-real-ip') || // 备选的 header
                      'IP地址获取失败'; // 获取失败时的默认值
    console.log("Client IP Address:", ipAddress); // 日志：记录获取到的 IP 地址


    // 6. 准备要插入数据库的新评论对象
    const newComment: NewComment = {
      post_slug: postSlug,        // 博文 slug
      user_id: user.id,           // 已认证用户的 ID
      content: content.trim(),    // 评论内容 (去除首尾空格)
      ip_address: ipAddress,      // 获取到的 IP 地址
    };
    console.log("New comment object prepared:", newComment); // 日志：准备好的新评论对象

    // 7. 将评论插入到 'comments' 表中
    // 使用 .from('comments') 指定要操作的表
    // .insert(newComment) 插入新评论数据
    // .select() 使 Supabase 返回插入的数据 (可选，但通常有用)
    // .single() 假设我们只插入并期望返回一条记录
    const { data: commentData, error: insertError } = await supabaseClient
      .from('comments')
      .insert(newComment)
      .select()
      .single();

    // 如果插入过程中发生错误
    if (insertError) {
      console.error('Error inserting comment:', insertError.message); // 日志：插入评论错误
      // 根据错误类型可以返回更具体的错误信息给客户端
      let clientErrorMessage = '无法发表评论，请稍后再试。'; // 通用错误信息
      // 检查是否是由于数据库约束（例如 RLS 或 check constraints）导致的错误
      if (insertError.message.includes('comments_post_slug_check') || insertError.message.includes('comments_content_check')) {
        clientErrorMessage = '评论内容或文章标识无效。';
      } else if (insertError.message.includes('row level security') || insertError.message.includes('RLS')) {
        clientErrorMessage = '您没有权限发表评论。'; // RLS 策略阻止了操作
      }
      return new Response(JSON.stringify({ error: `${clientErrorMessage} (详细错误: ${insertError.message})` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500, // 状态码 500 (Internal Server Error) 或根据错误类型调整
      });
    }

    console.log('Comment inserted successfully:', commentData); // 日志：评论插入成功

    // 8. 返回成功响应
    // 包含成功的消息和插入的评论数据
    return new Response(JSON.stringify({ message: '评论已成功发表！', comment: commentData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201, // 状态码 201 (Created)，表示资源成功创建
    });

  } catch (error) {
    // 捕获任何在 try 块中未处理的意外错误 (例如 JSON 解析失败，或其他代码执行错误)
    console.error('Unhandled error in submit-comment function:', error.message, error.stack); // 日志：未处理的错误
    return new Response(JSON.stringify({ error: `服务器内部发生未知错误: ${error.message}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500, // 状态码 500 (Internal Server Error)
    });
  }
});

/*
--- 说明和部署步骤 ---

**重要提示**: 此文件 (`app/supabase_function_submit_comment_index.ts`) 中的代码需要被放置到您的 Supabase 项目的正确路径下。
Astro 项目的 `/app` 目录通常是前端代码。Supabase Edge Functions 有其自己的目录结构。

**1. 创建函数目录 (如果您还没有这样做):**
   在您的本地 Supabase 项目（通常与您的 Astro 项目是同一个 git 仓库，或者是一个单独的仓库）中，
   使用 Supabase CLI 创建一个新的 Edge Function：
   ```bash
   npx supabase functions new submit-comment
   ```
   这会在您的 Supabase 项目中创建 `supabase/functions/submit-comment/index.ts` 文件。

**2. 替换/填充 `index.ts`:**
   将上面 `app/supabase_function_submit_comment_index.ts` 文件中的 *全部内容* 复制并粘贴到
   您 Supabase 项目中的 `supabase/functions/submit-comment/index.ts` 文件中，覆盖其原有内容。

**3. 创建共享的 CORS 头文件 (推荐):**
   在您的 Supabase 项目中，创建 `supabase/functions/_shared/cors.ts` 文件，并添加以下内容:
   ```typescript
   // supabase/functions/_shared/cors.ts
   export const corsHeaders = {
     'Access-Control-Allow-Origin': '*', // 开发时用 '*'，生产环境应指定前端域名，例如 'https://your-astro-site.com'
     'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', // 确保 'authorization' 和 'content-type' 被允许
     'Access-Control-Allow-Methods': 'POST, OPTIONS', // 此函数仅需 POST 和 OPTIONS
   };
   ```

**4. 设置环境变量 (在 Supabase 项目仪表盘中):**
   - 登录到您的 Supabase 项目仪表盘。
   - 前往 "Project Settings" (项目设置) -> "Edge Functions"。
   - 在 "Secrets" (或 "Environment Variables") 部分，添加以下变量：
     - `SUPABASE_URL`: 您的 Supabase 项目 URL (例如 `https://<your-project-ref>.supabase.co`)。
     - `SUPABASE_ANON_KEY`: 您的 Supabase 项目 anon public key。
   这些变量会自动注入到 Edge Function 的运行环境中。

**5. 数据库表和行级安全 (RLS) 策略:**
   - **创建 `comments` 表**: 如果您还没有 `comments` 表，请在 Supabase SQL 编辑器中创建它。示例结构：
     ```sql
     CREATE TABLE public.comments (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       post_slug TEXT NOT NULL, -- 用于关联到具体的博文
       user_id UUID NOT NULL REFERENCES auth.users(id), -- 关联到认证用户
       content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 5000), -- 评论内容，带长度校验
       ip_address TEXT, -- 存储 IP 地址
       created_at TIMESTAMPTZ DEFAULT now() NOT NULL, -- 创建时间
       updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
       -- parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE, -- (可选) 用于嵌套评论
     );
     -- (可选) 为 created_at 和 updated_at 创建自动更新触发器
     CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
     RETURNS TRIGGER AS $$
     BEGIN
       NEW.updated_at = now();
       RETURN NEW;
     END;
     $$ LANGUAGE plpgsql;
     CREATE TRIGGER handle_updated_at
       BEFORE UPDATE ON public.comments
       FOR EACH ROW
       EXECUTE FUNCTION public.set_current_timestamp_updated_at();
     ```
   - **启用 RLS**: 在 `comments` 表上启用行级安全。
     ```sql
     ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
     ```
   - **创建 RLS 策略**:
     ```sql
     -- 允许认证用户插入他们自己的评论
     CREATE POLICY "Authenticated users can insert their own comments"
     ON public.comments
     FOR INSERT
     TO authenticated -- 'authenticated' 是 Supabase 内置的角色，代表任何已登录用户
     WITH CHECK (auth.uid() = user_id AND char_length(content) > 0 AND char_length(content) <= 5000);

     -- 允许任何人 (包括未登录用户) 读取所有评论 (如果您的评论是公开的)
     CREATE POLICY "Anyone can read comments"
     ON public.comments
     FOR SELECT
     TO anon, authenticated -- 'anon' 代表匿名用户
     USING (true);
     ```
     根据您的需求调整这些策略。例如，如果只有登录用户才能看评论，则 SELECT 策略中的 `TO anon` 可以移除。

**6. 部署 Edge Function:**
   在您的本地终端中，确保您位于 Supabase 项目的根目录 (或者能够运行 Supabase CLI 的地方)，然后运行:
   ```bash
   npx supabase functions deploy submit-comment --project-ref <your-project-ref>
   ```
   将 `<your-project-ref>` 替换为您的 Supabase 项目引用 ID。
   (如果您已登录 Supabase CLI 并且项目已链接，可能不需要 `--project-ref`)

**7. 本地测试 (可选但推荐):**
   在部署前，您可以在本地启动 Supabase 服务 (包括 Edge Functions) 来测试：
   ```bash
   npx supabase start  # 启动所有本地 Supabase 服务
   # (可选) 如果只想单独运行 functions: npx supabase functions serve --env-file ./supabase/.env
   ```
   然后，您可以使用 `curl` 或 Postman 之类的工具向本地函数端点 (`http://localhost:54321/functions/v1/submit-comment`)
   发送一个 POST 请求，确保包含正确的 `Authorization` header (用户的 JWT) 和 JSON 请求体。

请仔细按照这些步骤操作，以确保 Edge Function 正确设置并能够安全地处理评论提交。
*/
