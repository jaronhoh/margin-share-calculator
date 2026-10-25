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
- **专业建议**：先以带来源/日期/人工修订字段的 Excel/CSV 导入和差异预览作为可发布数据通道；每批市场数据在人工核验后进入候选快照。自动更新应选择可书面授权持久化及回测用途的数据服务，或取得数据方明确许可后接入。不能以公开 CORS Proxy 或未授权 Yahoo 网页端点作为生产数据管道。
- **API：部分实测，生产接入 BLOCKED**。直接浏览器请求 PASS（2,907 个交易日及24项股息）；CORS BLOCKED，限流、错误/空响应及生产 Sites 兼容性 NOT RUN；条款授权未确认。未接入自动 API，也未将 Yahoo 网页端点用于生产。
- **本地行情更新流程：已开发并测试主要路径**：接受带 `Date`/`Close`（或中文列名）的 CSV；检查文件大小、格式、日期、价格和重复项；按新增/相同/冲突分类；冲突默认不勾选，已有人工修正有标识；候选快照禁止静默补齐缺日；比较九项回测指标；确认后持久保存完整 JSON 兼容快照，失败时可回滚，候选前状态变化会拒绝旧确认。更新来源、时间、文件名与人工确认日期写入快照。
- **股息审核：已开发并测试主要路径**：CSV 候选单独保留 Ex-Date、Record Date、Payment Date；未确认 Payment Date 的事件不能进入回测；疑似重复须显示来源并额外勾选确认；合并的事件必须经过候选回测和九项比较，取消不改变现有24条股息。
- **数据限制**：Site 回测要求连续日历日行情（最多5,000天）。交易日 CSV 若缺周末/节假日价格会被拒绝，不会自动前值填补。建议用经过授权且可导出连续每日收盘价的来源；若数据源只提供交易日，应另行批准明确的非交易日处理规则后再扩展。
- Yahoo 响应的股息事件为除息事件；未接入 P3 自动回测更新。付款日期/重复事件人工审核通道已开发；拆股历史、完整交易日历仍待经授权数据源及人工核准。原24条股息和既有入账规则未修改。

## 本轮验证与发布剩余状态

- **PASS**：CSV 解析/校验、KL ISO 日期、重复数据拒绝、价格异常拒绝、新增/相同/冲突识别、人工价格保护、不可变候选、股息重复提示/显式确认、Ex-Date 与 Payment Date 强区分、原24条不变、写入及回调失败快照回滚、JSON 来源校验；完整 Node 自动化 8/8 文件通过。
- **PASS**：本地浏览器价格更新预览、候选回测九指标比较、取消不变、最终确认保存及重载恢复；股息缺付款日拒绝、重复候选核准、九指标比较及取消不变。
- **BLOCKED / NOT RUN**：Yahoo 自动 API 因访问授权未确认及本环境 DNS/CORS/Sites 限制而未接入；真实接口故障/429/空响应和 Sites Runtime API 实测未运行。保存配额失败用单元测试覆盖，未在浏览器注入。
- **NOT RUN**：Excel 回归（需指定工作簿）。

## 发布与剩余状态

- Sites：**F05 已部署**至 Version 32（部署 succeeded）；原生产 URL、Owner-only 访问权限及现有数据保持不变。P3 API/股息审核流程未部署。
- 本地 Sites 源码分支 `feat/f05-stock-price-p3` 包含实现提交 `1bd59bd`；GitHub PR #1 的源码/测试提交 `9202648699493ffe1c9493468c0997eab91c5c79` 已通过 CI run37。之后的 GitHub 提交仅同步状态文档，未改动测试通过的代码。PR 保持 Draft、未合并。
- Sites 兼容性：实现只使用现有静态 HTML/ES modules、File API 和本地 JSON 下载，不需要后台服务；CSV/JSON 导入仍需真实 Site 浏览器验收。已知数据约束见上文。
- 回滚：本地功能分支与提交可回退；用户会话内导入可恢复默认；已确认行情快照保存在本地浏览器，可导出 JSON 备份并用恢复默认清除。Site 部署未进行，无线上回滚需求。
- 总体：F05 已开发、测试、提交并部署至 Version 32。P3 的 CSV 差异审核、股息人工确认、候选回测对比与快照持久化已在本地实现，自动化及本地浏览器主要路径通过；Yahoo 自动 API 因授权/网络约束仍未接入。当前 P3 尚非自动行情 API 完整交付。GitHub PR #1 仍 Draft/未合并，P3 未部署 Sites。

