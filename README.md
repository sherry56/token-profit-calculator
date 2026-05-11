# Token 利润计算器

内部成本与利润测算前端页面，使用 React + TypeScript + Vite + Tailwind CSS。

## 本地运行

```bash
npm install
npm run dev
```

## Docker 本地构建

```bash
docker build -t token-profit-calculator .
docker run -d --name token-profit-calculator -p 8080:80 token-profit-calculator
```

访问：

```text
http://localhost:8080
```

## 从 GHCR 拉取镜像

GitHub Actions 会在推送到 `main` 后构建镜像：

```text
ghcr.io/sherry56/token-profit-calculator:latest
```

服务器运行：

```bash
docker login ghcr.io
docker pull ghcr.io/sherry56/token-profit-calculator:latest
docker run -d --name token-profit-calculator -p 8080:80 ghcr.io/sherry56/token-profit-calculator:latest
```

如果仓库或镜像保持私有，需要使用有 `read:packages` 权限的 GitHub token 登录 GHCR。
