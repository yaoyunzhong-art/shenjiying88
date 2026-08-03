# AI RAG 检索增强生成

> 基于 RAG 架构的文档知识库，支持文档管理、语义检索与生成

## 功能
- 文档集合与文档管理 (CRUD)
- 文档语义检索与问答
- 多集合文档组织

## API
- POST /ai-rag/documents — 上传文档
- GET /ai-rag/documents/:collection — 集合内文档列表
- GET /ai-rag/documents/:collection/:docId — 文档详情
- PUT /ai-rag/documents/:collection/:docId — 更新文档
- DELETE /ai-rag/documents/:collection/:docId — 删除文档