---

# 最新状态：P3 Yahoo 同源接入与 F05（2026-10-25，取代上述较早的 P3 发布状态）

- **已开发**：在原有 Site Worker 中提供同源 `/api/yahoo-chart` 路由，限定 `1155.KL`、校验日期范围，并将 Yahoo 429/上游失败传回界面；现有 UI 继续只使用未调整 `close`，走差异预览、候选回测、九指标对比、人工确认、保存/回滚。未增加付费服务、外部代理或后台服务器。F05 股票价曲线保持在现有趋势图，原指标、独立价格轴、Tooltip、图例与缺值留白规则均保留。
- **已测试**：完整本地自动套件 10/10 文件通过、0失败；含27项引擎检查、48,216项逐日数值检查、276,096项独立 P0 oracle 检查、17,256项财富守恒检查、24条股息保护，以及行情/股息回滚、JSON、Yahoo 和 Worker 检查。`git diff --check` 通过。
- **Yahoo / Site 实测**：直接 Chart 数据返回 Maybank MYR 与 `Asia/Kuala_Lumpur` 的收盘价；新增同源 Worker 消除浏览器跨域请求路径。生产 Site 的更新按钮成功取回数据并运行候选回测。差异预览为新增2条、相同0条、冲突11条；候选回测九项比较成功。因11条既有日期收盘价冲突，已取消此次更新，没有保存候选，也没有改动原始价格或股息快照。取消后原结束日期仍为2026-10-23。
- **价格/股息边界**：本轮不自动接受价格冲突、不覆盖人工价格、不以 Adj Close 替代 Close；非交易日沿用价明确标注，缺价不伪造。Yahoo 股息 Ex-Date 不当作 Payment Date；Yahoo 没有确认付款日期的事件不会计入回测。现有24条 Excel 股息记录及两项金额差异保持不变。
- **已提交到 Sites 并部署**：既有 URL 保持 `https://margin-share-calculator-poc-20261021.savoryboar128.chatgpt.site/`，部署 Version 36，源提交 `300a5ec009042b0b6cfca6ec6abd1ba002adafe9`，部署 `appgdep_6adcf5548b5081918ceb7e1fa6f99b4b` 成功。未创建 Site、未改 URL/Owner-only 权限，也未应用任何行情数据。
- **GitHub 状态**：PR #1 已合并；Squash commit `ae3b48b37253762d489bd668d2bfb53a0d2de13c`。GitHub Actions `Site source tests` run 50（ID `40120053273`）在功能代码提交 `0ad98a8009af803e3f49b8791cedd14eec95a0c8` 上成功；合并前 PR 显示可合并且无待评审。Sites 部署仍是独立状态。
- **仍需关注**：11条 Yahoo/现有收盘价冲突需人工选定来源；Yahoo 可能限流，Worker 将429显示为错误并保留 CSV/人工导入。历史公司行动及缺少交易日历的日期不作推断。

---

# 最新状态：关闭网页后保留最后一次计算器参数（2026-10-25）

- **已开发**：计算器在本浏览器本地自动保存全部回测输入、配股/费用模式、已确认的行情快照及来源、股息和人工价格修正、主题、价格曲线显示状态与流水筛选。修改后短暂防抖保存，离开页面时再尝试即时保存；重开页面自动恢复并重算。不会把用户数据上传到服务器。
- **已测试**：自动保存/读取/清除、完整配置往返、损坏 JSON、非法快照、浏览器存储配额失败等单元测试通过；本地浏览器实测改年利率到 6.25%，页面重载后参数面板恢复 6.25%，页面提示已恢复。完整套件 11/11 文件通过，0失败，`git diff --check` 通过。
- **GitHub**：PR #2 已合并至 `main`，Squash commit `16753f0053d4de08fd8615d4a4310db9a638a109`；GitHub Actions `Site source tests` run 53 成功。
- **Sites**：已部署至 Version 37，部署 succeeded；源提交 `eb190a124d94bff2ff5252b13c051d6369fc2617`。原生产 URL、owner-only 权限及现有行情数据保持不变。
- **存储范围**：保存在同一浏览器配置文件的本地存储；清除浏览器网站数据、使用无痕窗口或更换浏览器/设备时不会同步。可继续使用 JSON 导出备份。
# Bursa Malaysia 休市日修复（2026-10-25）

