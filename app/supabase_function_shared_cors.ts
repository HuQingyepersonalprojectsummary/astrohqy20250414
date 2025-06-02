// supabase/functions/_shared/cors.ts

// 定义 CORS (跨源资源共享) 头部配置
// 这些头部将用于 Edge Function 的响应中，以告知浏览器允许来自哪些源的请求，
// 以及允许哪些 HTTP 方法和头部。

export const corsHeaders = {
  // 'Access-Control-Allow-Origin': '*', // 允许来自任何源的请求。
                                        // 在开发阶段，这通常是可以接受的。
                                        // **在生产环境中，强烈建议将其替换为您的前端应用的具体域名**，
                                        // 例如: 'https://your-astro-site.com'，以增强安全性。
  'Access-Control-Allow-Origin': '*', // 示例：暂时允许所有来源

  // 'Access-Control-Allow-Headers': 指定服务器允许在实际请求中携带的头部字段。
  // 'authorization': 用于传递 Supabase用户的 JWT (JSON Web Token)，以进行用户身份验证。
  // 'x-client-info': Supabase 客户端库可能会发送此头部，包含客户端版本等信息。
  // 'apikey': Supabase 客户端需要使用 anon key 通过 API 网关。
  // 'content-type': 指示请求体的媒体类型，例如 'application/json'。
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',

  // 'Access-Control-Allow-Methods': 指定服务器允许的 HTTP 方法。
  // 'POST': 用于提交新的评论数据。
  // 'OPTIONS': 浏览器在发送实际的 POST 请求之前，会发送一个 OPTIONS "预检"请求，
  //            以检查服务器是否允许该 POST 请求。因此，必须允许 OPTIONS 方法。
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// 使用方法：
// 在您的 Edge Function 的响应中，将这些头部包括进去。
// 例如:
//
// if (req.method === 'OPTIONS') {
//   return new Response('ok', { headers: corsHeaders });
// }
//
// // ... (其他逻辑) ...
//
// return new Response(JSON.stringify({ message: '成功！' }), {
//   headers: { ...corsHeaders, 'Content-Type': 'application/json' },
//   status: 200,
// });
//
// 通过在实际响应和 OPTIONS 预检响应中都包含这些头部，
// 您可以确保浏览器允许您的前端应用与此 Edge Function 进行跨域通信。
