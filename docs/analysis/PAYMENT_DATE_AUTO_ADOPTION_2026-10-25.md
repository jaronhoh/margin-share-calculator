# Payment Date 唯一候选自动采用回归（2026-10-25）

## 修改
- KLSE Screener 为同一股票与 Ex-Date 返回唯一不同付款日时，自动将付款日期写入本地快照并调用现有完整回测渲染流程；无需逐项点击或确认。
- 只更改入账日期。原 Excel/Yahoo 每股股息金额保留，KLSE 来源金额、来源单位、链接以及 `approvalMode=unique-date-auto` 单独留痕。
- 多个不同付款日期不会自动选取。刷新后若原自动采用记录出现日期冲突，撤销自动采用并重新计算；既有用户手动确认不会静默覆盖。

## 实际测试
- 本地 Chromium E2E：PASS。验证 2015-02-18 唯一 Percentage 来源候选自动采用为 2015-03-05；31 Percentage 未转换为 RM/股；2025-03-21 金额不同的候选自动采用 2025-04-09，快照继续保存 RM0.29 回测金额及 RM0.28 来源金额；付款日当日流水计入股息；多个日期冲突不自动采用；24 笔 Excel 事件数量保持；零浏览器错误。
- Node 全套：38/38 PASS。
- P0：既有历史 oracle 276,096 数值断言及 17,256 财富守恒断言通过；4,314 日、两策略回归 PASS。此次仅改付款日应用流程，不改财务公式。
- Site Worker build 与 `git diff --check`：PASS。
- GitHub Actions `Site source tests` run 165 / ID `40178821358`：SUCCESS。
- 已部署现有 owner-only Site Version 60；Site source commit `e047eed1b2eaf53eff01566d1987da566fadfdcd`，deployment `appgdep_6addc575cc0881919550002f80fc2c19` succeeded。原 URL、owner-only access policy revision 1、Owner allowlist 和外部访客数 0 不变。
- 当前线上生产登录态没有执行 Run；用户浏览器需刷新到 Version 60，并再次按「运行」获取最新 Yahoo/KLSE 数据，随后唯一日期候选会自动确认并重算。生产资料本身仍需留意第三方准确性和完整性。
