# BUG-UAT-002 · Public Bank 股息口径复核

2026-11-08，1295.KL，复核区间 2015-01-01 至 2026-11-07（马来西亚时间）。使用 Yahoo Chart 两个主机返回的日线、股息和拆股事件，以及 KLSE Screener 的当前股息表。将公开响应交给本地 Site Worker 和现有 Yahoo 解析、付款日匹配逻辑。两个 Yahoo 主机的 24 项股息一致。复核使用本地环境。

## 24 项对照结果

- 全部 24 项 Yahoo 股息均有相同 Ex-Date 的唯一 KLSE Screener 付款日候选。红股前 11 项显示金额口径差异，红股后 13 项的每股金额直接相等。
- Public Bank 在 2021-01-29 完成每 1 股获配 4 股红股。Yahoo 在 2021-01-26 Ex-Date 记录 5:1。2019-12-31 的 Yahoo `quote.close` 为约 RM3.888，恰为发行人记录 RM19.44 的五分之一。这个交叉检查表明该样本的历史价格和股息均以红股后的股份基准表示。[2019 年财务报表，第 4 页](https://www.publicbankgroup.com/media/oxadxkcd/fs_2019.pdf) · [2020 年财务报表](https://www.publicbankgroup.com/media/b10l4n2h/fs_2020.pdf)
- 红股前的五项 `Percentage` 在对应时期以每股 RM1.00 面值计算。该基准来自发行人当期报表。下表的原始 RM 金额用于人工对账，应用保留来源百分比。其他股票和年份应按各自发行文件核实。[2015 年财务报表](https://publicbankgroup.com/media/34obbdoa/fs_2015.pdf) · [2016 年财务报表](https://publicbankgroup.com/media/4gwf2lus/fs_2016.pdf) · [2017 年派息记录，第 22 页](https://www.publicbankgroup.com/media/bxlpcslc/pbb4q2017.pdf)

| Ex-Date | KLSE 候选付款日 | KLSE 原值 | 当时每股 RM | Yahoo 每股 RM |
| --- | --- | ---: | ---: | ---: |
| 2015-02-18 | 2015-03-05 | 31% | 0.31 | 0.062 |
| 2015-08-12 | 2015-08-24 | 24% | 0.24 | 0.048 |
| 2016-02-18 | 2016-03-01 | 32% | 0.32 | 0.064 |
| 2016-08-10 | 2016-08-22 | 26% | 0.26 | 0.052 |
| 2017-02-16 | 2017-02-28 | 32% | 0.32 | 0.064 |
| 2017-08-07 | 2017-08-17 | RM0.27 | 0.27 | 0.054 |
| 2018-03-13 | 2018-03-23 | RM0.34 | 0.34 | 0.068 |
| 2018-09-05 | 2018-09-19 | RM0.32 | 0.32 | 0.064 |
| 2019-03-05 | 2019-03-14 | RM0.37 | 0.37 | 0.074 |
| 2019-08-28 | 2019-09-10 | RM0.33 | 0.33 | 0.066 |
| 2020-03-11 | 2020-03-20 | RM0.40 | 0.40 | 0.080 |

数据入口 [Yahoo Chart 日线与公司行动](https://query1.finance.yahoo.com/v8/finance/chart/1295.KL?period1=1420041600&period2=1794009600&interval=1d&events=div%2Csplits) · [KLSE Screener 1295 股息表](https://www.klsescreener.com/v2/stocks/view/1295)。

## 分支处理

1295.KL 在本次区间观察到的五倍差异已解释。页面补充股数基准提示，继续保留 Yahoo 回测金额和 KLSE 原始单位。回归覆盖红股前的 Currency、Percentage 和红股后的 Currency。候选付款日仍标作第三方来源，本次金额复核的结论仅适用于该股票和区间。历史真实手数、历史逐笔成本与完整的生产 UAT 仍需独立验证。
