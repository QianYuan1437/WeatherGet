# 北京海淀区天气预报 Weather Get

一个基于 GitHub Actions 的北京海淀区天气预报网页，每小时自动更新天气数据。

A GitHub Actions-powered weather forecast webpage for Beijing Haidian District, auto-updating every hour.

## 功能 Features

- 📍 **实时天气** - 显示当前温度、湿度、风速、气压等
- 🌡️ **24小时预报** - 每小时天气预报
- 📅 **5日预报** - 未来五天天气预报
- 🌙 **深色模式** - 支持白天/黑夜主题切换
- 🌍 **中英双语** - 支持中文/英文界面切换
- 🔄 **自动更新** - 每小时通过 GitHub Actions 自动抓取最新数据

## 部署 Deployment

### 1. Fork 本仓库 / Fork this repository

### 2. 启用 GitHub Pages
- 进入仓库 **Settings** > **Pages**
- Source 选择 **Deploy from a branch**
- Branch 选择 **main**，文件夹选择 **/ (root)**
- 点击 **Save**

### 3. 访问你的网站
等待几分钟后，访问 `https://你的用户名.github.io/WeatherGet/`

## 项目结构 Project Structure

```
WeatherGet/
├── index.html          # 主页面
├── css/
│   └── style.css       # 样式文件
├── js/
│   └── main.js         # 主脚本
├── data/
│   └── weather.json    # 天气数据（自动生成）
├── scripts/
│   └── fetch-weather.js # 数据抓取脚本
├── .github/
│   └── workflows/
│       └── weather-update.yml # GitHub Actions 工作流
├── package.json
└── README.md
```

## 数据来源 Data Source

- [中国气象局](https://weather.cma.cn/web/weather/54399.html)
- China Meteorological Administration

## 技术栈 Tech Stack

- HTML5 + CSS3 + JavaScript
- GitHub Actions (自动化)
- GitHub Pages (托管)

## 本地开发 Local Development

```bash
# 克隆仓库
git clone https://github.com/你的用户名/WeatherGet.git
cd WeatherGet

# 本地运行（需要静态服务器）
npx serve .

# 或者直接打开 index.html
```

## 自动化说明 Automation

GitHub Actions 工作流配置为：
- **计划执行**: 每小时整点执行 (`0 * * * *`)
- **手动触发**: 支持 workflow_dispatch
- **推送触发**: 推送到 main 分支时执行

## 许可证 License

MIT License
