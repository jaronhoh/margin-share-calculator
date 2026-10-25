# 当前功能验收矩阵

更新时间：2026-10-25（Asia/Kuala_Lumpur）  
适用分支：`feat/trading-calendar-dividend-chart-controls`  
本文件是当前实现/验收状态的单一摘要。需求定义见 [Requirements](REQUIREMENTS.md) 与 [PRD v0.30](../prd/PRD文档.md)。旧章节与早期状态报告用于历史追溯；冲突时以本矩阵和更新日期较新的状态记录为准。

状态含义：**PASS** = 本地实现和指定回归通过；**PARTIAL** = 部分验证完成且有明确缺口；**BLOCKED** = 缺少必要资料/标准；**NOT RUN** = 未执行。

| 区域 | 当前需求 / 验收条件 | 实现与验证证据 | 状态 | 尚存限制 |
|---|---|---|---|---|
| 参数自动恢复（R-026，取代 R-022） | 同一浏览器重开/刷新恢复最近保存的参数、所选股票、行情快照、股息、主题和筛选；用户可主动恢复默认；提供完整 JSON 导入/导出 | Persistence 自动测试覆盖恢复、非法/损坏数据、配额失败和清除；本地 UI 已实测刷新恢复 | PASS | localStorage 仅限同一浏览器配置文件，不跨设备/浏览器同步 |
| 股票选择与 Yahoo 回测 | 默认 `1155.KL`；可输入其他 Bursa `.KL` 代码；每次点击运行先清空旧流水、图表结果和股息表行，再重新请求所选股票与 `^KLSE` 并计算；按新行情重算开始日价格；不把默认快照或24笔股息套到其他代码 | Chromium 回归覆盖旧流水/股息行在请求期间清空、重新获取两路 Yahoo 行情、陈旧开始价格被新行情替换；失败时页面不显示旧结果且原快照未覆盖；`1066.KL` 回测场景通过 | PASS（本地回归） | 未对生产 Yahoo 做多股票完整历史下载；Fixture 不代表 API 全历史可用或数据授权 |
| 市场日历分类与补价 | 区分周末、官方来源确认闭市、Yahoo 基准推定闭市和未确认工作日；未知工作日缺价拒绝补齐；补价保留前值日期、原因和来源 | Node 用例覆盖普通/连续周末、确认假期、Yahoo 推定闭市、工作日缺价、重复/无效价格和5,000日限制 | PARTIAL | Bursa 官方逐日资料：2015–2021 BLOCKED；2022–2026 PARTIAL。Yahoo 推定不等于官方公告 |
| P0 财务引擎 | 每日计息及月末资本化；休市日仍计息；交易不得发生于非交易日；持股、债务、净资产、LSR、风险动作按规则计算 | P0 oracle 276,096 数值断言、17,256 财富守恒断言通过；4,314日两策略结果与已保存基线一致；休市日计息专测通过 | PASS（规则回归） | 与 Excel 原公式/缓存逐行等价性仍 FAIL/BLOCKED，不能把 oracle 通过解释为 Excel 等价 |
| 逐日流水（AC-LEDGER-01） | 展示整个模拟日历；休市日行情/估值/风险/交易栏空白，贷款与日息保留；日期筛选和排序可用 | 本地 Chromium Yahoo E2E 与主 UI 回归通过；休市日行和正日息均有断言 | PASS | 生产 Site 登录后的完整交互验收未执行 |
| 逐日流水 CSV（AC-CSV-01） | 文件名包含实际回测股票代码和起止日；数据内容维持全日历日和休市日利息 | Chromium 下载检查默认 `1155.KL` 与非默认 `1066.KL` 文件名；CSV 行内容与利息断言通过 | PASS | 文件名清理规则将非字母数字、点、连字符字符替换为连字符 |
| 股息与付款日（R-027 / AC-PAY） | MAYBANK `1155.KL` 为默认并支持其他四/五位 Bursa 代码；Yahoo 运行后按代码读取 KLSE Screener 历史；原始事件与候选共用唯一股息表；唯一付款日自动保存并重算后纳入回测；多个不同日期冲突不自动采用；不提供股息 CSV 导入/审核；来源和确认随 JSON 保存 | Node 覆盖解析、匹配、跨代码隔离、金额差异、冲突、缓存、Worker 与快照；Chromium 专测覆盖唯一表、无 CSV、原24条保持、增加/删除事件、候选自动确认/重算、冲突阻止及快照来源保存；全套 Node 38/38 通过，Chromium 另验证刷新后冲突会撤销旧自动采用并在冲突消失后重新采用；P0 oracle 276,096 数值断言、17,256 财富守恒断言及4,314日两策略回归通过 | PASS（本地实现/回归）；PARTIAL（资料权威性） | KLSE Screener 是第三方，不代表 Bursa 官方核验；页面历史范围会变化，未证明每个股票/年份完整；生产 Site/CI 状态以本轮最终记录为准 |
| 强制卖出阈值停止（AC-FS-01/02） | 达到阈值时停止并显示原因/部分结果；不自动卖出；业务停止不误报保存失败；有效 Yahoo 快照仍保存 | Chromium 强平阈值崩盘专项：部分流水可见、快照保存，错误文案无“保存失败”；随后正常回测通过 | PASS（本地专项回归） | 强制卖出交易执行规则仍待业务确认 |
| Payment Date 候选匹配（R-027 / AC-PAY-04/05） | 同一股票与 Ex-Date 唯一命中时，金额不同仍展示付款日候选；差异、源链接可见；确认不改 Yahoo 金额；多个付款日期冲突时禁用确认 | Node 37/37；单表 Chromium 金额差异确认与快照来源金额保留 PASS | PASS（本地回归） | Yahoo 未提供该 Ex-Date 或 KLSE 无对应记录时仍无候选；KLSE 仍为第三方资料，须人工确认 |
| 历史 Payment Date 与页眉版本（R-027 / AC-PAY-08 / AC-HEADER-01） | Percentage 来源保留原始单位；唯一同 Ex-Date 候选在原行显示并自动采用，金额不改；页眉显示版本号；参数入口固定在全局页眉主题按钮旁，在回测、股息事件、说明三页持续可见且均可打开抽屉 | Node 38/38、Chromium 验证 2015-02-18 → 2015-03-05 候选、31 Percentage 未换算、版本标签及全局参数按钮在三个标签页可见并可打开 | PASS（本地回归）；PARTIAL（第三方资料） | 付款日来自 KLSE Screener 第三方历史记录，仍需人工确认 |
| 股息事件自动保存（R-029 / AC-DIV-SAVE） | 股息编辑自动保存；有行情时写入快照，无行情时按代码存草稿并在刷新后恢复；点击「回测」时同步校验/保存并返回，不显示单独保存按钮；失败留在当前页；Payment Date 唯一日期自动采用 | Chromium 专项回归覆盖按钮移除、无行情草稿跨刷新恢复、编辑后导航、JSON 快照及无效数据/存储失败处理 | PASS | GitHub Actions run 156 成功；现有 owner-only Site Version 55 发布成功 |
| 图表与响应式 UI | 趋势线复选框、Tooltip、价格曲线、日期过滤、Light/Dark、桌面/移动端可用 | 本地 Chromium 2152/1440/1075/390 px × Light/Dark 共8组通过；页面错误0 | PASS（本地） | 线上登录态跨浏览器回归 NOT RUN |
| 股息自动确认后仍可编辑（AC-PAY-11） | 所有自动确认事件（含关联 Excel 原始行及 Yahoo 独有候选）的 Ex-Date、每股金额、已采用 Payment Date 均可编辑；改动自动保存并重算；人工编辑保留且不被后续自动匹配覆盖 | Chromium 覆盖两类记录三字段可编辑、快照持久化、刷新/重新运行不覆盖手工 Ex-Date/金额/付款日；Node 38/38、Worker 构建、git diff --check 通过；Site Version 63 已部署；GitHub Actions run 173 成功 | PASS（本地与部署） | 自动匹配依赖 KLSE Screener 第三方记录；来源匹配 Ex-Date 保留为审计键，手动 Ex-Date 单独保存；未操作生产股息数据 |
| GitHub / 发布 | 当前开发分支、Draft PR、Actions 与原 Site 发布状态可追溯 | PR #3 保持 Draft；代码提交 `78cc671d90ba1bdabe7abf4cdb6175fc29048d0f` 的 GitHub Actions run 173（ID `40182351218`）SUCCESS；现有 owner-only Site Version 63 已部署，来源 Site commit `6d1bdd87812e94a22f742d9e910f20f1c1f92918`，部署 ID `appgdep_6addd0c264a081919afb45249bf4753b` | PASS | 原 Site URL、owner-only 权限与 allowlist 未变；未操作生产数据 |

