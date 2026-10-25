# 当前功能验收矩阵

更新时间：2026-10-25（Asia/Kuala_Lumpur）  
适用分支：`feat/trading-calendar-dividend-chart-controls`  
本文件是当前实现/验收状态的单一摘要。需求定义见 [Requirements](REQUIREMENTS.md) 与 [PRD v0.19](../prd/PRD文档.md)。旧章节与早期状态报告用于历史追溯；冲突时以本矩阵和更新日期较新的状态记录为准。

状态含义：**PASS** = 本地实现和指定回归通过；**PARTIAL** = 部分验证完成且有明确缺口；**BLOCKED** = 缺少必要资料/标准；**NOT RUN** = 未执行。

| 区域 | 当前需求 / 验收条件 | 实现与验证证据 | 状态 | 尚存限制 |
|---|---|---|---|---|
| 参数自动恢复（R-026，取代 R-022） | 同一浏览器重开/刷新恢复最近保存的参数、所选股票、行情快照、股息、主题和筛选；用户可主动恢复默认；提供完整 JSON 导入/导出 | Persistence 自动测试覆盖恢复、非法/损坏数据、配额失败和清除；本地 UI 已实测刷新恢复 | PASS | localStorage 仅限同一浏览器配置文件，不跨设备/浏览器同步 |
| 股票选择与 Yahoo 回测 | 默认 `1155.KL`；可输入其他 Bursa `.KL` 代码；一键运行所选股票与 `^KLSE`，不把默认股票快照或24笔股息套到其他代码 | Yahoo 单元、Worker 与 Chromium fixture 测试；`1066.KL` 回测场景通过 | PARTIAL | 未对生产 Yahoo 做多股票完整历史下载；Fixture 不代表 API 全历史可用或数据授权 |
| 市场日历分类与补价 | 区分周末、官方来源确认闭市、Yahoo 基准推定闭市和未确认工作日；未知工作日缺价拒绝补齐；补价保留前值日期、原因和来源 | Node 用例覆盖普通/连续周末、确认假期、Yahoo 推定闭市、工作日缺价、重复/无效价格和5,000日限制 | PARTIAL | Bursa 官方逐日资料：2015–2021 BLOCKED；2022–2026 PARTIAL。Yahoo 推定不等于官方公告 |
| P0 财务引擎 | 每日计息及月末资本化；休市日仍计息；交易不得发生于非交易日；持股、债务、净资产、LSR、风险动作按规则计算 | P0 oracle 276,096 数值断言、17,256 财富守恒断言通过；4,314日两策略结果与已保存基线一致；休市日计息专测通过 | PASS（规则回归） | 与 Excel 原公式/缓存逐行等价性仍 FAIL/BLOCKED，不能把 oracle 通过解释为 Excel 等价 |
| 逐日流水（AC-LEDGER-01） | 展示整个模拟日历；休市日行情/估值/风险/交易栏空白，贷款与日息保留；日期筛选和排序可用 | 本地 Chromium Yahoo E2E 与主 UI 回归通过；休市日行和正日息均有断言 | PASS | 生产 Site 登录后的完整交互验收未执行 |
| 逐日流水 CSV（AC-CSV-01） | 文件名包含实际回测股票代码和起止日；数据内容维持全日历日和休市日利息 | Chromium 下载检查默认 `1155.KL` 与非默认 `1066.KL` 文件名；CSV 行内容与利息断言通过 | PASS | 文件名清理规则将非字母数字、点、连字符字符替换为连字符 |
| 股息与付款日（R-027 / AC-PAY） | MAYBANK `1155.KL` 为默认并支持其他四/五位 Bursa 代码；Yahoo 运行后按代码读取 KLSE Screener 历史；按代码、Ex-Date、金额匹配；候选逐笔预览/人工确认后方纳入回测；来源和确认随 JSON 保存 | Node 36/36 文件；Chromium mock E2E：`1066.KL` 自动查询、九项预览、显式确认、付款日入账、来源导入/导出；P0 276,096 数值与17,256财富守恒断言、4,314日两策略回归通过；原24条不变；Actions run 125 PASS；Owner-only Site Version 47 部署 succeeded | PASS（实现、CI、本地回归及部署）；PARTIAL（资料权威性/生产 UI） | KLSE Screener 为第三方，非 Bursa 官方核实；不保证每只股票/年份完整，用户须逐笔确认；生产登录后浏览器交互 NOT RUN |
| 图表与响应式 UI | 趋势线复选框、Tooltip、价格曲线、日期过滤、Light/Dark、桌面/移动端可用 | 本地 Chromium 2152/1440/1075/390 px × Light/Dark 共8组通过；页面错误0 | PASS（本地） | 线上登录态跨浏览器回归 NOT RUN |
| GitHub / 发布 | 当前开发分支、Draft PR、Actions 与原 Site 发布状态可追溯 | PR #3 仍 Draft，head `7bd3588fb8a8ade3670d6d1f34ad38a1745c09fe`；Actions run 125（ID `40167908980`）SUCCESS；现有 owner-only Site Version 47 部署 succeeded | PASS | Site Version 47 的生产登录态交互未执行；第三方 KLSE Screener 历史完整性未证明 |

## 当前有效规则与旧文档处理

- R-022「重新打开页面恢复默认」已被 R-026 取代。R-022 保留为历史需求记录，状态为“已被取代”，不可再作为当前验收规则。
- PRD 早期的「开发未开始」「合成行情」「刷新恢复默认」等句子已标注为历史快照。现行实现状态只读本表；不删除历史审计记录。
- Bursa 年度资料覆盖、Excel 等价审计、Payment Date 核实和生产 Yahoo 全历史验证保持各自的 PARTIAL/BLOCKED/NOT RUN 状态，不能因功能代码或 fixture 通过而升级。
