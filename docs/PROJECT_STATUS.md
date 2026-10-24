# 项目状态 — F05 / P3 工作记录（2026-10-25）

## 交接基线核实

- GitHub 基线读取时 `main` HEAD 为 `4b7d4b5db11df1b047a6cf7072595171c4f7e3e6`；交接 SHA `7539a1e902307531998bde8549f5357a03d8bb6c` 已过时。仓库基线只有文档，无应用源码。
- 本轮已将当前 Site 源码、测试和报告添加到 GitHub 功能分支 `feat/p3-f05-reviewed-market-data`，Draft PR #1 打开：[PR #1](https://github.com/jaronhoh/margin-share-calculator/pull/1)。PR 对比 `main` ahead 24 commits / behind 0，未合并。
- **GitHub Actions：PASS**，最新 `Site source tests` run 6 / run ID `40114613077`，PR 分支 HEAD `ff1d9c50f4ac58e77c4168c61b319a9bacadc8fd`。
- 现有 Site：Version 30，URL `https://margin-share-calculator-poc-20261021.savoryboar128.chatgpt.site/`，custom Owner-only，唯一 Owner，外部访客/群组/编辑者均为0，访问策略 revision 1。此轮未修改线上 Site。
- Site 源码检出初始 HEAD `34e19990cd6f6101ec43fffacf2f862d62759119`；该检出本地 `main` 比其本地 `origin/main` 多一个历史提交。本轮工作另在 `feat/f05-stock-price-p3`。

## F05 股票价格图表

- **实现（本地分支）**：在现有趋势图叠加回测 `price` 序列；价格使用单独的右外刻度，LSR 保留右内刻度；新增可切换价格图例和 Tooltip 行；无有效价格处保持空段，不插值。组件仍使用现有 SVG 和主题 token。
- **PASS**：脚本语法检查、`git diff --check`；27项引擎测试；48,216项合成日账比较；276,096项 P0 oracle 断言及17,256项财富守恒；24条股息、费用和整手回归测试。
- **PASS**：新增 F05 图表回归检查，确认曲线绑定回测价格、独立价格轴、图例开关、Tooltip 标签和缺失值留白；并修正完全无价格数据时价格轴会出现非有限刻度的问题。
- **PASS**：完整 Node 自动化回归 8/8 测试文件通过（包括 P0 oracle 与 F05 静态检查）。
- **PASS GitHub CI**：Follow-up `Site source tests` run 10 / run ID `40115049863`，测试提交 `4f8c816e849c31e0024a34ab2c846a958d36888a` 成功。
- **BLOCKED**：真实 Chromium 图表交互/桌面与移动/亮暗主题验收。Playwright Chromium 受本机进程权限阻止；本地 HTTP 服务启动受限；应用内浏览器的 `file:` 访问被安全策略拒绝。没有以非浏览器检查代替视觉验收。
- **NOT RUN**：`tests/excel-regression.mjs` 需要工作簿路径参数，本次无该参数。

## P1 / P2 审计边界

- **P1 市场规则：BLOCKED**。现有审计仅核实 17/24 条股息日期与金额；发现 2 条金额不一致，另有 5 条日期证据不完整。缺少完整 Bursa 交易日历及历史融资费率/合约证据。不得将现有数据描述为已完整核验。
- **P2 Excel 等价性：计算测试 PASS，Excel 等价 BLOCKED**。引擎回归与独立数值检查通过；仍存在实质性 Excel 对比差异，且工作簿曾出现修复警告。此轮未改变 P1/P2 财务规则，也未声称与 Excel 完全一致。

## P3 行情/API 与安全判断

