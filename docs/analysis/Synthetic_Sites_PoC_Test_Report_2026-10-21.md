# Synthetic Sites PoC 测试与部署报告（2026-10-21）

## 环境与范围
- GitHub 项目：`jaronhoh/margin-share-calculator`，默认分支 `main`。
- 隔离 ChatGPT Site：<https://margin-share-calculator-poc-20261021.savoryboar128.chatgpt.site>
- Site 项目 ID：`appgprj_6ad816b7dd508191a8632550d36f375f`；Site version 1。
- 源码提交：`a612e8c0ab65168e06461b3fb79408dbdef6724a`（Site 自有源仓库）。
- 部署 ID：`appgdep_6ad818dce2d48191a18e54a7e92121ff`；Sites 状态 `succeeded`，时间 2026-10-21 09:44（Asia/Kuala_Lumpur）。
- 访问：Sites 返回 Owner 为当前用户，访问策略只列出 Owner，外部访客 0、群组 0。未改动任何既有 Site。
- 数据：只使用生成的合成价格与股息；未连接真实行情、券商账户或其他项目的数据。

## 已实现
- 单页中文静态应用，含回测日期、初始自有/融资股数、开始日股价、年利率、LSR 阈值、Margin Call 策略、费用与手数参数。
- 逐日引擎：按日计息（年利率/365）、日历月末资本化；股息用于偿债；低 LSR 联立求解再融资买股；Margin Call 支持现金加入抵押品或卖股还款。
- 逐日流水、贷款与 LSR 趋势图、JSON 配置导入/导出。
- 达到未确认的强平线时暂停并报告，不模拟未决强平行为。
- 事件顺序、1 股默认手数、逐日假设行情与按成交额百分比计算的费用属于 PoC 明示假设，不代表已确认产品规则。

## 自动化测试
执行：`node tests/engine.test.mjs`

**结果：14 PASS，0 FAIL。** 覆盖初始 Excel 样本、日息、1/2 月月末资本化、股息偿债与余额、再融资目标 LSR、两种追缴策略、费用、股价上涨触发、强平未决停止、输入校验、无负交易股数。

## Excel 差异核对
按仓库审计报告记录的确认值，5 项合成样本对照通过：
- 股数 28,500；初始贷款 RM156,807；初始市值 RM261,345；LSR 60%；5% 年息首日 RM21.48041096。
- 本轮未取得原始 `Leverage Calculator.xlsx`，因此**未重新计算或逐行比较 Excel 的 4,018 天**。
- 已有审计报告显示 Excel 缓存算术关系内部一致，但月末资本化列 132 次均为零，交易数量有负值；本 PoC 不复刻这些异常。
- 完整 Excel 文件差异验证、真实 Bursa 历史行情/付款日、公司行动、真实手数与费用、强平及净资产资金口径仍未验证/待决策。此 PoC 不能用于真实投资决策。

## 证据分类
- GitHub verified：PRD、状态、审计和历史测试报告。
- Sites verified：部署成功、访问策略和 version/source commit。
- 本地执行：14 项引擎测试与 5 项 Excel 样本核对。
- 未验证：原始工作簿全量重算、浏览器截图级 QA、真实行情与产品级业务验收。
