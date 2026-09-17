# Docker 本地启动

在项目根目录运行：

```bash
docker compose up -d --build
```

- 工作台：http://localhost:5173
- API 文档：http://localhost:8000/docs
- 健康检查：http://localhost:8000/api/health

前端使用项目原有的 Vite 开发服务器，仅绑定本机地址。浏览器中的 API 和 WebSocket 地址固定为 localhost:8000，因此后端保持使用 8000 端口。

`data`、`factor_db`、`user_workspace` 挂载到本机项目目录，容器重建后保留数据。任务历史保存在内存中，后端重启会清空任务历史。

```bash
# 查看状态与日志
docker compose ps
docker compose logs --tail=100

# 停止服务（保留本机数据）
docker compose down
```

镜像安装 requirements.txt 中的依赖；需要额外依赖的自定义 Miner 或外部 LLM 密钥时，需另外配置。
