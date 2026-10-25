# Bursa Malaysia 休市日回归报告

日期：2026-10-25（Asia/Kuala_Lumpur）

## 代码行为

- Bursa 日历按逐日官方来源维护；目前只确认 5 个工作日：2022-12-26、2023-01-02、2024-09-16、2025-01-29、2025-01-30。
- 周末、确认闭市日、未确认工作日和有行情的正常交易日分别分类。未从马来西亚公共假期推断 Bursa 闭市。
- 流水过滤隐藏周末及已确认闭市日；日期定位使用过滤后的流水，财务引擎继续保留所有日历日。
- Yahoo / CSV 候选可为周末及确认闭市日补前收盘价，并保存 carryForward、来源日期、原因及闭市公告来源。未知工作日缺价、重复日期、无效价格拒绝。冲突与人工修正须显式选择。完整快照扩充后不超过 5,000 条。
- 原子提交/失败回滚机制保留。

## 历史回测核对

数据：4,314 日（2015-01-01 至 2026-10-23），现有 24 条股息。比较旧的周一至周五交易许可规则与 Bursa 确认闭市规则，两策略逐日结果均完全一致：

| 策略 | 期末持股 | 股票市值 RM | 贷款 RM | 净资产 RM | LSR | 累计利息 RM | 累计股息 RM | 追缴交易日数 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 现金补仓 | 171,100 | 1,705,867.00 | 1,118,885.71 | 586,981.29 | 65.5904% | 254,810.62 | 542,086.00 | 16 |
| 卖股还款 | 72,500 | 722,825.00 | 474,072.49 | 248,752.51 | 65.5861% | 148,161.03 | 304,562.00 | 19 |

每日 shares、market value、loan、net worth、LSR、daily/accrued/capitalized interest、dividend、top-up 及 sold shares 均逐行相同；确认闭市日期没有造成历史追缴交易，因此无财务差异。利息公式及原始股息事件没有修改。

## 自动化测试

命令：node --test tests/*.test.mjs（Node 24.22.1）。

- **12/12 test files passed**。
- P0 oracle：276,096 项数值断言与 17,256 项财富守恒断言通过。
- 历史日历比较：两策略各 4,314 日逐行财务字段相同。
- Yahoo/快照：周末、连续周末、确认闭市、连续节假日、未知工作日缺价拒绝、重复价格、无效价格、扩充后超限、手工价格冲突保护、不可变候选与保存失败回滚通过。
- 股息测试仍断言原始 24 条事件不变。
- UI：**NOT RUN**。当前环境禁止本地 HTTP 监听；未报告浏览器、响应式或 Light/Dark 验收通过。

## 官方资料与明确缺口

- [Bursa 2022 Christmas / 2023 New Year closure](https://www.bursamalaysia.com/bm/about_bursa/media_centre/closure-of-bursa-malaysia-in-conjunction-with-the-christmas-and-new-year-holidays)
- [Bursa 2024 Malaysia Day closure](https://www.bursamalaysia.com/bm/about_bursa/media_centre/closure-of-bursa-malaysia-in-conjunction-with-prophet-muhammads-birthday-and-malaysia-day-trading-resumes-on-17-september-2024)
- [Bursa 2025 Chinese New Year closure](https://www.bursamalaysia.com/bm/about_bursa/media_centre/closure-of-bursa-malaysia-in-conjunction-with-the-chinese-new-year-public-holiday)
- [Bursa 2024 Hari Raya notice](https://www.bursamalaysia.com/bm/about_bursa/media_centre/closure-of-bursa-malaysia-in-conjunction-with-hari-raya-aidilfitri-2024)提供条件式的两种安排，最终日期缺少可确认公告，本轮保持未确认。
- 年度状态：2015–2021 **BLOCKED**；2022–2025 **PARTIAL**；2026 **PARTIAL**。名单不是完整年度交易所休市日历，未列日期仍按未确认处理。

## GitHub / Site 状态

- 目标 GitHub 分支：feat/trading-calendar-dividend-chart-controls；Draft PR #3 更新至 c5f2e94b18c468eb7d9aa8a782613922c72843ee。
- GitHub Actions：run 59 / ID 40149002878，结论 SUCCESS。
- 已将兼容线上 v38 的修改推送到同一 Site 源仓库 main：提交 38300dd7d5a9d1ab1653615d77adb1a0ffa919f3。发布为 Version 39，部署 succeeded；原 URL https://margin-share-calculator-poc-20261021.savoryboar128.chatgpt.site 不变。所有者仍是唯一允许用户，访问策略 revision 1。
- UI 浏览器回归 **NOT RUN**：打开生产 Site 显示登录门；通过站点的 ChatGPT 登录入口后，页面停在 Cloudflare 安全验证。未尝试解验证码或绕过。响应式、Light/Dark、Tooltip 和图表复选框的线上实测仍未完成。
- Sites 运行时没有修改本地存储/历史行情/股息；原24笔股息保持不变。
