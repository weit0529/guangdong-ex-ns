# 广东（含港澳）制霸

这是一个用于 GitHub Pages 的广东（含香港、澳门）制霸地图项目。

## 本地运行

```bash
npm install
npm run dev
```

## 上传到你的 GitHub 仓库

你的目标仓库是：

```txt
https://github.com/weit0529/guangdong-ex-ns
```

如果你已经解压了这个项目，在项目根目录执行：

```bash
git init
git add .
git commit -m "add guangdong hk macau map"
git branch -M main
git remote add origin https://github.com/weit0529/guangdong-ex-ns.git
git push -u origin main
```

## 开启 GitHub Pages

进入 GitHub 仓库页面：

```txt
Settings -> Pages -> Build and deployment -> Source
```

选择：

```txt
GitHub Actions
```

然后到 `Actions` 页面等待构建完成。

发布地址一般是：

```txt
https://weit0529.github.io/guangdong-ex-ns/
```

## 如果页面空白

优先检查 `vite.config.ts`：

```ts
base: '/guangdong-ex-ns/',
```

这里必须和 GitHub 仓库名完全一致。
