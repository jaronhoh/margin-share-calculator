const EPS = 1e-9;
const MAX_LOTS = 1_000_000_000;
const MAX_AMOUNT = Number.MAX_SAFE_INTEGER / 100;
export const BOARD_LOT_SIZE = 100;

export function transactionFees(config, notional) {
  const value = Number(notional);
  if (!Number.isFinite(value) || value < 0 || value > MAX_AMOUNT) throw new Error("成交金额超出安全计算范围。");
  if (value <= EPS) return {brokerage: 0, clearing: 0, stampDuty: 0, sst: 0, total: 0};
  const hasSchedule = config.feeModel !== 'legacy-flat' && ['brokerageMinimum', 'stampDutyRate', 'clearingFeeRate', 'sstRate'].some(key => Number.isFinite(config[key]));
  if (!hasSchedule) {
    const total = value * (Number(config.feeRate) || 0);
    return {brokerage: total, clearing: 0, stampDuty: 0, sst: 0, total};
  }
  const brokerageRate = Number(config.feeRate) || 0;
  const brokerageMinimum = Math.max(0, Number(config.brokerageMinimum) || 0);
  const brokerage = Math.max(value * brokerageRate, brokerageMinimum);
  const clearing = Math.min(value * (Number(config.clearingFeeRate) || 0), Math.max(0, Number(config.clearingFeeCap ?? 1000)));
  const rawStamp = Math.ceil(value / 1000 - EPS) * 1000 * (Number(config.stampDutyRate) || 0);
  const stampDuty = Math.min(rawStamp > 0 ? rawStamp : 0, Math.max(0, Number(config.stampDutyCap ?? 1000)));
  const sst = brokerage * (Number(config.sstRate) || 0);
  return {brokerage, clearing, stampDuty, sst, total: brokerage + clearing + stampDuty + sst};
}

export function calculateInitialAllocation({cashBudget, startPrice, targetLsr, lotSize = BOARD_LOT_SIZE, ...feeConfig}) {
  const cash = Number(cashBudget), price = Number(startPrice), target = Number(targetLsr);
  if (![cash, price, target, lotSize].every(Number.isFinite) || cash < 0 || price <= 0 || target <= 0 || target >= 1 || lotSize !== BOARD_LOT_SIZE) throw new Error('可用现金、开始日价格、目标 LSR 或每手股数无效。');
  const requiredCash = lots => {
    const financedLots = Math.floor(lots * target + EPS);
    const ownShares = (lots - financedLots) * lotSize;
    const totalShares = lots * lotSize;
    return {ownShares, financedShares: financedLots * lotSize, totalShares, usedCash: ownShares * price + transactionFees(feeConfig, totalShares * price).total};
  };
  let low = 0, high = Math.max(1, Math.ceil(cash / ((1 - target) * price * lotSize)) + 2);
  if (cash > MAX_AMOUNT || !Number.isSafeInteger(high) || high > MAX_LOTS) throw new Error("可用现金或配股手数超出安全计算范围。");
  while (requiredCash(high).usedCash <= cash && high < MAX_LOTS) high *= 2;
  let iterations = 0;
  while (low < high) {
    if (++iterations > 64) throw new Error("配股计算未收敛，请检查参数。");
    const mid = Math.ceil((low + high) / 2);
    if (requiredCash(mid).usedCash <= cash + EPS) low = mid;
    else high = mid - 1;
  }
  const allocation = requiredCash(low), fees = transactionFees(feeConfig, allocation.totalShares * price).total;
  return {...allocation, estimatedBuyFees: fees, remainingCash: Math.max(0, cash - allocation.usedCash)};
}

export function initialState(config) {
  const ownShares = Number(config.ownShares);
  const financedShares = Number(config.financedShares);
  const startPrice = Number(config.startPrice);
  if (![ownShares, financedShares, startPrice].every(Number.isFinite) || ownShares < 0 || financedShares < 0 || startPrice <= 0 || ownShares + financedShares <= 0) {
    throw new Error("初始股数和价格必须有效，且总股数大于 0。");
  }
  return {
    shares: ownShares + financedShares,
    cashShares: ownShares,
    financedShares,
    loan: financedShares * startPrice,
    accruedInterest: 0,
    cashCollateral: 0,
    dividendCash: 0,
    saleCash: 0,
    cumulativeDividend: 0,
    cumulativeInterest: 0,
    cumulativeCapitalized: 0,
    cumulativeRefinance: 0,
    cumulativeTopUp: 0,
    cumulativeSold: 0,
    cumulativeFees: 0
  };
}

