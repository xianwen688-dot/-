# 豆饼投资研究工作室

本地优先的 A 股、A 股 ETF、美股 ETF 看盘与研究 PWA。

## 能做什么

- 看 A 股主要指数、自选股、A 股 ETF、板块、资金流和快讯。
- 跟踪美股 ETF 报价和日 K 线。
- 用本地 IndexedDB 保存自选、行情缓存、提醒规则和模型反馈。
- 用模型版本、因子贡献、置信度和数据自检辅助研究复盘。

## 边界

这是投资研究工具，不接券商、不下单、不输出确定性买卖指令。

## 开发

```powershell
npm install
npm run dev
```

打开 `http://127.0.0.1:5173`。

## 构建

```powershell
npm run build
npm run preview
```

## 数据源

- A 股/A 股 ETF：本机 `opencli eastmoney`
- 美股 ETF 报价：本机 `opencli sinafinance`
- 美股 ETF K 线：Yahoo Finance chart API fallback
- iFinD：预留适配器，默认关闭