- **实现范围**：逐日来源日历确认 2022-12-26、2023-01-02、2024-09-16、2025-01-29、2025-01-30。仅采用 Bursa 官方公告明确日期；周末、已确认休市日、正常有价工作日和未确认工作日分别分类，不将公共假期推定为交易所休市。
- **覆盖状态**：2015–2021 BLOCKED；2022–2025 PARTIAL；2026 PARTIAL。年份均未宣称完整。2024 Hari Raya 条件式公告未选定最终日期。
- **流水与引擎**：明细与 CSV 导出隐藏周末及已确认休市日，日期定位只到交易日。引擎保留每日记录和日历日利息资本化规则；周末/确认闭市日不允许交易。行情曲线、Tooltip、价格曲线及趋势线复选框保留。
- **Yahoo / CSV 安全导入**：周末和已确认休市日才以前一有效收盘价填补，并保存 carryForward、carryForwardFrom、reason 及公告来源。未确认工作日缺价、重复和无效价格拒绝；人工价格冲突须显式选择。扩充后保留5,000日限制；候选快照写入失败回滚。
- **回归**：Node 自动测试 12/12 文件通过；4,314日、两策略逐日数值比较相同；P0 276,096项数值断言和17,256项财富守恒断言通过；原24笔股息未修改。GitHub Actions run 59（ID 40149002878）PASS。
- **线上发布**：现有 Site v39 已发布成功，Site 源分支 main 提交 38300dd7d5a9d1ab1653615d77adb1a0ffa919f3。仍为原 URL 和 owner-only 权限策略 revision 1；未触碰浏览器本地数据。
- **UI 浏览器回归：NOT RUN**。生产页面先显示登录门；继续登录后遇到 Cloudflare 安全验证页面。未尝试绕过，因此移动端、Light/Dark、Tooltip 和复选框的线上浏览器验收仍待完成。
- **PR**：原 Draft PR #3 已更新至提交 c5f2e94b18c468eb7d9aa8a782613922c72843ee；Actions run 59 PASS。

## Follow-up：支持其他 Bursa 股票及本地 UI 回归（2026-10-25）

- MAYBANK `1155.KL` 是默认 Excel 快照。Yahoo 行情输入支持其他 Bursa `.KL` 代码；修复切换代码后仍显示 MAYBANK 品牌/数据说明不清的问题，在标题中区分“已选代码”和“当前已载入行情”，直接运行时把行情不匹配的具体原因显示在结果区。
- 修复 Yahoo 新代码导入只补最近周末的缺陷：现在按整个返回历史逐日扩展周末与已确认 Bursa 休市日，并保存前值日、原因和公告来源。未确认工作日缺价仍停止导入，不能猜测；2015–2021 资料覆盖仍 `BLOCKED`，2022–2026 `PARTIAL`。
- MAYBANK 原24条股息不应用到其他代码。保持差异预览、候选回测、确认保存、人工价格保护和失败回滚。
- **PASS**：自动化 13/13 个 Node 测试文件通过；P0 独立 oracle 276,096 数值断言、17,256 财富守恒断言通过；两策略4,314日历史比较不变，24笔股息保持不变。
- **PASS（本地 Chromium）**：2152/1440/1075/390 px × Light/Dark 共8组；交易日 CSV、周末/已确认休市日隐藏、月份最后交易日过滤、日期定位、图表 Tooltip、股息回归通过。`1066.KL` 对应未载入 `1155.KL` 快照时，页面显示明确解释。页面错误0。
- **Sites**：现有 owner-only Site Version 40 部署成功，源仓库 `main` 提交 `728b695de3a29f104a3404679605f181d4645268`；部署 `appgdep_6add5bab99548191ae4e4ca153371a14` succeeded。URL、访问策略 revision 1、浏览器本地数据保持不变。
- **Yahoo 数据边界**：自动化覆盖 `1066.KL` 的解析、请求构造及 Worker 转发（fixture/模拟响应）；未声称本轮实际抓取并回测了该代码的完整线上历史。未确认的历史工作日缺价按规则会阻止导入，需补充可靠闭市资料或人工核实价格。
- **GitHub**：本跟进代码和报告已同步至 Draft PR #3。Actions run 61（ID 40151136852）在功能提交 5046a1d964da0ced4be565bec3fa677ad30296d3 上 SUCCESS。Sites 与 GitHub 分支仍分别管理。

