# 🔧 Supabase 邮件配置指南

## 📧 配置密码重置邮件

为了让密码重置功能正常工作，需要在 Supabase 中配置邮件设置。

### 1. 配置重定向 URL

在 Supabase Dashboard 中：

1. 进入 **Authentication** → **URL Configuration**
2. 在 **Redirect URLs** 中添加：
   ```
   https://astrohqy20250414.vercel.app/auth/reset-password
   http://localhost:4321/auth/reset-password
   ```

### 2. 配置邮件模板

在 Supabase Dashboard 中：

1. 进入 **Authentication** → **Email Templates**
2. 选择 **Reset Password** 模板
3. 使用以下模板内容：

#### 邮件主题：
```
重置您的博客账户密码
```

#### 邮件内容（HTML）：
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>重置密码</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .container {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 10px;
            border: 1px solid #e1e5e9;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .title {
            color: #2337ff;
            font-size: 24px;
            margin-bottom: 10px;
        }
        .button {
            display: inline-block;
            background-color: #2337ff;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e1e5e9;
            font-size: 14px;
            color: #666;
        }
        .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">🔐 重置密码</h1>
        </div>
        
        <p>您好，</p>
        
        <p>我们收到了重置您博客账户密码的请求。如果这是您本人的操作，请点击下面的按钮来设置新密码：</p>
        
        <div style="text-align: center;">
            <a href="{{ .ConfirmationURL }}" class="button">重置密码</a>
        </div>
        
        <div class="warning">
            <strong>⚠️ 安全提醒：</strong>
            <ul>
                <li>此链接将在 1 小时后失效</li>
                <li>如果您没有申请重置密码，请忽略此邮件</li>
                <li>请不要将此链接分享给他人</li>
            </ul>
        </div>
        
        <p>如果按钮无法点击，请复制以下链接到浏览器地址栏：</p>
        <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px;">
            {{ .ConfirmationURL }}
        </p>
        
        <div class="footer">
            <p>此邮件由系统自动发送，请勿回复。</p>
            <p>如有疑问，请联系网站管理员。</p>
            <p>© 2025 博客系统</p>
        </div>
    </div>
</body>
</html>
```

### 3. 测试邮件配置

配置完成后，可以通过以下方式测试：

1. 在登录页面点击"忘记密码？"
2. 输入注册时使用的邮箱地址
3. 检查邮箱是否收到重置邮件
4. 点击邮件中的重置链接
5. 设置新密码并测试登录

### 4. 故障排除

#### 邮件发送失败
- 检查 Supabase 项目的邮件配置
- 确认邮箱地址正确
- 检查垃圾邮件文件夹

#### 重置链接无效
- 确认重定向 URL 配置正确
- 检查链接是否已过期（1小时有效期）
- 确认网站部署正常

#### 密码更新失败
- 检查新密码是否符合要求（至少6位）
- 确认两次输入的密码一致
- 检查网络连接

### 5. 自定义邮件服务（可选）

如果需要使用自定义邮件服务（如 SendGrid、Mailgun 等）：

1. 在 Supabase Dashboard 中进入 **Settings** → **Auth**
2. 配置 **SMTP Settings**
3. 输入邮件服务商的 SMTP 配置信息

---

*配置完成后，用户就可以通过邮箱重置密码了！*