function validate(config, market) {
  if (!Array.isArray(market) || market.length === 0) throw new Error("需要至少一天的行情数据。");
  const nums = [config.annualRate, config.targetLsr, config.refinanceTrigger, config.marginCallLsr, config.safeGap, config.feeRate, config.lotSize];
  if (!nums.every(Number.isFinite)) throw new Error("所有高级参数必须是有效数字。");
  if (config.annualRate < 0 || config.annualRate > 1) throw new Error("年利率需介于 0% 与 100%。");
  if (!(config.refinanceTrigger >= 0 && config.refinanceTrigger < config.targetLsr && config.targetLsr < config.marginCallLsr && config.marginCallLsr < 1)) throw new Error("阈值顺序需满足：再融资触发 < 目标 LSR < Margin Call < 100%。");
  if (config.safeGap <= 0 || config.safeGap > 0.1 || config.safeGap >= config.marginCallLsr - config.refinanceTrigger) throw new Error("安全余量需大于0、不超过10个百分点，且小于追缴线与再融资触发线之差。");
  const detailedFeeModel = config.feeModel !== 'legacy-flat' && [config.brokerageMinimum, config.stampDutyRate, config.clearingFeeRate, config.sstRate].some(Number.isFinite);
  if (config.feeRate < 0 || config.feeRate >= (detailedFeeModel ? 0.00701 : 0.5)) throw new Error(detailedFeeModel ? "券商佣金费率需介于 0% 与 0.7%。" : "交易费用比例需介于 0% 与 50%。");
  for (const [key, max] of [['stampDutyRate', .01], ['clearingFeeRate', .01], ['sstRate', .2]]) if (config[key] != null && (!Number.isFinite(config[key]) || config[key] < 0 || config[key] > max)) throw new Error('交易费用参数无效。');
  for (const key of ['brokerageMinimum', 'stampDutyCap', 'clearingFeeCap']) if (config[key] != null && (!Number.isFinite(config[key]) || config[key] < 0 || config[key] > MAX_AMOUNT)) throw new Error('交易费用下限/上限无效。');
  if (config.lotSize !== BOARD_LOT_SIZE) throw new Error("买卖每手固定为 100 股；交易数量必须为 100 股的整数倍。");
  if (![config.ownShares, config.financedShares].every(x => Number.isSafeInteger(Number(x)) && Number(x) >= 0 && Number(x) <= MAX_LOTS * BOARD_LOT_SIZE)) throw new Error("初始股数超出安全计算范围。");
  if (!Number.isFinite(config.startPrice) || config.startPrice <= 0 || (config.ownShares + config.financedShares) * config.startPrice > MAX_AMOUNT) throw new Error("初始金额超出安全计算范围。");
  let previous = "";
  for (const day of market) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day.date) || day.date <= previous || !Number.isFinite(day.price) || day.price <= 0 || !Number.isFinite(day.dividendPerShare ?? 0) || (day.dividendPerShare ?? 0) < 0) throw new Error("行情必须按日期升序且不重复；价格需大于 0，股息不得为负。");
    const parsed = new Date(`${day.date}T00:00:00Z`);
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0,10) !== day.date) throw new Error("行情日期无效。");
    if (previous && (parsed - new Date(`${previous}T00:00:00Z`)) !== 86400000) throw new Error("逐日计息需要连续日历日；请补齐缺失日期的价格。");
    previous = day.date;
  }
  if (!['cash', 'sell'].includes(config.callStrategy)) throw new Error("Margin Call 策略无效。");
  if (config.forceSellLsr != null && (!Number.isFinite(config.forceSellLsr) || config.forceSellLsr <= config.marginCallLsr || config.forceSellLsr >= 1)) throw new Error("强制卖出阈值须高于 Margin Call 且低于 100%。");
}

const roundLotsDown = (shares, lot) => Math.floor((shares + EPS) / lot) * lot;