## Yahoo 驱动的 Bursa 动态日历（2026-10-25）

- 导入第一步同时读取用户所选 `.KL` 行情与 Yahoo `^KLSE` FBM KLCI 市场基准，以基准返回的交易日期更新日历。基准有价、个股缺价时拒绝自动补价；基准相邻交易日之间缺少的工作日标为 Yahoo 推定休市，附基准来源并沿用上一有效收盘价。
- 推定休市与 Bursa 官方公告确认日期分开分类。动态日历随行情快照保存/导入校验，并由回测、图表、逐日流水和 CSV 使用。流水隐藏周末及闭市日，财务引擎仍按日历日累计融资利息。
- 原安全流程仍保留：差异预览、手动价格保护、候选回测对比、用户确认和保存失败回滚；快照和日历均受 5,000 日限制。
- Node 自动化 13/13 通过；P0 276,096 数值断言和17,256财富守恒断言通过；4,314日两策略结果、原24笔股息不变。Chromium 动态导入/保存/重载用例通过；8种桌面和移动尺寸/主题组合通过。
- Yahoo `^KLSE` fixture 测试通过，未执行生产环境全历史 Yahoo 抓取。Bursa 官方年度资料覆盖仍为 2015–2021 `BLOCKED`、2022–2026 `PARTIAL`；Yahoo 推定缺市日不会冒称官方公告确认。
- 代码不更改 Payment Date、既有24条股息或财务公式。PR CI 和 Site 部署详情待发布后补录。

### 最终发布补录（2026-10-25）

- PR 提交 `ec75c9658d0de0c4098438c38ae3db286b57d404` 的 GitHub Actions run 69（`40155526509`）通过。
- 现有 owner-only Site 已部署 Version 42，部署 `appgdep_6add6cf7db608191afa618b17d5418ba` succeeded；源提交 `85bb15541238166a35bc583a8c4bfbf2b2593650`。原 URL 和访问策略 revision 1 不变。
- 动态日历实现和局部资料边界见 `docs/analysis/BURSA_MARKET_CALENDAR_REGRESSION_2026-10-25.md`。


- GitHub Actions `Site source tests` run 86（`40158244803`）SUCCESS，覆盖本次代码与测试变更。

## 逐日流水 CSV 文件名包含股票代码（2026-10-25）

- 导出文件名现在包含当前行情快照股票代码，例如 `margin-share-daily-ledger-1066.KL-2025-02-04-to-2025-02-07.csv`；代码经安全字符清理，日期范围保持不变。
- Chromium 回归覆盖默认 `1155.KL` 和非默认 `1066.KL`；Node 13/13、P0 独立回归、历史结果和 Yahoo UI 回归均通过。8 组尺寸/主题检查通过。
- 现有 owner-only Site 已部署 Version 46，源码提交 `140c069dd5c83c805a058a90cbdc915ddf52c248`，deployment `appgdep_6add78b06cf08191a9fa68df232e3976` 状态 succeeded；原 URL 不变。
- GitHub PR #3 和 Actions 本轮结果待发布后补录。


## PRD v0.16 同步与开发缺口审查（2026-10-25）

