# 部署阻断已解除 — 2026-10-23 Version 10

原报告中的DNS BLOCKED是历史结果。当前在获准网络环境中完成官方源码同步、推送和原Owner-only Site Version10部署，状态succeeded。收盘价和大图与Neutral主题一并上线；另修复待部署源码重复计算Table2股息的问题。部署ID `appgdep_6adb6c030ad481919bce58a42c17dcd2`；[最新完整报告](NEUTRAL_THEME_V10_TEST_REPORT_2026-10-23.md)。受限沙箱DNS失败仍可复现，不代表Site服务全局故障。

---

# MAYBANK 收盘价与趋势图更新记录 — 2026-10-23

## 用户请求
1. 趋势图扩大为结果区的大图，不局限于中间的小区域。
2. 把原“开盘价”改为收盘价，并使用用户提供的 MAYBANK Excel 数据。

## 数据来源与校验
- 输入文件：用户本地提供的 `Leverage Calculator.csv`（从工作簿逐日表导出的 CSV）；原 Excel 未改动。
- Table2 行数4317，首行为表名、第二行为字段名；读取字段 `Date`、`Stock Code`、`Close Price (RM)`、`Dividend Price (RM)`。
- 行情日期2015-01-01至2026-10-23，4,314条连续日历日，无日期间隔；代码均为1155.KL。
- 首日Close RM9.17；次日Close RM9.12；末日Close RM9.97。逐日Dividend Price合计RM6.99，与既有Table1 24条股息合计一致。
- 周末日期在CSV中有价格记录。回测按CSV逐日价格使用；可交易日策略目前仍按周一至周五近似，未应用马股公众假期日历。
- 价格缓存等价不代表引擎与Excel业务公式全期等价。历史Excel缓存数值等价FAIL仍有效，本次没有重跑该整表差异分析。

## 本地实现
- 本地Site工作树提交：`08a3278f8d32674eef2b59525e5aa77ee0e0a5e8`（Update Site source）。
- 包含 `dist/maybank-prices.json`（4,314行日期/收盘价/股息数据）和 `dist/index.html` 更新。
- 默认结束日改为2026-10-23；开始日收盘价从行情记录带出，修改开始日时同步更新。
- 仅接受MAYBANK 1155.KL；选择超出价格缓存的日期时明确报错，不插值或生成价格。
- 回测的 `price` 字段继续通用，图表与流水展示实际CSV Close Price；趋势图区域扩至结果区，响应高度420px至900px。
- 原月末利息资本化引擎没有修改。24条可编辑股息事件保留，Table2股息现金金额与这24条总额勾稽；日期实际付款属性仍待确认。

## 已执行验证
- Node测试：engine25项、daily-regression两策略各4,018日且48,216数值检查、dividends24项均PASS。
- CSV解析独立检查：4,314行、连续日期、收盘价数值有效，股息和RM6.99。
- 本地IAB浏览器：默认范围显示4,314日，2015-01-01收盘RM9.17，2015-01-02收盘RM9.12，页面提示Excel收盘价回测完成；月末资本化结果仍被现有引擎处理。
- 当前Site旧有V9的历史部署通过证据不能代表此次变更的线上验证。

## 部署状态：BLOCKED
- 目标Site仍为Version 9，URL为 https://margin-share-calculator-poc-20261021.savoryboar128.chatgpt.site/。
- 目标project_id：`appgprj_6ad816b7dd508191a8632550d36f375f`。
- 尝试Sites官方 `site-workflow.mjs`；失败文本：`fatal: unable to access 'https://git.chatgpt-team.site/...git/': Could not resolve host: git.chatgpt-team.site`。工作流提示本地提交保留。
- 发现并补回本地Git origin配置；后续用新签发凭证重试，仍因远端主机DNS解析失败未推送。
- 因未推送及未保存版本，没有新的Sites version_id或deployment_id。不得宣称已部署。
- Owner-only访问配置未更动；本次未执行权限变更。

## 后续动作
- 待 Sites Git 远端DNS/网络恢复后，将本地提交推送至同一个Site配置的main分支，基于该提交重新打包并部署。
- 部署后用站点只读读取确认版本与权限，再做线上浏览器检查。