## 当前有效规则与旧文档处理

- R-022「重新打开页面恢复默认」已被 R-026 取代。R-022 保留为历史需求记录，状态为“已被取代”，不可再作为当前验收规则。
- PRD 早期的「开发未开始」「合成行情」「刷新恢复默认」等句子已标注为历史快照。现行实现状态只读本表；不删除历史审计记录。
- Bursa 年度资料覆盖、Excel 等价审计、Payment Date 核实和生产 Yahoo 全历史验证保持各自的 PARTIAL/BLOCKED/NOT RUN 状态，不能因功能代码或 fixture 通过而升级。
- 股息页面现行验收只保留一个事件表；早期独立候选/比较表、股息 CSV 导入与审核 UI 已被 PRD v0.20 取代。第三方 Payment Date 唯一日期候选在同一表内自动采用并重新回测；多日期冲突阻止自动采用。


## Payment Date 唯一日期自动采用（2026-10-25）

- Yahoo 行情与 KLSE Screener 按股票代码和 Ex-Date 关联；仅当该 Ex-Date 只有一个不同付款日期时自动写入快照并立即重算回测，不需要再按「采用付款日」。
- 自动采用只改变入账日期；保留 Yahoo/原始记录的每股股息金额，并保存 KLSE 来源金额、单位、链接及 `approvalMode=unique-date-auto`。Percentage 来源不转为 RM/股。
- 多个不同付款日期继续阻止自动采用。若后续刷新发现曾自动采用的日期已出现冲突，则撤销对应自动确认、保存并按未确认状态重算；用户原先手动确认的记录不被悄悄覆盖。
- Chromium 回归验证唯一精确金额、唯一金额不一致（原记录金额不变）、冲突阻止、刷新后撤销旧自动采用/冲突消失后恢复、付款日流水及零浏览器错误；Node 38/38 与既有 P0 历史回归通过。