- **文档更新**：`prd/PRD文档.md` 已追加第13节状态矩阵，按最新 Work 需求纠正旧版「刷新恢复默认」「休市日隐藏」等历史规则；保留旧章节供追溯。
- **已实现且有回归证据**：本地参数自动恢复、动态股票代码、`^KLSE` 推定交易日历、休市日流水保留但行情栏留空、日历日计息、趋势图独立开关、CSV 文件名含股票代码；项目记录 Node 13/13、P0 276,096项断言、财富守恒17,256项、本地 Chromium 八组 PASS。
- **P0 未闭环**：与原始 Excel 缓存/公式的数值等价性仍 FAIL/BLOCKED；独立引擎 oracle PASS 不应误标为 Excel 等价。
- **P1 待核实**：24笔股息真实 Payment Date/金额、Bursa 官方历史逐日休市覆盖（2015–2021 BLOCKED，2022–2026 PARTIAL）、真实 Yahoo 多股票全历史与 Site 生产端到端请求/授权。
- **P2 待完善**：公司行动、停牌、历史融资利率/费用口径与完整生产 UI 验收。
- **本次变更性质**：仅文档审查，不改动源码/原始股息/财务公式；不合并 main，不部署 Sites。详见 PRD v0.16 第13节。


## 文档一致性修订（2026-10-25）

- Requirements v1.6 将旧 R-022「重新打开页面恢复默认」标记为已被取代，并新增 R-026：同一浏览器自动恢复最近保存的参数、股票、行情快照、股息、主题和筛选；恢复默认仍由用户主动触发。
- PRD 升至 v0.18。早期「开发未开始」「合成行情」「刷新恢复默认」等描述已注明是历史快照；旧规则保留追溯，不再作为现行验收基准。
- 新增 `docs/ACCEPTANCE_MATRIX.md`，集中列出每项最新需求、实现/测试证据、PASS/PARTIAL/BLOCKED/NOT RUN 状态及残余限制。该矩阵明确区分本地 fixture/UI 回归、真实 Yahoo 全历史验证、Bursa 官方资料覆盖与 Excel 公式等价审计。
- 此次仅修改需求和状态文档；不更改应用源码、财务公式、Payment Date、原24笔股息或 Sites 设置。PRD v0.17 Actions run 95（`40159224630`）成功；本轮文档整理阶段 Actions run 99（`40159877853`）与后续 run 100（`40159919838`）均成功。run 100 对应文档状态整理提交 `8aa28550940218d4e980fce4bdb0d02bd618c307`。

## Payment Date 自动核验开发（2026-10-25，进行中）

- 新增 `site-source/dist/payment-date.mjs`：严格核验股票代码、Ex-Date、金额、Bursa 官方 HTTPS 来源与付款日期；按股票+除息日+金额匹配，不同付款日期冲突时不自动选择；匹配结果标记 `official-source-matched-pending-approval`，不自动入账。
- 新增 `site-source/tests/payment-date.test.mjs`：覆盖匹配、跨股票隔离、金额/日期不符、冲突、无效日期及非官方 URL。测试数据为合成 fixture，不能当作真实 Bursa 公告。
- **状态：PARTIAL / NOT INTEGRATED**。尚未接入真实 Bursa 公告抓取或授权 API；尚未连接 UI/Yahoo 导入流程；未执行新测试或确认 GitHub CI 成功；不宣称 Payment Date 已可自动获取。未修改原24笔股息、Payment Date 财务规则或 Sites。

### Payment Date 第二轮：数据源适配器（2026-10-25）

- 新增 `site-source/dist/payment-date-provider.mjs`：为经过核实的 Bursa 官方 HTTPS JSON 数据端点提供可替换读取接口；没有实际已验证端点时返回 `source-not-configured`，绝不伪造 Payment Date；数据源响应必须包含可校验的公告记录。
- 新增 `site-source/tests/payment-date-provider.test.mjs`：模拟响应测试未配置数据源、非官方域名阻止请求、匹配及异常响应。测试使用 fixture；代码已提交但尚未执行 CI 验证。
- **BLOCKED**：尚未确认可合法自动访问、实际返回所需 JSON 结构的 Bursa 官方 Payment Date 端点。当前模块不是已经上线的自动抓取器；未连接 Site UI 或生产 Worker，未部署。需先验证官方公告实际访问形式、许可、分页、公司行动关联及稳定性。

### Payment Date 第三轮：公告结构研究及解析器（2026-10-25）