export function runBacktest(config, market) {
  validate(config, market);
  const state = initialState(config);
  const initialFees = config.chargeInitialFees ? transactionFees(config, state.shares * config.startPrice).total : 0;
  state.cumulativeFees += initialFees;
  const rows = [];
  let blocked = null;
  for (const day of market) {
    const canTrade = day.tradeAllowed !== false;
    if (![state.loan, state.accruedInterest, state.shares * day.price, state.shares * (day.dividendPerShare ?? 0)].every(x => Number.isFinite(x) && x >= 0 && x <= MAX_AMOUNT)) throw new Error('日账金额超出安全计算范围。');
    // Accrue on opening principal; month-end posts all pending interest,
    // including today's accrual. No pre-start accrual or synthetic end-date posting.
    const interest = state.loan * config.annualRate / 365;
    state.accruedInterest += interest;
    state.cumulativeInterest += interest;
    const tomorrow = new Date(`${day.date}T00:00:00Z`);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const isMonthEnd = tomorrow.getUTCDate() === 1;
    const capitalizedInterest = isMonthEnd ? state.accruedInterest : 0;
    state.loan += capitalizedInterest;
    state.cumulativeCapitalized += capitalizedInterest;
    state.accruedInterest -= capitalizedInterest;
    const loanAfterCapitalization = state.loan;

    const dividend = state.shares * (day.dividendPerShare ?? 0);
    state.cumulativeDividend += dividend;
    const debtPayment = Math.min(state.loan, dividend);
    state.loan -= debtPayment;
    state.dividendCash += dividend - debtPayment;

    let marketValue = state.shares * day.price;
    let lsr = marketValue + state.cashCollateral > EPS ? state.loan / (marketValue + state.cashCollateral) : null;
    let saleCash = 0, saleDebtPayment = 0, topUp = 0, soldShares = 0, soldFinancedShares = 0, soldCashShares = 0, soldNotional = 0, refinanceNotional = 0, refinanceShares = 0, cashBuyShares = 0, fees = rows.length === 0 ? initialFees : 0;
    const events = capitalizedInterest > 0 ? ["月末利息资本化"] : [];
    if (rows.length === 0 && initialFees > 0) events.push("初始建仓交易费");

    if (config.forceSellLsr != null && lsr != null && lsr >= config.forceSellLsr) {
      blocked = {date: day.date, reason: `LSR 达到 ${pct(config.forceSellLsr)} 强制卖出线；其业务规则尚待确认，PoC 停止并标记。`};
      events.push("强平规则未决：停止模拟");
    } else if (canTrade && lsr != null && lsr >= config.marginCallLsr) {
      const releaseLsr = config.marginCallLsr - config.safeGap;
      if (config.callStrategy === "cash") {
        const requiredMarketValue = Math.max(0, state.loan / releaseLsr - (marketValue + state.cashCollateral));
        cashBuyShares = Math.ceil(Math.max(0, requiredMarketValue / day.price - EPS) / config.lotSize) * config.lotSize;
        const cashBuyNotional = cashBuyShares * day.price;
        const cashBuyFees = transactionFees(config, cashBuyNotional).total;
        topUp = cashBuyNotional + cashBuyFees;
        state.cashShares += cashBuyShares;
        state.shares += cashBuyShares;
        fees += cashBuyFees;
        state.cumulativeFees += cashBuyFees;
        state.cumulativeTopUp += topUp;
        events.push(cashBuyShares > 0 ? "现金补仓买股" : "追缴检查");
      } else {
        // Sell financed holdings first and use their proceeds to repay the loan.
        // Cash-funded holdings remain untouched by this margin-call strategy.
        const maxShares = roundLotsDown(state.financedShares, config.lotSize);
        const passesRelease = quantity => {
          const notional = quantity * day.price, fee = transactionFees(config, notional).total;
          const afterLoan = Math.max(0, state.loan - notional + fee), afterValue = marketValue - notional + state.cashCollateral;
          return afterValue > EPS && afterLoan / afterValue <= releaseLsr;
        };
        let lowLots = 0, highLots = Math.floor(maxShares / config.lotSize);
        if (!passesRelease(highLots * config.lotSize)) lowLots = highLots;
        else while (lowLots < highLots) { const mid = Math.floor((lowLots + highLots) / 2); if (passesRelease(mid * config.lotSize)) highLots = mid; else lowLots = mid + 1; }
        const quantity = lowLots * config.lotSize;
        const candidateNotional = quantity * day.price;
        const candidateFee = transactionFees(config, candidateNotional).total;
        if (quantity > 0 && candidateNotional - candidateFee <= EPS) {
          blocked = {date: day.date, reason: '卖出净所得不足以偿债，停止模拟；未卖出持股或增加贷款。'};
          events.push('卖出净所得不足：停止模拟');
        }
        const executedQuantity = blocked ? 0 : quantity;
        soldShares = executedQuantity;
        soldFinancedShares = executedQuantity;
        soldNotional = executedQuantity * day.price;
        const sellFees = transactionFees(config, soldNotional).total;
        fees += sellFees;
        state.financedShares -= soldFinancedShares;
        state.shares -= executedQuantity;
        const netProceeds = soldNotional - sellFees;
        saleDebtPayment = Math.min(state.loan, netProceeds);
        saleCash = netProceeds - saleDebtPayment;
        state.saleCash += saleCash;
        state.loan -= saleDebtPayment;
        state.cumulativeSold += soldNotional;
        state.cumulativeFees += sellFees;
        if (!blocked) events.push(executedQuantity > 0 ? "卖股还款" : "可售股数不足");
      }
      marketValue = state.shares * day.price;
      lsr = marketValue + state.cashCollateral > EPS ? state.loan / (marketValue + state.cashCollateral) : null;
      if (config.callStrategy === "sell" && (lsr != null ? lsr >= config.marginCallLsr : state.loan > EPS)) events.push("可售整手不足：追缴未解除");
    }

    if (!blocked && canTrade && lsr != null && lsr <= config.refinanceTrigger && topUp === 0 && soldShares === 0) {
      const ratioAfter = lots => { const amount = lots * config.lotSize * day.price, fee = transactionFees(config, amount).total; return (state.loan + amount + fee) / Math.max(EPS, marketValue + state.cashCollateral + amount); };
      let lowLots = 0, highLots = Math.max(1, Math.ceil(Math.max(0, (config.targetLsr * (marketValue + state.cashCollateral) - state.loan) / Math.max(EPS, (1 - config.targetLsr) * day.price * config.lotSize))) + 2);
      if (!Number.isSafeInteger(highLots) || highLots > MAX_LOTS) throw new Error("再融资手数超出安全计算范围。");
      while (ratioAfter(highLots) <= config.targetLsr && highLots < 1_000_000_000) highLots *= 2;
      while (lowLots < highLots) { const mid = Math.ceil((lowLots + highLots) / 2); if (ratioAfter(mid) <= config.targetLsr + EPS) lowLots = mid; else highLots = mid - 1; }
      refinanceShares = lowLots * config.lotSize;
      refinanceNotional = refinanceShares * day.price;
      state.financedShares += refinanceShares;
      const refinanceFees = transactionFees(config, refinanceNotional).total;
      fees += refinanceFees;
      state.loan += refinanceNotional + refinanceFees;
      state.shares += refinanceShares;
      state.cumulativeRefinance += refinanceNotional;
      state.cumulativeFees += refinanceFees;
      marketValue = state.shares * day.price;
      lsr = state.loan / (marketValue + state.cashCollateral);
      if (refinanceShares > 0) events.push("触发再融资买股");
    }

    if (![state.loan, marketValue, state.accruedInterest, state.dividendCash, state.saleCash].every(x => Number.isFinite(x) && x >= 0 && x <= MAX_AMOUNT)) throw new Error('日账金额超出安全计算范围。');
    rows.push({date: day.date, price: day.price, carryForward: day.carryForward === true, carryForwardFrom: day.carryForwardFrom, carryForwardReason: day.carryForwardReason, shares: state.shares, cashShares: state.cashShares, financedShares: state.financedShares, marketValue, loan: state.loan, capitalizedInterest, loanAfterCapitalization, accruedInterest: state.accruedInterest, dailyInterest: interest, dividend, debtPayment, saleDebtPayment, saleCash, saleCashBalance: state.saleCash, dividendCashBalance: state.dividendCash, cashCollateral: state.cashCollateral, lsr, topUp, soldShares, soldFinancedShares, soldCashShares, soldNotional, cashBuyShares, refinanceShares, financedBuyShares: refinanceShares, refinanceNotional, fees, netWorth: marketValue - state.loan, events: events.join(" · ") || "—"});
    if (blocked) break;
  }
  return {rows, blocked, summary: {...state, endingMarketValue: rows.at(-1)?.marketValue ?? 0, endingLsr: rows.at(-1)?.lsr ?? null, endingNetWorth: rows.at(-1)?.netWorth ?? 0, days: rows.length}};
}

const pct = n => `${(n * 100).toFixed(2)}%`;

