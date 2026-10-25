# 项目状态 — F05 / P3 工作记录（2026-10-25）

## 交接基线核实

- GitHub 基线读取时 `main` HEAD 为 `4b7d4b5db11df1b047a6cf7072595171c4f7e3e6`；交接 SHA `7539a1e902307531998bde8549f5357a03d8bb6c` 已过时。仓库基线只有文档，无应用源码。
- 本轮已将当前 Site 源码、测试和报告添加到 GitHub 功能分支 `feat/p3-f05-reviewed-market-data`，Draft PR #1 打开：[PR #1](https://github.com/jaronhoh/margin-share-calculator/pull/1)。PR 对比 `main` ahead 24 commits / behind 0，未合并。
- **GitHub Actions：PASS**，`Site source tests` run 37 / run ID `40117557075`，8/8 测试文件通过，运行于 P3 源码/测试 HEAD `9202648699493ffe1c9493468c0997eab91c5c79`。
- 现有 Site：开始时 Version 30；此前 F05 发布后为 **Version 32**（非本轮 P3 部署），URL `https://margin-share-calculator-poc-20261021.savoryboar128.chatgpt.site/` 不变。此前部署复核仍为 custom Owner-only，唯一 Owner，外部访客/群组/编辑者均为0，访问策略 revision 1；不含本轮 P3 功能。
- Site 源码检出初始 HEAD `34e19990cd6f6101ec43fffacf2f862d62759119`；该检出本地 `main` 比其本地 `origin/main` 多一个历史提交。本轮工作另在 `feat/f05-stock-price-p3`。

## F05 股票价格图表

- **实现（本地分支）**：在现有趋势图叠加回测 `price` 序列；价格使用单独的右外刻度，LSR 保留右内刻度；新增可切换价格图例和 Tooltip 行；无有效价格处保持空段，不插值。组件仍使用现有 SVG 和主题 token。
- **PASS**：脚本语法检查、`git diff --check`；27项引擎测试；48,216项合成日账比较；276,096项 P0 oracle 断言及17,256项财富守恒；24条股息、费用和整手回归测试。
- **PASS**：新增 F05 图表回归检查，确认曲线绑定回测价格、独立价格轴、图例开关、Tooltip 标签和缺失值留白；并修正完全无价格数据时价格轴会出现非有限刻度的问题。
- **PASS**：完整 Node 自动化回归 8/8 测试文件通过（包括 P0 oracle 与 F05 静态检查）。
- **PASS GitHub CI**：Follow-up `Site source tests` run 19 / run ID `40115682576`（8/8）成功。
- **PASS**：通过本地 Chromium 实际验收 1440×900 与 390×844、亮/暗主题共4组；价格轴6个标签在图表边界内，图例可隐藏/恢复，Tooltip 显示准确日期与 RM9.12，Escape 可关闭，浏览器错误0。
- **PASS**：日期范围 2015-01-01 至 2015-01-03 同步到趋势图和逐日流水；曲线三点价格为 RM9.17/RM9.12/RM9.12。周末提示明确标记沿用 2015-01-02 收盘价。
- **修复并复验**：首轮手机验收发现图例导致页面横向溢出；改为两列自适应、允许换行后，390px 视口 `scrollWidth` 不大于 `clientWidth`，亮暗主题均通过。
- **已部署**：F05-only 源码提交 `a086b353b6c1627c79d3851d7c1957b10fb0c26a`，Sites Version 32，部署 `appgdep_6adcea6455bc8191a110c499ae457bf2` 状态 succeeded；仍为原 Site URL 与 Owner-only 权限。
- **NOT RUN**：`tests/excel-regression.mjs` 需要工作簿路径参数，本次无该参数。

## P1 / P2 审计边界

- **P1 市场规则：BLOCKED**。现有审计仅核实 17/24 条股息日期与金额；发现 2 条金额不一致，另有 5 条日期证据不完整。缺少完整 Bursa 交易日历及历史融资费率/合约证据。不得将现有数据描述为已完整核验。
- **P2 Excel 等价性：计算测试 PASS，Excel 等价 BLOCKED**。引擎回归与独立数值检查通过；仍存在实质性 Excel 对比差异，且工作簿曾出现修复警告。此轮未改变 P1/P2 财务规则，也未声称与 Excel 完全一致。

## P3 行情/API 与安全判断

