# P3 + F05 工作状态（2026-10-25）

- **源码已入本 PR 分支**：静态 Site 应用、价格/股息资源、数据校验模块、8 个 Node 测试文件、固定股息 fixture 和 GitHub Actions 测试工作流。该仓库此前没有应用源码；本 PR 增加可审查的源码快照，不代表 Sites 发布。
- **F05：实现；自动化静态检查 PASS；浏览器验收 NOT RUN**。价格线读取回测实际日价，使用独立外侧 RM/股刻度，保留 LSR 轴及原有指标；图例、Tooltip、缺失价格空段已由静态测试覆盖。桌面/手机、亮/暗主题真实渲染和交互尚未验证。
- **P3：CSV 人工审核通道实现；自动 API 接入 BLOCKED**。现场 Yahoo Chart 只读请求对 1155.KL 返回 2,907 个交易日（2015-01-02 至 2026-10-23）和 24 条股息事件；响应含独立 raw close / adjclose 及 Kuala Lumpur 时区。回传日期是交易日而非完整日历；Ex-Date 不可作为付款日。CORS 测试 BLOCKED，Yahoo 自动使用授权未确认，故没有接入 API、没有自动保存股息、也未生成缺失日期价格。
- **CSV 工作流**：含日期/价格/重复/异常校验、same/new/conflict 预览、人工修正保护、不可变候选快照、缺日拒绝和 JSON 来源留痕。UI 含候选重跑/九项指标比较/确认/取消，但 UI 取消、保存失败回滚和重跑尚未通过浏览器执行。
- **测试**：本地 Node 测试：8 个测试文件 PASS、0 FAIL；含 27 项引擎案例、48,216 日账数值检查、276,096 项 P0 oracle 断言、17,256 项财富守恒检查，以及 F05 静态和 P3 CSV 测试。全工作簿 Excel 对照 NOT RUN（缺少输入路径）；与 Excel 等价性仍沿用审计中的 BLOCKED。
- **GitHub Actions：PASS**，`Site source tests` run 2 / run ID `40114438329`（8/8 test files）。首次运行因完整价格 JSON 传输截断而失败；修复后重跑通过。PR #1 仍为 Draft、未合并。Sites 未部署；Version 30 / UI v24、URL、Owner-only 权限和生产数据未改。2021-06-28 RM0.39/RM0.385 与 2021-01-15 RM0.14/RM0.135 差异保留，24 条人工股息记录未被替换。
- **详细证据**：[P3/F05 实施与测试报告](analysis/P3_F05_IMPLEMENTATION_TEST_REPORT_2026-10-25.md)。

# F05 股票价格趋势图需求（2026-10-24）

- **PRD v0.15 已提交**：`prd/PRD文档.md`；Commit `9d408bcadff72aeab5404fbb5a4f42204a43ab4c`。
- **已确认**：在现有趋势图加入股票价格 RM/股曲线、独立可辨识刻度、图例开关及 Tooltip；保留原有市值/贷款/净资产/LSR，不创建独立图表。
- **待完成**：前端实现、回归测试及 Sites 部署；现有 Site Version 30 / UI v24 的最后已验证发布记录不变。

---

# P3 PRD 更新记录（2026-10-24）

- **GitHub PRD v0.14 已提交**：`prd/PRD文档.md`；Commit `3bdddff96e4cab279679af3bfefc56e810c90b78`。
- **确认范围**：Yahoo Finance Chart API 为 `1155.KL` 第一候选；Excel/CSV 为后备；股价与股息分别校验；差异预览、人工核准、候选快照、双版本回测比较、最终确认后保存及失败回滚。
- **尚未完成**：P3 代码集成、真实 API/CORS/Sites 兼容性测试、自动化回归、GitHub 源码提交与 Sites 部署。此前聊天中的代码仅为草案。
- **保护边界**：不改变已部署 Site Version 30 / UI v24 的最后已验证状态；不修改 Owner-only 权限、现有 URL、生产数据或财务引擎。P1/P2 并行工作状态需单独核实。

---

# 最新状态：Site Version 30 / UI v24 P0 财务引擎修复（2026-10-24）

