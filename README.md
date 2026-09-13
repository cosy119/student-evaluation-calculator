# 大学生综测计算器

一个使用 React、TypeScript 和 Vite 构建的本地网页应用，支持动态模块、实时计算、本地自动保存与 Excel 导出。

## 在线使用

[打开大学生综测计算器](https://cosy119.github.io/student-evaluation-calculator/)

## 双击启动

直接双击 `启动综测计算器.bat`。应用服务会在后台运行，并自动打开浏览器，无需使用终端。启动器使用纯英文批处理指令，避免 Windows 中文编码导致启动失败。

不再使用时，双击 `停止综测计算器.bat` 即可关闭后台服务。

首次启动时，如果依赖尚未安装，启动程序会自动完成安装。后台运行日志保存在 `.app.log`。

## 本地运行

```bash
npm install
npm run dev
```

浏览器打开终端显示的地址，默认是 `http://localhost:5173`。

## 检查与构建

```bash
npm test
npm run build
```

生产文件生成在 `dist` 目录中。