- 外部资料确认 Bursa 公告消息结构字段 171=Ex-Date、174=Payment Date；上市公司公开的 Bursa 公告页面含 Ex-Date、Entitlement Date、Payment Date、每股股息和 Reference Number（例如 MAYBANK 2026-09-23 除息、2026-10-22 付款）。参考：https://www.bursamalaysia.com/sites/5bb54be15f36ca0af339077a/assets/5bc04a415f36ca5cab8bf756/Announcements_Message_Structure_v1.6.pdf 与 https://maybank.listedcompany.com/news.html/id/2626995 。
- 新增 `site-source/dist/bursa-entitlement-parser.mjs` 和 `site-source/tests/bursa-entitlement-parser.test.mjs`，从结构化公告文字抽取日期/金额/公告编号；严格拒绝缺失和无效日期。解析结果仅标记 `unverified-extracted-fields`，不能视为来源/公司身份已验证或可直接入账。
- **PARTIAL / NOT INTEGRATED**：解析器尚未连接公开页面抓取、Yahoo 导入、股息资格引擎或 UI；真实可调用且符合授权的 Bursa API 尚未确认。新增测试文件尚未在实际 CI/Node 环境执行，未部署。

### Payment Date 第四轮：KLSE Screener 取代 PDF 解析方向（2026-10-25）

- 用户要求避免 Bursa PDF，优先研究 KLSE Screener 股票页面，例如 https://www.klsescreener.com/v2/stocks/view/1155/malayan-banking-berhad 。
- 页面可公开阅读，股息历史表含 Announced / EX Date / Payment Date / Amount；示例 2026-02-27 宣布、2026-03-12 除息、2026-03-26 付款、每股 RM0.3300；2025-08-27 宣布、2025-09-11 除息、2025-09-26 付款、每股 RM0.3000。第三方资料不得标记为 Bursa 官方核实。
- 新增 `site-source/dist/klsescreener-dividends.mjs` 和 `site-source/tests/klsescreener-dividends.test.mjs`：解析该页面股息表文字、股票代码和 URL 约束、分离 Ex-Date/Payment Date、来源和待审核标记；fixture 测试已提交，但未运行。
- **PARTIAL**：只实现文本解析，不包含未经许可的网页抓取、反爬绕过或自动付款日应用。KLSE Screener 站点条款/机器访问授权及 Sites Worker 实际请求尚未核实；UI/Yahoo 自动运行流程未接入；不修改原24条股息、不部署。

### Payment Date 第五轮：Yahoo × KLSE Screener 候选匹配（2026-10-25）

- 新增 `site-source/dist/klsescreener-reconciliation.mjs`：通过股票代码、Ex-Date、每股金额（默认容差 0.000001）比对 Yahoo 股息与 KLSE Screener 历史记录。输出候选日期、来源、冲突状态，且不自动设置实际 Payment Date。
- 新增 `site-source/tests/klsescreener-reconciliation.test.mjs`：覆盖匹配、金额不符、付款日期冲突、跨股票隔离、人工确认及已有日期防覆盖。
- 人工确认函数 `approveKlsescreenerPaymentDate` 只有显式 `confirm:true` 且唯一候选日期时才能把候选变成入账日期；KLSE Screener 仍属于第三方数据。
- **未完成**：实际站点访问许可核验、真实页面解析验证、Worker 获取、UI 确认流程集成、实际执行新增测试、回归测试和 Sites 部署。此轮仅为 GitHub 代码提交，不能宣称功能已交付。

### Payment Date 第六轮：UI 候选核对集成（2026-10-25）

- `site-source/dist/index.html` 新增 KLSE Screener 股息表文字输入和「核对 Payment Date」按钮；导入解析结果与本次 Yahoo 股息事件比对，显示 Ex-Date、Yahoo 股息金额、候选 Payment Date 和状态。
- 为避免更改已部署 JSON snapshot schema，Yahoo 股息事件只临时保存在当前页面内存 `lastYahooDividends`；重新打开页面需重新运行 Yahoo 才能核对。
- 本版是手动粘贴的候选比对 UI，不是自动抓取，也不自动入账、确认、改写 Excel 24 条股息或变更回测引擎。
- **UNTESTED / NOT DEPLOYED**：GitHub 代码已更新，未执行 Node 或浏览器回归；需核对真实 KLSE Screener 页面表格格式和第三方访问授权后才能实现真正自动获取。

