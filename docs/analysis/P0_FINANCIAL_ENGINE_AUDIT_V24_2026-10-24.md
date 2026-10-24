# P0 财务引擎只读审计与修复验收 — UI v24（2026-10-24）

## 范围与发布身份

本报告记录 P0 财务引擎审计、已批准的修复及部署证据。当前只写文档，不改 Site 源码或配置，也不触发部署。

- 现有 Owner-only Site：Version 30 / UI v24；URL：https://margin-share-calculator-poc-20261021.savoryboar128.chatgpt.site/
- 部署：`appgdep_6adc7a5903208191bf7d38681099114a`，`succeeded`
- 保存版本：`appgprj_6ad816b7dd508191a8632550d36f375f~appgver_f1b7b18c8b908191bb907d90f868c9a6`
- Site 源提交：`34e19990cd6f6101ec43fffacf2f862d62759119`
- Owner-only 策略：单一获准 Owner，外部访客、群组、编辑者均为0；revision 1。
- 原有 Site 身份、URL、访问设置保持不变。该记录不表示 GitHub CI 已运行或通过。

## P0 结果

修复覆盖了数值输入和可负担整手搜索的边界保护；费率为零时最低佣金仍按规则计算；印花税按每 RM1,000 或不足部分取整并受上限约束；旧费率平收费配置保持兼容。融资买入费用入贷款，卖股费用从净卖款扣除。若净卖款非正则阻止卖出路径；正的超额净款进入 `saleCash` 并在流水展示现金/偿债分配。

股息清偿贷款后允许后续再融资；执行 Margin Call 的同日不重复再融资。JSON 兼容保留旧持股比例、旧费用和旧配置元数据；新费用表、日期与股数预算关系在应用前验证。开始价为只读且与历史日期校验，重置使用当前日期/价格截止。具体规则与产品口径见 PRD v0.13。

## 独立数值验证

- 27 项现有引擎检查通过。
- 24 条股息数据源记录/往返检查通过。
- 现金补仓与卖股两策略各运行 4,314 日，检查100股整手和自有股/融资股分类。
- 两策略的日级回归共 48,216 项独立数值检查通过。
- 新费用/现金分配测试覆盖最低佣金、取整、费用上限、可选 SST、初始现金分配及首日费用。
- P0 独立 oracle 对4个配置执行逐手枚举（两种策略、费用开/关），每个配置各4,314日，共276,096个数值断言；17,256项财富守恒检查通过。
- 本地 Chromium 验证 1280×720 亮/暗主题、重置、旧 JSON 导入、新 JSON 导出/导入。
- 生产 Site 只读核验 UI v24、4,314 行及无可见错误。

以上为实际执行并通过的项目。没有执行原生 Excel 复算、完整 1440/1075/390 响应视口及所有浏览器主题组合、第二账号/非 Owner 登录验证；不得把这些列为通过。

## Excel 缓存差异：可复现证据及边界

原工作簿：`/Users/jaron/Desktop/Leverage Calculator.xlsx`。复算实验仅在临时副本进行，原文件哈希前后相同：`3637f45cea0dd6b41b66bab69a370a57da3d02b3d23bc5080abad6535eb100d2`。LibreOfficeDev 复算了69,024个公式，贷款、利息、股数、LSR和事件列与保存缓存的关键数值在 RM0.01 内一致，未见公式错误单元格。

可定位的月末公式为 `P34 = IF(AND(B34=1,,P$3=1),O34,0)`，其中 AND 函数参数之间有空项。LibreOffice 对原公式复算 `P34=0`；在临时副本只移除该空参数后，`P34=RM665.892739726028`，下一日贷款 `I35=RM157472.892739726`。这证明在本次 LibreOffice 环境中空参数改变了月末资本化结果，并且公式差异能解释月末缓存落差。原生 Excel 未执行；Excel 对该空参数的具体处理仍待验证，所以不能宣称已完成原生 Excel 等价验收。Site 引擎遵循 PRD 的月末资本化口径。

## 待核实市场规则（P1，不是已证实的引擎缺陷）

1. **历史费用日程**：当前输入的费率在整个回测期固定使用。SC/Bursa 公告显示印花税从0.15%降至0.10%，生效日为2023-07；使用当前费率回测更早日期不能代表历史实际费用。参考：[SC/Bursa 公告](https://www.sc.com.my/resources/media/media-release/sc-bursa-measures-to-boost-capital-market-vibrancy-and-competitiveness)。
2. **当前公开费率冲突**：Maybank 当前分享交易网页列出印花税每RM1,000或不足部分RM1、上限RM1,000；其2025-10-31生效 PDS 列出 RM1.50/1,000。应以具体账户的最新合约/成交单据及券商书面答复核实。参考：[Maybank 网页](https://www.maybank2u.com.my/maybank2u/malaysia/en/personal/services/digital_banking/share-trading-cash-account.page)、[Maybank PDS](https://www.maybank2u.com.my/iwov-resources/pdf/personal/digital_banking/share-trading-pds.pdf)。
3. **股息资格日期**：现有24条事件有日期/金额，但未完整核验每条公告和除权日。模型在记录的股息事件日按当日持股计算并将股息用于还贷；若该日期是支付日且期间发生过交易，资格股数可能不同。需逐笔补齐除权/登记/支付日期后确认入账口径。抽样公告参考：[2023公告](https://maybank.listedcompany.com/news.html/id/2429190)、[2024公告](https://maybank.listedcompany.com/news.html/id/2508849)、[2026公告](https://maybank.listedcompany.com/news.html/id/2626995)。抽样核对不代表24条全数验证。
4. **原生 Excel**：当前只确认 LibreOffice 对公式的可复现行为；若要求 Excel 等价，需要在原生 Excel 中复算并记录版本/平台。

## 结论与建议

P0 数值与流程修复已部署，列出的自动验证和限定范围的浏览器验证均通过。剩余事项属于历史市场规则、外部数据资格日期和原生 Excel 验收边界，应作为 P1 单独推进。尚未验证的市场规则不能写成已确认实现缺陷；如要提升历史回测精度，最小下一步是取得适用账户的历史费率表和24条公司行动公告，建立逐条带来源日期的费用/股息清单。