- **2026-10-25 Yahoo 接入继续开发**：新增“从 Yahoo Finance 更新”按钮，使用 Chart 请求参数获取 Maybank `1155.KL`；解析只采用未调整 `close`，日期转换为 `Asia/Kuala_Lumpur`，检查错误、空数据、重复日期及异常价格。API 价格进入现有差异预览/人工选择/候选回测/九指标/确认保存流程。周末沿用价会单独标识；API 未提供的工作日不会补造，而会阻止候选并说明缺日。股息事件可转入现有股息审核，Ex-Date 保持独立且 Payment Date 必须人工确认；拆股/股息来源元数据随 JSON 快照保存。
- **实现测试**：新增 `tests/yahoo-chart.test.mjs`，验证 Chart 结构、KL 日期、原始 Close、除息/付款日分离、拆股事件、错误/空数据/429/重复日及请求参数；完整测试 **9/9 文件通过**。直接打开 Yahoo Chart 的浏览器实测成功，返回 Maybank MYR 日线数据。
- **仍待验证**：浏览器安全策略拒绝了跨域测试页，未绕过限制。因此 Site 页面中的 fetch 尚未完成 CORS/生产运行时验证；GitHub PR 和 Sites 发布也尚未包含本次新改动。若实际 Site 阻止跨域，界面会显示请求失败，CSV 后备仍可用。
- **提交与发布状态（最新）**：代码已本地提交 `91bb081bb805d0a67f599e6e5b0a65e4391238e4`，源码及状态报告已更新到 Draft PR #1（远端 head `b1ffea26e9606d26b8271ab601456f3c783fa871`）。自动化回归本地 9/9 通过；该远端 head 未产生新的 GitHub Actions run，之前 CI 仅对应旧代码。Sites 仍为 Version 32、未部署本次 P3。Sites 源仓库连接因 DNS 失败；提权发布请求随后被自动审批拒绝，要求对访问凭据并修改生产 Site 的发布操作另行审批。未尝试绕过。
- **规则边界**：Yahoo 不返回除息日以外的付款日；不自动将 Ex-Date 入账。没有 Bursa 休市日历时，缺失工作日不前值填补，候选明确失败；周末前值只标注为沿用价格。原始24条股息及两项审计金额差异未改动。

- **2026-10-25 持续开发更新**：价格 CSV 的差异审核流程已扩展为“候选回测→九项比较→最终确认→本地快照保存”，保留人工价格来源及既有修正，使用 localStorage 原子保存并在失败时恢复原快照/会话。页面重新载入后会校验并恢复已确认快照；恢复默认同时清除已保存快照。
- 新增股息 CSV 候选审核：分别保留 Ex-Date、Record Date、Payment Date；未提供且未人工确认付款日的事件不能进入候选回测。相近日期/金额的疑似重复事件显示既有日期、金额及来源，必须显式确认；导入股息先做候选回测和九项比较，最终确认才写入快照。原始 Excel 24 条及其人工修改不被自动更改。
- **本地 UI 实测**：股息 CSV 先拒绝缺付款日；补录付款日并确认疑似重复后显示9项前后比较；取消仍为24条。价格 CSV 显示新增差异、生成完整回测比较、取消后原结束日不变。另一轮在 localhost 以合成 CSV 完成最终确认，显示“已保存并应用”；重载后恢复到2026-10-24的4315日快照，随后用恢复默认清除测试快照。
- **仍未完成：自动市场 API 接入。** 当前环境新的终端实测无法解析 Yahoo 域名；既有只读浏览器响应证明 Chart URL 曾返回数据，但它不是确认授权的正式接口，响应仅为交易日且除息事件不等于付款日。Yahoo 官方服务条款限制未经明确事先许可的自动采集（见[Yahoo Terms](https://legal.yahoo.com/us/en/yahoo/terms/otos/index.html)）；不接入抓取、缓存或代理。需由用户提供有书面授权且无需新增未经批准付费服务的数据源，方可完成自动获取环节。
- **更新失败回滚边界**：单元测试覆盖存储写入失败和回调失败并恢复旧快照；浏览器实测覆盖预览、回测比较、取消及成功持久化/重载，不包括浏览器 localStorage 配额错误注入。

- **Yahoo Chart 实测（2026-10-25）**：浏览器直接打开 `1155.KL` 的历史区间请求成功，返回 MYR、`Asia/Kuala_Lumpur`、Unix 时间戳、原始 `close`、单独 `adjclose` 及股息事件。请求范围 2015-01-01 至 2026-10-25，返回 2,907 个交易日价格记录（2015-01-02 至 2026-10-23）；Yahoo 响应不含周末/休市日，不能直接满足引擎要求的连续日历日输入。响应有24项股息、合计 RM6.88；2021-05-28 的事件为 RM0.385，显示为 Ex-Date 而非 2021-06-28 支付日。端点未返回 splits 事件键，不能据此证明公司行动历史完整。直连实测只证明当时端点返回数据，不证明正式 API 支持、数据授权或稳定性。
- **CORS：BLOCKED**。当前终端无法解析 Yahoo 域名；尝试用浏览器跨来源测试页时，本机浏览器安全策略拒绝 `file:` 页面及本地 HTTP 服务，未绕过限制。不能据此声称 Site CORS 可用或不可用。API 错误、空数据、限流和 Sites 运行时兼容性也未得到真实测试。
- Yahoo Chart URL 是未见公开正式文档/授权的网页端点。Yahoo 当前服务条款禁止在未取得明确事先许可的情况下通过自动化方式采集服务数据（[Yahoo Terms of Service](https://legal.yahoo.com/us/en/yahoo/terms/otos/index.html)）；官方 Developer API 条款适用于其正式 API，不能视为该 Chart 端点的授权（[Yahoo Developer API Terms](https://legal.yahoo.com/us/en/yahoo/terms/product-atos/apiforydn/index.html)）。因此没有接入自动抓取或长期缓存。Bursa 官方历史数据包需订阅并联系 Information Services（[Bursa Historical Data Packages](https://www.bursamalaysia.com/market_information/market_data/historical_data_packages)，[Information Services Guidelines](https://www.bursamalaysia.com/sites/5d809dcf39fba22790cad230/assets/6440f97839fba259236ba5ba/ISLA_Guidelines_V1.1_01_Apr_2023.pdf)）；本轮不购买或引入服务。
- **专业建议**：先以带来源/日期/人工修订字段的 Excel/CSV 导入和差异预览作为可发布数据通道；每批市场数据在人工核验后进入候选快照。自动更