## Payment Date 第七轮：Yahoo 后自动读取并逐笔确认（2026-10-25）

- **实现**：Yahoo 回测完成后按选中股票代码经同源 Site Worker 读取 KLSE Screener 公开股票页的历史股息，支持四位和五位数字 Bursa 代码；本地与 Worker 均缓存 6 小时。页面当前所见历史从 2002 年起（抽查 1155.KL、1066.KL），不据此声称所有股票/年份完整。
- **匹配与财务安全**：只按同股票、Ex-Date 与每股金额匹配；冲突或金额不符不赋付款日。只接纳 `Currency`、`RM`、`MYR` 单位，过滤 `Percentage` 历史。候选需单独选择、九项指标预览及用户确认后才按 Payment Date 入账；原 MAYBANK Table1 24 条未改变，其他代码不带入 MAYBANK 股息。来源、匹配字段、用户确认及原始行快照随 JSON 保存。
- **来源等级**：KLSE Screener 是第三方来源，不是 Bursa 官方核实；应用保留原始页面 URL 和抓取时间，用户仍须逐笔检查再确认。Worker 不绕过登录、验证码或访问控制。
- **回归**：Node 全套 36/36 通过，包括 4,314 日两策略、P0 oracle 276,096项数值断言、17,256项财富守恒、24条原始股息不变、单位过滤、四/五位代码、跨股票与冲突隔离。Chromium mock E2E PASS：自动匹配、九指标预览、显式确认、付款日逐日流水入账、JSON 来源导出/导入往返，页面错误0。Site Worker build 与 `git diff --check` PASS。详细见 `docs/analysis/PAYMENT_DATE_KLSE_SCREENER_REGRESSION_2026-10-25.md`。
- **GitHub / Sites**：源码已准备在 `feat/trading-calendar-dividend-chart-controls`；此记录先记本地验证，新的 Actions、PR 更新及现有 owner-only Site 发布结果待推送后补录。

### 股息事件单表简化（2026-10-25）

- **需求调整**：股息事件页面只保留一张表；移除股息 CSV 导入与审核、独立 Payment Date 候选表和指标比较表。Yahoo × KLSE Screener 匹配候选行内展示并逐项确认，来源/人工确认仍随 JSON 快照保存。
- **数据/财务**：原 MAYBANK Excel 24 笔事件保持不变；不修改回测公式。逐日流水仍显示日历日和休市日利息。
- **验证**：新增 Chromium 专项回归，检查唯一股息表、无股息 CSV 控件、原24条不变、事件增删、候选同表展示、逐行确认和来源快照；PASS，浏览器错误0。完整 Node 套件 36/36 PASS；P0 oracle 276,096 数值断言、17,256 财富守恒断言及4,314日两策略历史回归 PASS；`git diff --check` PASS。
- **GitHub / Sites**：开发分支提交 `e7361496ddb94ad96de1452bcde69745d6ce6ef2` 已更新 PR #3；Actions run 148（`40171083848`）SUCCESS。现有 owner-only Site Version 52 已从 Site 源提交 `60cf2471659e8cc4046793052badd4b3750cca2f` 发布，deployment `appgdep_6adda82b91b48191a3d79f52c6d7f45d` succeeded；原 URL、权限与配置保持原样。
- **线上核对**：部署后刷新现有 owner-only Site，只读检查股息页恰有1张表、股息 CSV 控件为0、独立候选表为0；未触发行情请求、运行回测或修改线上本地数据。完整线上计算交互仍未执行。
- **限制**：KLSE Screener 是第三方来源，不等于 Bursa 官方确认；各股票可见历史完整性未被证明。

### 运行时刷新旧结果与开始价格修复（2026-10-25）