- **Yahoo Chart 实测（2026-10-25）**：浏览器直接打开 `1155.KL` 的历史区间请求成功，返回 MYR、`Asia/Kuala_Lumpur`、Unix 时间戳、原始 `close`、单独 `adjclose` 及股息事件。请求范围 2015-01-01 至 2026-10-25，返回 2,907 个交易日价格记录（2015-01-02 至 2026-10-23）；Yahoo 响应不含周末/休市日，不能直接满足引擎要求的连续日历日输入。响应有24项股息、合计 RM6.88；2021-05-28 的事件为 RM0.385，显示为 Ex-Date 而非 2021-06-28 支付日。端点未返回 splits 事件键，不能据此证明公司行动历史完整。直连实测只证明当时端点返回数据，不证明正式 API 支持、数据授权或稳定性。
- **CORS：BLOCKED**。当前终端无法解析 Yahoo 域名；尝试用浏览器跨来源测试页时，本机浏览器安全策略拒绝 `file:` 页面及本地 HTTP 服务，未绕过限制。不能据此声称 Site CORS 可用或不可用。API 错误、空数据、限流和 Sites 运行时兼容性也未得到真实测试。
- Yahoo Chart URL 是未见公开正式文档/授权的网页端点。Yahoo 当前服务条款禁止在未取得明确事先许可的情况下通过自动化方式采集服务数据（[Yahoo Terms of Service](https://legal.yahoo.com/us/en/yahoo/terms/otos/index.html)）；官方 Developer API 条款适用于其正式 API，不能视为该 Chart 端点的授权（[Yahoo Developer API Terms](https://legal.yahoo.com/us/en/yahoo/terms/product-atos/apiforydn/index.html)）。因此没有接入自动抓取或长期缓存。Bursa 官方历史数据包需订阅并联系 Information Services（[Bursa Historical Data Packages](https://www.bursamalaysia.com/market_information/market_data/historical_data_packages)，[Information Services Guidelines](https://www.bursamalaysia.com/sites/5d809dcf39fba22790cad230/assets/6440f97839fba259236ba5ba/ISLA_Guidelines_V1.1_01_Apr_2023.pdf)）；本轮不购买或引入服务。
- **专业建议**：先以带来源/日期/人工修订字段的 Excel/CSV 导入和差异预览作为可发布数据通道；每批市场数据在人工核验后进入候选快照。自动更新应选择可书面授权持久化及回测用途的数据服务，或取得数据方明确许可后接入。不能以公开 CORS Proxy 或未授权 Yahoo 网页端点作为生产数据管道。
- **API：部分实测，生产接入 BLOCKED**。直接浏览器请求 PASS（2,907 个交易日及24项股息）；CORS BLOCKED，限流、错误/空响应及生产 Sites 兼容性 NOT RUN；条款授权未确认。未接入自动 API，也未将 Yahoo 网页端点用于生产。
- **本地数据更新流程：已实现**：接受带 `Date`/`Close`（或中文列名）的 CSV；检查文件大小、格式、日期、价格和重复项；按新增/相同/冲突分类；冲突默认不勾选，已有人工修正有标识；候选快照禁止静默补齐缺日；对现有每日行情、股息和财务结果作九项比较；只在用户最终确认后应用，失败会回滚；候选前状态若发生变化则拒绝旧确认。更新来源、时间、文件名与人工确认日期写入 JSON 快照，支持导入；CSV 不改股息。
- **数据限制**：Site 回测要求连续日历日行情（最多5,000天）。交易日 CSV 若缺周末/节假日价格会被拒绝，不会自动前值填补。建议用经过授权且可导出连续每日收盘价的来源；若数据源只提供交易日，应另行批准明确的非交易日处理规则后再扩展。
- Yahoo 响应的股息事件为除息事件，未接入 P3 回测更新；付款日期/重复事件核验、拆股历史、完整交易日历仍待经授权数据源及人工核准。原24条股息和既有入账规则未修改。

## 本轮验证与发布剩余状态

- **PASS**：CSV 解析/校验、KL ISO 日期、重复数据拒绝、新增/相同/冲突识别、不可变候选快照、人工日期来源留痕、缺日拒绝、JSON 来源校验；F05 静态回归；引擎27项；每日合成回归48,216项；P0 oracle 276,096项及17,256项财富守恒；股息、费用、整手回归。Yahoo 直连历史响应及 Ex-Date 字段核对通过。
- **BLOCKED**：浏览器真实应用交互/响应式/亮暗主题；本机 Chromium 启动与本地来源访问受限。Yahoo CORS 也未能完成测试。没有绕过浏览器安全边界。
- **NOT RUN**：Excel 回归（需指定工作簿）；Yahoo API 错误/限流/空响应及 Sites 实际兼容性验证。

## 发布与剩余状态

- Sites：**未部署**；生产版本、URL、访问权限与数据均保持不变。
- 本地 Sites 源码分支 `feat/f05-stock-price-p3` 最新提交 `2e5e8521e7e17394eb82f2295c468d94f1f35cd5`；GitHub 对应应用快照位于 PR #1 分支。PR HEAD `ff1d9c50f4ac58e77c4168c61b319a9bacadc8fd`，尚为 Draft、未合并；自动 API/CORS 授权与浏览器验收门槛仍未解决。
- Sites 兼容性：实现只使用现有静态 HTML/ES modules、File API 和本地 JSON 下载，不需要后台服务；CSV/JSON 导入仍需真实 Site 浏览器验收。已知数据约束见上文。
- 回滚：本地功能分支与提交可回退；用户会话内导入可恢复默认；已确认数据需先导出 JSON 快照，关闭页面不会持久保存。Site 部署未进行，无线上回滚需求。
- 总体：F05/P3 CSV 通道已在本地实现，但真实浏览器验收与自动 API 均未完成，P1/P2 仍有阻塞。**当前不满足部署条件**，现有 Site 保持不变。