## MAYBANK 默认日期分列与预填（2026-10-25）

- 默认 24 条 MAYBANK 事件按用户提供的 KLSE Screener 对照表显示 Ex-Date 与 Payment Date；金额及对应行号与原 Excel 一一匹配。原始工作簿抽取快照保持不变。
- 两种日期、每股金额可编辑并自动保存；回测在 Payment Date 入账。已有手动审批不会被默认值覆盖；默认记录仅用于 1155.KL。
- 验证：Node 38/38；P0 两策略、4,314 日历史财务回归通过；Chromium 单表 E2E PASS，包含预填、人工修改持久化和重跑保护；Worker build PASS。
- 来源边界：KLSE Screener 第三方资料和用户提供的数据；不宣称 Bursa 官方核实。
- Sites Version 64 已部署；URL、owner-only allowlist 和策略 revision 1 未变。部署 ID `appgdep_6addd7bfdd9c8191a1f46771293f4d68`。


## MAYBANK 默认股息日期（AC-PAY-12–14）更新（2026-10-25）

- PR 分支源码现已同步 Site Version 64，含24笔独立 Ex-Date/Payment Date 映射、编辑保存、旧快照迁移保护及不向其他代码套用默认日期。
- 原始 Excel Table1 24笔记录不变；KLSE Screener 日期表为用户提供的第三方资料，不表示 Bursa 官方核实。
- Node 38/38、P0 两策略4,314日回归、Chromium E2E、Worker build 在工作副本通过；当前 Actions 结果见项目状态文件的发布补录。


## GitHub 同步验收补录（2026-10-25）

- PR #3 的 `site-source`、单元测试、Chromium 回归及需求/PRD/状态/分析 Markdown 已同步至 Version 64 对应行为；Actions run 187（提交 `798237a22ba51ecfc7b0966bfda70589bdb820ec`，ID `40185041703`）SUCCESS。
- PR 维持 Draft。Sites 原 URL 与 owner-only 访问策略不变。