- **问题**：运行前读取同代码旧快照进行 `startPrice` 一致性校验。旧快照、开始日期或输入残留不一致时，会在新 Yahoo 价格覆盖该值之前直接失败。
- **修复**：每次点击「运行」立刻清空页面逐日流水、图表/指标、股息表行及旧的内存行情日历，再请求所选股票与 `^KLSE`。成功后按新行情的开始日收盘价重建参数并显示新回测；MAYBANK 24条只用于 `1155.KL`，同代码人工编辑事件在刷新过程中暂存后恢复。
- **失败安全**：网络、校验或保存失败时，页面保持无流水/股息行并显示明确错误；旧已保存快照不被新候选覆盖，可重新载入恢复。无旧数据显示成新回测。
- **回归**：Chromium 覆盖每次运行两路 Yahoo 请求、等待期间旧数据清空、陈旧开始价格被新报价替换、失败后结果仍清空且旧快照逐字不变；PASS，浏览器错误0。Node 36/36、P0 oracle 276,096 数值断言与17,256财富守恒断言、4,314日双策略历史回归 PASS；`git diff --check` PASS。
- **GitHub / Site**：修复提交 `ac16d2bead4d9b493c3378d761194eb1772e0e7f` 已推送到现有分支并更新 Draft PR #3；Actions run 151（`40171742048`）SUCCESS。现有 owner-only Site Version 53 已从源提交 `c9d26e948b1ce8a8b32c5d206c49002076ddd122` 发布，deployment `appgdep_6addaaf893bc819199178ebc63a1880d` succeeded；原 URL、权限及已保存数据保持原样。


### 股息事件自动保存与导航（2026-10-25）

- **需求**：移除「保存并返回回测」独立按钮；股息编辑自动写入现有行情快照；尚无行情时写入按股票代码隔离的本地草稿并在重开时恢复。点击「回测」离开时同步保存完整表格并返回；第三方 Payment Date 仍逐项明确确认。
- **实现**：股息页显示自动保存提示；有行情时将编辑、添加、删除和确认写入现有快照，尚无行情时按股票代码保存独立草稿，并在刷新后恢复；成功获取行情后将草稿并入快照。离开到回测或说明前读取、校验所有表格事件并同步保存。数据无效或保存失败时留在股息页并显示错误。未改财务计算、原始24笔股息或快照 schema。
- **回归**：Chromium 专项测试验证无独立按钮、通过回测导航同步保存、再次进入后编辑值保持并导出 JSON 核对；另覆盖无行情时草稿保存及刷新恢复、非法股息与 localStorage 写入失败时留在股息页。结果 PASS（浏览器错误0）。Node 全套 36/36 PASS；`git diff --check` PASS。提交 `b7816f72865aece34ab6e7481b9c4c75eed8d8c9` 已更新现有 Draft PR #3；GitHub Actions run 156（`40172783707`）SUCCESS。现有 owner-only Site Version 55 由源码提交 `ec9ebe1124a77b5636f3941901c6e32fffc87e46` 发布，deployment `appgdep_6addaf53911481918c9b6aad4662fe81` SUCCEEDED；原 URL、访问权限、设置和已保存数据保持不变。


### 强制卖出阈值停止与快照持久化错误区分（2026-10-25）

- **问题**：达到80.00%强制卖出阈值后，回测引擎按待确认规则停止；前端却把非空业务停止提示误判为渲染失败，导致合法 Yahoo 候选快照回滚并错误显示“保存失败”。
- **修复**：回测停止提示与渲染/持久化状态分离。业务阈值触发时停止并保留部分结果，不执行未经确认的自动卖出；只要行情验证与快照保存成功，就保存新快照和部分结果。只有真实渲染、校验或保存失败才回滚，原失败安全边界保留。财务公式与触发规则未改。
- **回归**：Chromium 强平阈值崩盘场景通过：达到80%后结果显示“已停止”和业务原因，部分流水可见，未出现“保存失败”，候选快照已保存；随后正常运行恢复成功。该专项测试随实现提交 `7760eceef0b98a101d0a872f358ee6443b21a511` 通过。GitHub Actions run 159（ID `40173805028`）SUCCESS。该记录不代表待确认的强平执行规则已获业务确认。
- **GitHub / Site**：实现提交已更新现有 Draft PR #3。现有 owner-only Site Version 57、deployment `appgdep_6addb31b5f70819198353f1308bf715e` 成功，来源 Site commit `e5af80718898d1aa4cd02f8d0b1aa87e45133b87`；Site URL 与访问权限不变。此文档更新只同步 PR 内容，不需重新部署 Site。
