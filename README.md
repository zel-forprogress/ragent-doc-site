# Ragent 文档站

这是基于 `D:\git-localRepository\ragent\docs\ragent-open-study-guide.md` 生成的本地阅读网站。

## 打开方式

直接用浏览器打开：

```text
D:\git-localRepository\ragent-doc-site\index.html
```

## 文件说明

| 文件 | 说明 |
|---|---|
| `index.html` | 已生成的完整文档页面 |
| `styles.css` | 页面样式 |
| `site.js` | 左侧目录、搜索、阅读进度、回到顶部 |
| `build-site.mjs` | 从 Markdown 重新生成 HTML 的脚本 |

## 重新生成

如果修改了 Ragent 项目里的 Markdown 文档，进入本目录执行：

```powershell
node .\build-site.mjs
```
