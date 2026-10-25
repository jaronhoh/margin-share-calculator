# Payment Date 自动核验回归记录（2026-10-25）

## 实现

- 每次 Yahoo 回测成功后，Site Worker 按当前股票代码读取 `www.klsescreener.com/v2/stocks/view/{code}` 的公开股息历史；浏览器与 Worker 缓存时长均为 6 小时。
- 支持四位及五位数字 Bursa 代码，例如 `1155.KL`、`1066.KL`、`03050.KL`。来源页股票代码与请求不匹配即拒绝。
- 只把 `Currency`、`RM` 或 `MYR` 单位行作为每股货币候选；`Percentage` 行排除，避免把百分比误当 RM/股。未知/无效行不创建付款日候选。
- 通过同股票代码、Yahoo Ex-Date、每股金额匹配。金额差异、跨股票数据、付款日冲突不自动选定。KLSE Screener 记录为第三方未核实候选，不标为 Bursa 官方数据。
- 用户须逐条勾选、选择新增或关联原始 MAYBANK 行、查看九项回测指标并明确确认。确认后实际 Payment Date 才进入回测；来源、除息日、金额、代码、确认状态和可选原始行快照随 JSON 保存。未确认候选不改变回测。
- MAYBANK Table1 的原始24笔股息保持不变。支持其他 Bursa 股票；其他股票不会套用 MAYBANK 24笔。

## 来源抽查与覆盖边界

- [MAYBANK 1155 股票页](https://www.klsescreener.com/v2/stocks/view/1155) 当前可见 Announced、EX Date、Payment Date、Amount 和 Indicator 栏；例如 2025-03-12 Ex-Date、2025-03-26 Payment Date、RM0.3200。
- [RHB Bank 1066 股票页](https://www.klsescreener.com/v2/stocks/view/1066) 当前可见同样字段；例如 2025-03-21 Ex-Date、2025-04-09 Payment Date、RM0.2800。页面旧数据还显示 Percentage 单位，因此实现已明确过滤这类行。
- 当前网页展示历史可追溯到至少 2002 年（所查两代码页面）；这只代表页面目前可见记录的起点，不证明每个股票历史完整，也不证明第三方记录与公司公告完全一致。用户仍须逐笔查看原始页面后确认。
- 查询来源为 KLSE Screener，所有结果皆标记第三方来源；其资料不等同 Bursa Malaysia 官方确认。未绕过登录、验证码或访问控制。

## 实际测试结果

- **Node：PASS** — `node --test site-source/tests/*.test.mjs`，36/36 通过；包括 4,314 日两策略财务回归、276,096 项 P0 数值断言、17,256 项财富守恒、原始24笔股息不变、Payment Date 解析/匹配/冲突/单位/四位及五位代码/Worker/JSON 验证。
- **Chromium：PASS** — `site-source/tests/klsescreener-payment-date-ui.cjs`。使用隔离的 mock Yahoo 与 KLSE Screener 响应实际操作页面；验证匹配、来源链接、候选状态、九项指标预览、人工确认、付款日入账、JSON 导出/导入往返及页面错误数为0。
- **Worker build：PASS** — `node site-source/tools/build-site-worker.mjs`。
- **差异检查：PASS** — `git diff --check`。
- **CI / PR / Production Site：待发布** — 需在提交、推送后记录新的 Actions 结果和现有 Site 部署状态；本地 fixture 测试不代表生产源站可用性。

## 代码入口

- `site-source/worker/index.js`
- `site-source/dist/klsescreener-payment-date.mjs`
- `site-source/dist/klsescreener-dividends.mjs`
- `site-source/dist/index.html`
- `site-source/tests/klsescreener-payment-date.test.mjs`
- `site-source/tests/klsescreener-payment-date-ui.cjs`


## 补充回归：MAYBANK 默认日期与可编辑性（2026-10-25）

- 对照用户给出的24行 Ex-Date、Payment Date、Dividend 与 MAYBANK 原始 Excel 来源行逐项匹配；用户提供的 KLSE Screener 页面是日期数据来源，本文不将其描述为 Bursa 官方休市/付款日公告。
- Ex-Date、付款日、金额均可修改；旧快照迁移只填未编辑原始行的缺省记录，用户值优先；其他股票不套用 MAYBANK 日期。
- 单元测试、Chromium 单表端到端测试、P0 与历史回测均在本地工作副本通过。PR 源码及测试已同步至 Site Version 64 对应实现；最新 CI 状态以项目状态记录为准。
