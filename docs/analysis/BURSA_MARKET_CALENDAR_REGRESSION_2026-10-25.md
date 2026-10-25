# Bursa Malaysia 市场日历与回归报告

日期：2026-10-25（Asia/Kuala_Lumpur）

## 日历行为

- Yahoo 导入并行读取所选 Bursa `.KL` 股票与 FBM KLCI Yahoo 基准 `^KLSE`。市场日历从基准实际返回的交易日期更新，不靠固定公共假期列表推断交易所闭市。
- 基准显示该日有行情、个股却缺价时，导入拒绝自动补价并指出股票代码/日期。基准相邻观察到的交易日期之间缺少工作日行时，日历记录 `yahoo-market-holiday` 推定闭市；沿用上一有效收盘价并记录 `carryForward=true`、`carryForwardFrom`、原因、Yahoo 基准及历史链接。
- Yahoo 推定闭市与 Bursa 官方公告确认日分开呈现。固定官方日期表当前仍仅部分覆盖：2015–2021 `BLOCKED`，2022–2026 `PARTIAL`。基准数据未覆盖、股票与基准交易日期矛盾、或缺价位于基准覆盖边界时均停止。
- 动态日历随候选行情保存到本地配置快照；JSON 导出/导入会验证日历来源、日期范围和 carry-forward 依据。后续回测、图表、逐日流水和 CSV 使用已保存日历。流水隐藏周末与推定/官方休市日；引擎继续按所有日历日累计利息。
- Yahoo 下载与保存仍沿用差异预览、手动价格冲突保护、候选回测对比、用户确认、原子保存及失败回滚。

## 自动化测试结果

- `node --test tests/*.test.mjs`：13/13 文件通过。
- P0 独立 oracle：276,096 数值断言、17,256 财富守恒断言通过。
- 历史回测：4,314 个日历日、现金补仓与卖股还款两策略的全部比较字段不变；原有24笔股息不变。
- 独立动态休市引擎测试：Yahoo 推定的两个工作日仍各产生融资利息，四日利息总额与可交易日基线一致，两策略账务字段一致。
- Yahoo 导入覆盖：普通及连续周末、官方与连续休市日、Yahoo 基准推定休市、基准交易但个股缺价、未确认工作日缺价、重复/无效价格、5,000日限制、手动价格选择、保存失败回滚。
- 本地 Chromium 动态导入 E2E：Yahoo 股票与 `^KLSE` fixture、候选生成/确认保存、导出来源、页面重载、逐日流水隐藏推定休市日、利息累计；PASS。
- 本地 Chromium UI 矩阵：2152/1440/1075/390 px × Light/Dark，8/8 PASS；日期过滤/定位、趋势图、Tooltip、价格曲线、股息表、无横向溢出及浏览器错误0均通过。
- Yahoo 基准使用测试 fixture；本轮没有通过生产 Yahoo 请求做完整线上历史回测。新股票的实际请求范围和返回数据应在 Site 发布后按页面安全导入流程人工预览确认。

## 资料来源与限制

- Yahoo Finance 将 `^KLSE` 列为 FTSE Bursa Malaysia KLCI 行情：[Yahoo Finance ^KLSE](https://finance.yahoo.com/quote/%5EKLSE/)。本系统使用其返回的交易日期作为市场基准。基准缺失工作日属于 Yahoo 数据推定，不作为 Bursa 公告确认。
- 已确认的官方逐日闭市日期及 Bursa 来源见 Site 日历代码和 `docs/PROJECT_STATUS.md`；本轮未修改公共假期映射、财务公式、Payment Date 或24笔股息。
- 年度覆盖边界继续如上标记；没有支持来源的工作日不会被标成官方确认闭市。

## 交付状态

PR 分支、Actions、Site 源提交、版本和部署 URL 在发布完成后补录。

## 最终发布补录（2026-10-25）

- Draft PR #3 分支提交 `ec75c9658d0de0c4098438c38ae3db286b57d404`；GitHub Actions run 69 / `40155526509` 成功。
- 现有 owner-only Site Version 42 已成功部署，Site 源提交 `85bb15541238166a35bc583a8c4bfbf2b2593650`，deployment `appgdep_6add6cf7db608191afa618b17d5418ba`。
- 原生产 URL `https://margin-share-calculator-poc-20261021.savoryboar128.chatgpt.site/` 和 owner-only access policy revision 1 保持不变。
- 本地 Chromium 用例验证了动态日历导入/保存/重载；未在生产浏览器会话执行交互回归。原始 24 笔股息、Payment Date 和财务公式未更改。

## 后续修订：逐日流水显示休市日及 Yahoo 一键运行（2026-10-25）

- 周末及官方/基准推定休市日保留在逐日流水和 CSV；收盘价、股票市值、交易、LSR、净资产等行情/风险栏留空，贷款和日息继续显示。引擎财务公式保持不变。
- 股票代码旁的「运行」直接并行获取所选 `.KL` 和 `^KLSE`，更新动态日历并生成已保存回测；移除独立 Yahoo 更新、行情审核和市场行情 CSV 导入。行情快照只通过明确的「导入 JSON」恢复；股息 CSV 审核屏维持独立。1155.KL 仍是默认代码，24笔股息与 Payment Date 逻辑未改。
- **PASS**：Node 14/14 文件通过；P0 oracle 276,096 数值断言和17,256财富守恒断言通过；4,314日两策略逐日结果与原始值相同，原24笔股息保持不变。
- **PASS（本地 Chromium）**：2152/1440/1075/390 px × Light/Dark 八组；运行、日期筛选、显示休市日/空行情栏/日息、图表、价格曲线、复选框、Tooltip、JSON 与24笔股息回归通过，页面错误0。Yahoo 503 与 localStorage 配额失败时快照和界面回滚通过。
- **通过**：`git diff --check` 与 Site Worker 13静态资产构建。未执行生产浏览器交互或完整真实 Yahoo 历史下载；fixture 不代表真实提供方全历史可用。
- Bursa 官方逐日覆盖边界未变：2015–2021 `BLOCKED`、2022–2026 `PARTIAL`。Yahoo `^KLSE` 的缺市工作日属于基准推定，不能冒称官方公告确认。
- Sites 原 URL 与 owner-only policy revision 1 保持不变；最终 Site Version、源码提交、部署 ID 及 GitHub Actions 结果见项目状态和执行报告。


## 最终修订：显示休市日并一键运行（2026-10-25）

- 逐日流水及 CSV 保留周末和休市日行，行情/风险相关股票数据为空；贷款、股数和日息照常显示。资金引擎继续按日历日累计融资利息。
- 股票代码旁「运行」获取所选 `.KL` 与 `^KLSE`，刷新动态日历后直接回测/保存。移除独立 Yahoo 更新、行情审核和市场数据 CSV 导入；保留「导入 JSON」，股息 CSV 仍单独管理。
- Node 14/14；历史 4,314 日、双策略、24 笔股息及 P0 oracle 无变化。Chromium 8/8；包含休市行、日期筛选、图表、Tooltip、价格线、趋势线复选框以及 Yahoo/存储失败回滚。
- Site Version 44 成功，部署 `appgdep_6add73fde014819194ae95739eb9ad3c`，源提交 `9d4469f5b0b01d74a74b1260bbe5e79a0ffb4ad1`。原 URL 与 owner-only policy revision 1 不变。
- 官方逐日覆盖仍为 2015–2021 `BLOCKED`、2022–2026 `PARTIAL`；Yahoo 推定日期不冒充官方确认。生产浏览器交互及 Yahoo 全历史真实抓取未运行。