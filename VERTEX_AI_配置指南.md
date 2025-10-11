# Vertex AI 配置指南

## 为什么需要 Vertex AI？

`gemini-2.5-flash-image` 模型**只能通过 Vertex AI 使用**，不支持普通的 API Key 认证。

## 配置步骤

### 1️⃣ 创建 Google Cloud 项目

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 如果还没有项目，点击 "创建项目"
3. 记下你的 **项目 ID**（例如：`mynook-ai-123456`）

### 2️⃣ 启用 Vertex AI API

1. 在 Google Cloud Console 中，搜索 "Vertex AI API"
2. 点击 "启用"
3. 同时启用 "Generative Language API"

### 3️⃣ 创建服务账号

1. 进入 **IAM & Admin** > **Service Accounts**
2. 点击 "**CREATE SERVICE ACCOUNT**"
3. 填写信息：
   - **Service account name**: `mynook-vertex-ai`
   - **Service account ID**: 自动生成
   - 点击 "**CREATE AND CONTINUE**"

4. 授予权限：
   - 选择角色：**Vertex AI User**
   - 点击 "**CONTINUE**"
   - 点击 "**DONE**"

### 4️⃣ 创建密钥

1. 在服务账号列表中，点击刚创建的服务账号
2. 切换到 "**KEYS**" 标签页
3. 点击 "**ADD KEY**" > "**Create new key**"
4. 选择 "**JSON**" 格式
5. 点击 "**CREATE**" - 会自动下载一个 JSON 文件

**⚠️ 重要**: 这个 JSON 文件包含敏感信息，请妥善保管！

### 5️⃣ 配置 Vercel 环境变量

在 Vercel Dashboard 中添加以下环境变量：

#### 方法一：使用完整的 JSON 密钥（推荐）

```bash
GOOGLE_APPLICATION_CREDENTIALS_JSON=<完整的JSON内容>
```

将下载的 JSON 文件内容完整复制进去，例如：
```json
{
  "type": "service_account",
  "project_id": "mynook-ai-123456",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "mynook-vertex-ai@mynook-ai-123456.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

#### 方法二：分别配置

或者分别添加这些变量：

```bash
GOOGLE_CLOUD_PROJECT=mynook-ai-123456
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS_JSON=<JSON内容>
```

### 6️⃣ 设置计费

⚠️ **重要**：Vertex AI 是付费服务，需要启用计费账户

1. 在 Google Cloud Console 中，进入 **Billing**
2. 关联一个计费账户（可以使用免费试用额度）
3. Vertex AI 提供 $300 免费额度供新用户使用

## 价格参考

- **Gemini 2.5 Flash Image**: 大约 $0.00001 - $0.0001 per image（具体价格请查看官网）
- 比 Imagen 3.0 便宜很多
- 支持图像编辑功能

## 验证配置

配置完成后，运行以下命令验证：

```bash
# 在 Vercel 中部署后查看日志
# 应该看到成功初始化 Vertex AI 的日志
```

## 故障排查

### 错误：API keys are not supported by this API

**原因**: 使用了 API Key 而不是 Vertex AI 认证

**解决**: 按照上述步骤配置 Vertex AI 服务账号

### 错误：Permission denied

**原因**: 服务账号没有足够的权限

**解决**: 确保服务账号有 "Vertex AI User" 角色

### 错误：Project not found

**原因**: `GOOGLE_CLOUD_PROJECT` 环境变量不正确

**解决**: 检查项目 ID 是否正确

## 下一步

配置完成后，我会更新代码以使用 Vertex AI SDK。