- **PASS 已部署**：现有 Margin Share Calculator Site Version 30 / UI v24；部署 `appgdep_6adc7a5903208191bf7d38681099114a`，状态 `succeeded`；保存版本 `appgprj_6ad816b7dd508191a8632550d36f375f~appgver_f1b7b18c8b908191bb907d90f868c9a6`。原 URL 不变：[打开现有站点](https://margin-share-calculator-poc-20261021.savoryboar128.chatgpt.site/)。
- **Site 源码**：`34e19990cd6f6101ec43fffacf2f862d62759119`。仍为 custom Owner-only；单一获准 Owner，外部访客/群组/编辑者均为0，权限 revision 1。
- **P0 完成**：修正数值安全边界、费用边界、负净卖款、股息清偿后的再融资顺序、Margin Call 当日再融资限制、交易现金/贷款流水，以及 JSON 兼容与校验。保留日初贷款计息、月末利息资本化、股息偿债、两类 Margin Call 策略、58% 再融资触发、100股整手和自有股/融资股分账等现行规则。
- **验证通过**：引擎 27 项；股息数据 24 条；两种策略各 4,314 日整手/持股分类；48,216 项日级回归数值核对；费用/初始现金测试。独立 P0 审计对 4 个配置执行逐手枚举 oracle（两种策略、费用开/关），共 276,096 个数值断言和 17,256 项财富守恒检查通过。详见 [P0 审计报告](analysis/P0_FINANCIAL_ENGINE_AUDIT_V24_2026-10-24.md)。
- **浏览器验证**：本地 Chromium 已验证 1280×720 亮/暗主题、重置、旧 JSON 导入、新配置导出/导入等；现有生产 Site 已核对 UI v24、4,314 行和无可见错误。未完成全视口/全主题矩阵、第二账号访问路径和原生 Excel 验收。
- **Excel 缓存差异**：发现工作簿 P34 的月末公式含空 AND 参数。LibreOffice 对原公式复算为0；仅移除空参数的临时副本得 RM665.892739726028，次日贷款 RM157472.892739726。该复现支持根因判断；原生 Excel 未运行，故 Excel 原生表现仍待核实。
- **发布边界**：本状态记录 Site 发布，不声称 GitHub CI 通过。Site 源代码发布和 GitHub PRD/报告提交为独立流程。本次 PRD/GitHub 更新仅更新文档，不触发 Site 部署。
- **P1 后续**：重建历史交易费用率（特别是 2023-07 印花税变化）；核实 Maybank 当前网页与 PDS 的费率冲突；补充股息除权/资格日并逐笔核对24条事件；如需声称 Excel 等价，须在原生 Excel 环境复算。
- [P0 财务引擎审计与测试报告](analysis/P0_FINANCIAL_ENGINE_AUDIT_V24_2026-10-24.md)
- [UI v23 初始现金与 Bursa 费用报告](analysis/INITIAL_CASH_BURSA_FEES_V23_2026-10-24.md)

---

# 最新状态：Site Version 29 / UI v23 现金分配与 Bursa 交易成本（2026-10-24）

- **PASS 已部署**：现有 Margin Share Calculator Site Version 29，部署 `appgdep_6adc3494a2808191b896678af4f41f05` 状态 `succeeded`；版本 ID `appgprj_6ad816b7dd508191a8632550d36f375f~appgver_f30203d44b008191868b47364337c8d7`。原 URL 不变：[打开现有站点](https://margin-share-calculator-poc-20261021.savoryboar128.chatgpt.site/)。UI 标记 v23。
- 参数抽屉新增“手上现金”输入，按开始日收盘价、目标 LSR、整手数及初始买入费用自动计算总整手数、自有股数和融资股数；可用现金先承担自有持股和初始买入成本。未投资现金不纳入股票权益净资产。采用100股一手，初始融资持股取不超过目标比例的整手，因此实际初始 LSR 可略低于目标。
- 交易费分项为可编辑券商佣金（默认0.1%，最低RM8）、印花税（0.1%，每RM1,000或不足部分RM1，单项上限RM1,000）、结算费（0.03%，上限RM1,000）及可选佣金SST（默认0）。以默认费率计算RM10,000单边交易RM23；如实际合同对佣金征8% SST，则RM23.80。成本按固定费率用于整段历史回测，不代表历史费率重建。
- 初始建仓费从输入现金支付并列入首日流水；现金补仓买股费用列入补仓金额且不增加贷款；再融资交易费资本化到贷款；卖出费从还款净额扣除。逐日流水与逐日CSV含交易费用列。现金股与融资股分列追踪，融资持股卖出用于偿还贷款。
- JSON导入兼容旧 `margin-share-config/v1`，新导出包含现金预算、自动股数与费用设置；导入前验证新字段与份额/现金的勾稽关系。
- **PASS 自动验证**：27项引擎检查；24/24股息数据；现金与卖出两策略各4,314日、100股整手及持股分类检查；独立日账48,216项数值核对；费用、上限、取整、可选SST、初始现金分配与首日费用测试通过。
- **PASS 本地 Chromium**：2152/1440/1075/390 CSS像素 × 亮/暗主题共8组；自动分配、旧/新JSON、含费用CSV、股息交互、图表、Tooltip、流水定位均通过，页面错误0。
- 当前Site仍为custom Owner-only：Sites API确认当前账号为Owner，唯一获准Owner，外部访客/群组/编辑者均0，权限revision 1。没有创建新Site/项目，也没有更改其他Site。
- Site源提交 `1d97ccd8aa27a9a6e05f6e7d784bb5ecd47bf876`。本次进度、PRD与测试部署报告同步提交至 GitHub `main`；没有声称 GitHub CI 通过。历史 Excel 缓存公式等价FAIL仍保留，未因本次交易成本改动宣称Excel业务等价。
- [UI v23 测试与部署报告](analysis/INITIAL_CASH_BURSA_FEES_V23_2026-10-24.md)。

---

# 最新状态：Version 13 回测结果、趋势图与 JSON 完整性（2026-10-24）

- **PASS 已部署**：原 Owner-only Site Version 13，状态 `succeeded`；原 URL 不变：[打开现有站点](https://margin-share-calculator-poc-20261021.savoryboar128.chatgpt.site/)。没有创建新项目/Site，也没有修改其他 Site。
- 回测结果新增期末日终股数、股票总市值；保留日终贷款余额。所有14项结果卡均有指标说明 Tooltip，含定义、公式、来源与适用规则。净资产统一为“日终股票市值 − 日终贷款”，不含抵押现金、外部现金、超额股息或待资本化利息。
- 趋势图增加股票市值、日终贷款、净资产三条 RM 曲线，保留 LSR；图表日期 Tooltip 显示全部四个逐日值，支持负净资产刻度。
- JSON 导出记录 Excel Table2 收盘价来源、代码、日期区间与行数；导入支持既有 v1 文件，完整校验参数、日期、行情来源和股息事件，整包验证通过才应用；非法文件拒绝且不部分覆盖当前配置。旧每手股数按现行100股规则归一。
- **PASS 自动验证**：26项引擎检查；24/24股息来源；两种策略全市场各4,314日且整手交易检查通过；独立合成逐日 oracle 48,216项数值核对通过（不代表 Excel 缓存等价通过）。
- **PASS 本地 Chromium**：2152/1440/390px × 亮/暗六组合；14个结果 Tooltip、17个流水 Tooltip、趋势图与键盘提示、JSON导出/旧配置导入/非法导入原子拒绝通过；页面错误0。
- **PASS 线上只读检查**：Site 页面显示 UI v13、期末指标与三项趋势指标；期末贷款 Tooltip 正常显示。当前策略仍为 custom Owner-only，唯一Owner，外部访客/群组/编辑者均0，revision 1。
- 源码提交 `f4c3a1f8924248a5d6096daa871c7511e58bdeea`；Sites部署 `appgdep_6adc0c039dc081919ba559ff6b57fda5`；版本 `appgprj_6ad816b7dd508191a8632550d36f375f~appgver_d5caf093823881918a6efe939cab7705`。
- [V13 测试与部署报告](analysis/RESULTS_TREND_JSON_V13_2026-10-24.md)。历史 Excel 缓存公式等价 FAIL 仍保留；本次未声称 Excel 业务等价或 GitHub CI 通过。

---

# 历史状态：Version 11 趋势图全宽修复（2026-10-23）

- PASS：原Owner-only站点已部署Version11，succeeded；URL不变。
- 修复内部viewBox宽度上限900造成的左右留白：改用实际容器宽高，容器尺寸变化自动重绘；仅保留双Y轴标签边距。数据、业务引擎、Neutral主题未改变。
- PASS本地：2152/1440/390px亮暗六组合与现有浏览器回归；宽高逐项匹配，无页面横向溢出，日期提示/股息/月末流水正常，错误0。
- PASS线上：实际2152/1440/389px亮暗六组合，内部绘图宽1648/936/285与SVG匹配。原唯一Owner、revision1、访客/群组/编辑者0不变。
- 源码 `5c32075223beec791bcb17b6fd64f4ad325ceab6`；部署 `appgdep_6adb6de75ba881919fb1dfc7cfbd5c97`。
- [修复测试报告](analysis/CHART_WIDTH_V11_2026-10-23.md)。历史Excel公式等价FAIL仍保留。

---

# 历史状态：Version 12 整手交易与流水定位（2026-10-24）

- **PASS 已上线**：原Owner-only Site Version 12，部署状态 succeeded；[原URL](https://margin-share-calculator-poc-20261021.savoryboar128.chatgpt.site/)，未创建新项目或触碰其他站点。逐日流水新增手动页码跳转和日期定位；可在月末筛选中输入日期后自动切回全部日期、跳至所在页、高亮目标行。无效页码和范围外日期会显示提示。
- 马来西亚交易买入和卖出固定以100股为一手：买入向下取整；卖出向上取整到解决追缴的最小整手，并受可售整手持仓限制；不足整手会提示无法解除追缴。再融资触发默认58%；旧JSON配置自动归一到100股一手。
- 保留Neutral亮暗主题、趋势图全宽修复、2015-01-01默认开始日、4,314条MAYBANK收盘价、24条股息、星期列、17列公式说明、月末利息资本化。
- **PASS 自动验证**：25项引擎检查；两种策略48,216个独立逐日数值检查；24/24股息来源；两策略各4,314日，所有买卖股数均为100股倍数。买入天数21/27；卖出策略19个卖出日。
- **PASS 本地 Chromium**：2152/1440/390px × 亮/暗六组合；页码/日期定位、日期过滤切换、错误输入、图表、全部17个Tooltip及定位、对比度、股息事件均通过；页面错误0。
- **权限**：重新读取确认仍为custom Owner-only，唯一Owner，外部访客/群组/编辑者0，revision1；未修改其他Sites或生产系统。
- **PASS 线上浏览器**：owner登录状态确认UI v12、58%触发、每手100；第3页跳转和2020-02-29日期定位成功，页面错误为空。
- 源码提交 `cb49a26bfa3b394637df488f032a91c1efbba03f`；部署 `appgdep_6adbf4b6bcd0819188e8521e9bda0aae`；版本 `appgprj_6ad816b7dd508191a8632550d36f375f~appgver_a354b71d6bc081919a3d70707d0aaed4`。
- [Version 12实现与测试报告](analysis/BOARD_LOTS_NAVIGATION_V12_2026-10-24.md)。历史Excel缓存公式等价FAIL仍保留，本次未重跑。

---

# 最新状态：Version 10 Neutral主题与收盘价已上线（2026-10-23）

- **PASS 部署**：原 Owner-only Site Version 10，succeeded；[原URL](https://margin-share-calculator-poc-20261021.savoryboar128.chatgpt.site/)。未创建新项目，未修改其他 Sites 或生产系统。
- 实际使用 shadcn/ui 默认 Neutral 亮/暗语义 token 与一致控件风格，保留太阳/月亮；图表使用中性灰实线/虚线。覆盖按钮、输入、导航、表格、图表坐标、Tooltip、焦点、禁用/悬停状态。
- 收盘价4,314日与大趋势图一并上线；修复此前待部署分支的Table1/Table2股息重复相加，唯一股息输入为24条可编辑事件。月末资本化引擎和股息来源文件未改。
- **PASS 验证**：25引擎检查、48,216独立数值回归、24条股息；本地Chromium 1440/390亮暗；线上正常Owner登录IAB实际1440/389亮暗。星期、17公式、月末资本化、分页、图表日期及收盘价通过；浏览器错误0。
- **PASS 权限**：唯一Owner、访客/群组/编辑者0、revision1未变；未登录仍有登录门槛，正常Owner账户已登录验证。
- 源码 `1456d82377237f2e1b0b0ce138d8b761d886d009`；部署 `appgdep_6adb6c030ad481919bce58a42c17dcd2`；版本ID `appgprj_6ad816b7dd508191a8632550d36f375f~appgver_26c9d77dbe848191b1df598af226a8a0`。
- **DNS诊断**：受限沙箱仍无法解析GitHub/Sites Git；使用获准网络执行后官方源码同步、推送和部署成功。原DNS部署BLOCKED已解除；没有改变DNS/系统网络设置。
- **历史FAIL保留**：Excel缓存公式数值等价，本次未重跑；股息付款日、交易假日、真机触摸、完整屏幕阅读器与第二非Owner账户拒绝路径未验证。
- [完整测试及部署报告](analysis/NEUTRAL_THEME_V10_TEST_REPORT_2026-10-23.md)。GitHub文档提交与Sites发布独立；未声称CI运行。下方均为历史记录。

---

# 最新状态：MAYBANK收盘价导入待部署（2026-10-23）

- 请求：趋势图扩大至结果区大图；行情字段使用Excel收盘价。
- 用户提供CSV已解析：Table2含4,314条连续日历日，2015-01-01至2026-10-23，MAYBANK 1155.KL。首日Close RM9.17、次日RM9.12、末日RM9.97；Table2股息合计RM6.99，与Table1的24条既有事件金额合计相同。
- 本地实现提交：`08a3278f8d32674eef2b59525e5aa77ee0e0a5e8`；包含收盘价JSON资源、回测使用该收盘价、日期范围校验与大趋势图。月末资本化引擎及24条事件未改。
- **PASS本地**：引擎25项；两策略各4,018日回归48,216数值检查；股息24项；浏览器显示起始日RM9.17及次日RM9.12，共4,314日。
- **部署BLOCKED**：原Site当前仍Version 9。官方Sites源码工作流推送失败，Git远端 `git.chatgpt-team.site` DNS无法解析。修复本地origin配置并重新签发凭证后复试仍失败。没有新Site版本或部署ID，不可称已上线。
- 原Owner-only策略没有变更。等待该Site源仓库DNS恢复后，从同一提交推送、打包并部署。
- **限制**：此数据接入验证不代表Excel整表公式/业务等价；历史缓存等价FAIL保留，本次未重跑。股息实际付款日、公众假期交易日仍未确认。
- [详细收盘价实施及部署报告](analysis/MAYBANK_CLOSE_PRICE_UPDATE_2026-10-23.md)

---

# 最新状态：Version 9 UI增强（2026-10-23）

- 原Owner-only测试Site Version 9部署 **succeeded**：[打开](https://margin-share-calculator-poc-20261021.savoryboar128.chatgpt.site/)。未修改其他站点。
- 部署ID：appgdep_6adb64986b3c81919d468b6e755e8edc；版本ID：appgprj_6ad816b7dd508191a8632550d36f375f~appgver_3b127f64ffe08191a53e77d49fd83a18。
- Sites源码提交：4fed96f3a07cdd4d109bc47a60b9d00ba829ac50；GitHub为独立文档仓库，PRD v0.9及本次报告已更新；未声称CI运行。
- 四项UI已实现：太阳/月亮亮暗主题；中文星期；日期X轴及MYR/LSR双Y轴、精确日期数值提示；17列公式说明。流水每页100行，可查看完整范围。
- Version 8引擎与股息文件零改动，2015-01-01默认日与24条股息保留。
- **PASS**：25引擎检查、两策略各4018日独立回归48216数值检查、24股息逐条校验。IAB浏览器1440及390px两主题、分页、星期、图表键盘及窄屏点击提示、日息公式、月末筛选已实际检查；移动溢出发现后修复复查。对比度抽样亮色最低5.856:1、暗色最低9.362:1。
- **PASS 线上**：未登录显示登录门槛；已有Owner账户登录成功，显示UI v9；2015-01-31星期六，资本化RM665.89，待资本化0，资本化公式可打开；错误日志为空。
- **PASS 权限配置**：部署后重新读取，唯一Owner；外部访客/群组/编辑者均0，revision1不变。未用第二个非Owner账户测试拒绝路径。
- **未执行**：真实手机触摸、完整鼠标悬停矩阵、完整屏幕阅读器/Tooltip视觉矩阵；pointer事件已实现及窄屏点击检查不能等同真机触摸通过。
- **历史FAIL仍存在**：Excel缓存数值等价；本次未重跑Excel缓存。真实行情接入、付款日核实、Excel应用重算仍待处理。
- [测试报告](analysis/UI_V9_TEST_REPORT_2026-10-23.md)。以下内容为历史记录。

---

# 最新状态：Version 8 月末资本化（2026-10-22）

- [指定Owner-only测试站点](https://margin-share-calculator-poc-20261021.savoryboar128.chatgpt.site/) 已部署 **Version 8**，状态 succeeded。
- 用户已明确确认改回**每月最后一天资本化**。次月1日规则已被取代，以下历史章节仅保留历史证据。
- 日初本金计息→月末累计利息（含当天）加入本金→股息偿债→Margin Call→再融资。次月1日按更新本金计息，无重复资本化。
- 流水筛选改为每月最后一天；待资本化为日终余额，月末入账后为零。24条Excel股息、2015-01-01默认开始日及全宽布局均保留。
- 源码提交 b1650de22b681e02625510a2774c9956ac012d3f；部署 appgdep_6ad8eb7cab5c8191916ce14a07cff3c9。
- PASS：25引擎测试；两策略配置各4018日独立合成回归（48216项数值检查）；24条股息来源测试；三个Excel缓存日期范围均完成两种策略回归，贷款/利息/股数勾稽通过。
- 线上浏览器 PASS：2015-01-31资本化RM665.89，待资本化RM0.00；2015-02-28资本化RM604.01，待资本化RM0.00，无页面错误。
- Excel缓存数值等价仍FAIL：首差2015-01-31；缓存资本化全为零。未执行Excel应用重算，付款日尚未外部核实，Site股价仍为合成。
- 权限不变：唯一Owner；外部访客/群组/编辑者均0，revision1。未修改其他站点。
- PRD v0.8、Requirements v1.5已同步月末规则；[测试报告](analysis/Synthetic_Sites_PoC_Test_Report_2026-10-21.md)。

---

# 当前状态 — 2026-10-22 Version 6（本节取代下方历史状态）

- [指定Owner-only测试站点](https://margin-share-calculator-poc-20261021.savoryboar128.chatgpt.site) 已部署为 **Version 6**，状态succeeded；只修改此Site。
- 源码2ef90edcdabff515c7d073b2238fe2d00e803bee；部署appgdep_6ad8e8b665348191bcc1f748e8c4732b。
- 三项修改均已实现：默认开始2015-01-01；完整预填Excel Table1 A3:B26的24条MAYBANK股息（2015-05-26–2026-10-22，每股RM6.99），逐条保留来源/日期状态；每日累计、次月1日资本化及独立流水字段。
- PASS：24引擎测试；24条来源逐项一致；JSON导出实际下载核对；线上浏览器；两种策略各4313日截至今天回归，共69008项勾稽检查。另完成原4018日窗口和4383日全缓存窗口。
- **FAIL：Excel缓存数值等价**。截至今天每种策略贷款/LSR/日息各4282/4313行超容差；首差2015-02-01，当前文件资本化缓存全为零。详细股数差异与未来缓存范围见报告。
- 新文件含70个未来日期缓存，不作历史行情。当前快照无旧文件的负交易；旧报告仅保留为历史。
- Owner唯一允许用户；外部访客/群组/编辑者均0，revision1未变。原Excel校验值未变，没有修改源文件。
- PRD v0.7、Requirements v1.4、[最新测试与部署报告](analysis/Synthetic_Sites_PoC_Test_Report_2026-10-21.md)已同步。
- 仍待：实际付款日外部验证、行情API/公众假期/公司行动、Excel应用完整公式重算。Site价格仍合成，未声称真实历史行情通过。

---

# 当前状态 — 2026-10-22（以本节为准）

- 指定 Owner-only 测试 Site 已更新为 **Version 5**：[打开站点](https://margin-share-calculator-poc-20261021.savoryboar128.chatgpt.site)；部署 succeeded。
- 源码提交 12d178343377eb8b0c9312f60c8dab0a4b63b0f2；部署 appgdep_6ad8e1b5715c8191a029d80d67fa2967。
- 已实现：默认开始日 2015-01-01；**次月1日**一次资本化替代旧月末规则；逐日显示日息/待资本化累计/资本化金额/资本化后贷款余额；月初筛选。
- 已执行：24 引擎测试 PASS，0 FAIL；合成 4,018 日 × 两策略配置独立回归 PASS，48,216 数值检查；线上浏览器检查 PASS。
- 未完成：原 Excel Table1 全量 MAYBANK 股息预填；新版 Excel 全期差异验证未运行。当前没有可访问的原始工作簿/提取数据，需用户重新上传。默认股息列表为空并显示待导入，不代表实际无股息。
- 访问权限不变：唯一 Owner，0 外部访客、0 群组、0 编辑者，revision 1。没有修改其他 Sites。
- PRD v0.6 / Requirements v1.3 已补充新规则与验收要求。实际行情 API 尚未接入。
- [本次测试与部署报告](analysis/Synthetic_Sites_PoC_Test_Report_2026-10-21.md)。下方 v4 状态是历史记录，旧月末规则及测试结果已被本节取代。

---

# Margin Share Calculator — Project Status

> Updated: 2026-10-21 10:13 (Asia/Kuala_Lumpur)

## Identity
- Repository: jaronhoh/margin-share-calculator
- Branch: main
- Product: 马来西亚股票融资计算器（Margin Share Calculator）
- Source reference: user-provided Leverage Calculator.xlsx; formula equivalence pending verification.
- Isolated test Site: [Margin Share Calculator Synthetic PoC](https://margin-share-calculator-poc-20261021.savoryboar128.chatgpt.site) (Owner-only; no production Site modified).

## Status
| Area | Status |
|---|---|
| Requirements / PRD | Baseline v1.2 and PRD v0.5 on main; core rules confirmed, technical decisions remain open |
| Development | Isolated synthetic daily-engine PoC implemented; Site version 4 source commit 396b79a41608796bf44092614820cc9a480bb89d |
| Automated tests | 16 PASS, 0 FAIL |
| Excel comparison | All 4,018 cached daily rows compared in both strategy branches; expected differences quantified; Excel-app formula recalculation not run |
| Live Malaysian market-data API validation | Not started |
| Isolated Site deployment | Site version 4 deployed successfully; Owner-only access verified |
| Product production release | Not deployed; no existing or production Site modified |

## Decisions
- Only Bursa Malaysia equities; single-layer broker margin financing, no personal-loan layer.
- Primary goal: dividend-funded financing, with historical backtesting from user start date through today by default.
- Daily interest accrual, fixed annual interest rate, accumulated interest capitalized into margin loan monthly.
- Dividends reduce loan; when actual LSR falls to a user-configurable lower trigger (e.g. 55%), simulate borrowing and share purchases toward target LSR (e.g. 60%).
- Margin-call response strategy selected once per simulation: cash top-up OR sell shares to repay debt. Apply consistently throughout backtest. Only address the shortfall to just below margin-call threshold (e.g. 70%); avoid excess top-ups or sales.
- Automatic historical prices and dividend data, with user corrections overriding provider data.
- Single-page application with separate advanced-settings panel. Optional brokerage, clearing, stamp-duty costs; disabled by default for Excel comparison.
- Opening the page restores defaults. Export/import full JSON simulation configuration, including main inputs, advanced settings and manual data overrides. End date defaults to today.

## Confirmed Excel clarification
- H3=11,400 own-funded shares; I3=17,100 margin-funded shares.
- K4=28,500 total shares; I4=I3×F4 converts shares to loan amount (RM156,807 at RM9.17).
- User confirmed RM9.17 is that day's MAYBANK price; independent historical market-data verification remains open.

## Price clarification (2026-10-21)
- User confirmed F4=RM9.17 is MAYBANK's share price on the relevant day; initial financed share quantity is converted at this price.
- Historical source/date verification has not been completed.

## Latest confirmed decision
- 2026-10-21: Initial financing loan value uses margin-funded share count multiplied by the selected stock's price on the backtest start date; Excel MAYBANK example F4=RM9.17.

## Open questions / implementation risks
- Confirm insufficient-funds/insufficient-shares behavior, sell-to-repay algebra, Bursa minimum lot and rounding; the PoC uses explicit assumptions.
- Confirm forced-sale handling at force-sell threshold; the PoC stops when the threshold is reached.
- Verify actual Bursa Malaysia historical data coverage, corporate actions, dividend ex-date versus payment date, and data provider licensing/rate limits.
- Recalculate and compare all 4,018 workbook rows when the original xlsx is available; cached arithmetic checks are not business parity.
- Confirm same-day event order; the PoC's deterministic order is documented but is not a frozen product decision.

## Change log
| Date | Action | Evidence |
|---|---|---|
| 2026-10-21 | User confirmed RM9.17 is that day's MAYBANK share price; synchronized requirements and PRD. | User clarification |
| 2026-10-21 | User confirmed F4=RM9.17 is the MAYBANK start-date price; synchronized requirements, PRD and audit. | User confirmation |
| 2026-10-21 | Confirmed H3/I3 are shares and corrected audit/PRD interpretation. | User choice B |
| 2026-10-21 | Created requirements baseline docs/REQUIREMENTS.md and linked PRD v0.2; documentation only. | GitHub commits 70fbbb3, 53f7fbb |
| 2026-10-21 | Initialized project status with user-confirmed discussion decisions; no implementation or deployment claimed. | User discussion |
| 2026-10-21 09:44 MYT | Deployed isolated Owner-only synthetic PoC Site version 1; verified 14 engine tests and five Excel seed-value comparisons; full workbook parity remains unverified. | Sites deployment appgdep_6ad818dce2d48191a18e54a7e92121ff; source a612e8c0ab65168e06461b3fb79408dbdef6724a |
| 2026-10-21 | Added synthetic PoC test/deployment report; original xlsx was not available for a 4,018-row recalculation. | docs/analysis/Synthetic_Sites_PoC_Test_Report_2026-10-21.md |
| 2026-10-21 09:53 MYT | Updated isolated Owner-only Site to version 2; 15 automated tests pass and full 4,018-row Excel cache comparison completed for both risk strategies. | Sites deployment appgdep_6ad81aeadab88191a7c88e1f22bfe16f; source 51f6f3c6fc705308987f12b4b08966d3b3608009 |
| 2026-10-21 10:08 MYT | Updated the isolated Owner-only Site to version 3 with opening-price labeling and start-date alignment, editable dividend events, stock-code input, and JSON persistence. Re-ran 16 tests and both full Excel-cache strategy comparisons; Owner-only access remains verified. | Sites deployment appgdep_6ad81e834c4c8191962ecb15554afa03; source 2eb511c692d36ee949e105f1bfc8788fb24240cb |
| 2026-10-21 10:13 MYT | Moved dividend editing to a dedicated screen with separate navigation and a save-and-return flow; current backtest settings are preserved. Deployed and verified Site version 4; Owner-only access unchanged. | Sites deployment appgdep_6ad81fc26a0c8191805b5009fffe9141; source 396b79a41608796bf44092614820cc9a480bb89d |
| 2026-10-21 | Replaced initial sample-only report with full cached-row comparison results and limitations. | GitHub report commit 708ddafbde8fd776f7b93038b0a06e07694d959a

## Document links
- [Requirements baseline](REQUIREMENTS.md)
- [PRD v0.5](../prd/PRD文档.md)
- [Synthetic Site PoC test and deployment report](analysis/Synthetic_Sites_PoC_Test_Report_2026-10-21.md)

## Next action
Review the full-row differences; resolve the remaining business rules and Bursa data-provider feasibility before treating this PoC as product-ready. Site v3 remains synthetic-only and is not product-ready.
