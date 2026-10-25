import {runBacktest,calculateInitialAllocation,transactionFees} from './engine.mjs';
import {normalizeDividend,validateDividends as validateDividendEvents} from './dividend-events.mjs';
import {classifyMarketDate,validateYahooMarketCalendar} from './market-calendar.mjs';
export const CONFIG_INPUT_IDS=['startDate','endDate','cashBudget','ownShares','financedShares','startPrice','annualRate','targetLsr','refinanceTrigger','marginCallLsr','forceSellLsr','callStrategy','safeGap','feeRate','brokerageMinimum','stampDutyRate','clearingFeeRate','sstRate','lotSize'];
    function importedMarketRows(data, priceRows, activeTicker){
      const source=data.marketDataSource,embedded=data.marketData;
      if(source?.marketCalendar){if(source.type!=='yahoo-chart-confirmed')throw new Error('JSON 市场日历只能来自已确认的 Yahoo 行情。');validateYahooMarketCalendar(source.marketCalendar);}
      if(!source&&!embedded)return priceRows;
      if(!source||!['excel-table2-close','user-csv-confirmed','yahoo-chart-confirmed'].includes(source.type)||source.ticker!==activeTicker)throw new Error('JSON 行情代码与收盘价来源不匹配。');
      if(source.type==='excel-table2-close'&&activeTicker!=='1155.KL')throw new Error('默认 Excel 收盘价只对应 MAYBANK 1155.KL。');
      if(['user-csv-confirmed','yahoo-chart-confirmed'].includes(source.type)&&(!source.fileName||typeof source.fileName!=='string'||typeof source.importedAt!=='string'||!Number.isFinite(Date.parse(source.importedAt))||!Array.isArray(source.manualDates)||source.manualDates.some(d=>typeof d!=='string')))throw new Error('JSON 行情来源或人工确认记录不完整。');
      if(['user-csv-confirmed','yahoo-chart-confirmed'].includes(source.type)&&embedded===undefined)throw new Error('已更新行情 JSON 必须包含完整收盘价快照。');
      if(embedded===undefined){if(source.startDate!==priceRows[0].date||source.endDate!==priceRows.at(-1).date||source.rowCount!==priceRows.length)throw new Error('JSON 未包含收盘价数据，且来源与当前 Site 数据不匹配。');return priceRows;}
      if(embedded.type!=='daily-close'||embedded.unit!=='MYR/share'||!Array.isArray(embedded.rows)||!Number.isInteger(source.rowCount)||embedded.rows.length!==source.rowCount||embedded.rows.length>5000||source.startDate!==embedded.rows[0]?.date||source.endDate!==embedded.rows.at(-1)?.date)throw new Error('JSON 收盘价数据不完整或与来源范围不一致。');
      const sourceRows=new Map(embedded.rows.map(row=>[row.date,row]));
      const rows=embedded.rows.map((row,i)=>{
        if(!row||typeof row.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(row.date)||!Number.isFinite(Date.parse(row.date+'T00:00:00Z'))||new Date(row.date+'T00:00:00Z').toISOString().slice(0,10)!==row.date||typeof row.close!=='number'||!Number.isFinite(row.close)||row.close<=0)throw new Error(`JSON 收盘价第 ${i+1} 条无效。`);
        if(i){const prior=new Date(rowsDateAt(embedded.rows,i-1)+'T00:00:00Z'),current=new Date(row.date+'T00:00:00Z');if(current-prior!==86400000)throw new Error(`JSON 收盘价日期不连续：${row.date}。`);}
        const normalized={date:row.date,close:row.close};
        if(row.carryForward===true){
          if(!['weekend','confirmed-market-holiday','yahoo-market-holiday'].includes(row.reason)||typeof row.carryForwardFrom!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(row.carryForwardFrom))throw new Error(`JSON 收盘价第 ${i+1} 条缺少补齐来源。`);
          const classification=classifyMarketDate(row.date,{marketCalendar:source.marketCalendar}),sourceRow=sourceRows.get(row.carryForwardFrom);
          if(!sourceRow||sourceRow.date>=row.date||sourceRow.close!==row.close)throw new Error(`JSON 收盘价第 ${i+1} 条前值来源无效。`);
          if(row.reason==='weekend'&&classification.status!=='weekend'||row.reason==='confirmed-market-holiday'&&classification.status!=='confirmed-market-holiday'||row.reason==='yahoo-market-holiday'&&classification.status!=='yahoo-market-holiday')throw new Error(`JSON 收盘价第 ${i+1} 条补齐原因与交易日历不符。`);
          if(['confirmed-market-holiday','yahoo-market-holiday'].includes(classification.status)&&(row.source!==classification.source||row.sourceUrl!==classification.url))throw new Error(`JSON 收盘价第 ${i+1} 条休市来源与日历不符。`);
          Object.assign(normalized,{carryForward:true,carryForwardFrom:row.carryForwardFrom,reason:row.reason});if(row.source)normalized.source=row.source;if(row.sourceUrl)normalized.sourceUrl=row.sourceUrl;
        }else if(row.carryForward!==undefined&&row.carryForward!==false)throw new Error(`JSON 收盘价第 ${i+1} 条补齐标记无效。`);
        return normalized;
      });
      if(rows[0].date!==source.startDate||rows.at(-1).date!==source.endDate)throw new Error('JSON 收盘价日期范围无效。');return rows;
    }
    function rowsDateAt(rows,index){return rows[index]?.date??'';}
    export function validateImportedConfig(data, priceRows, defaults){
      const ids=CONFIG_INPUT_IDS;
      if(!data||data.schema!=='margin-share-config/v1'||!data.inputs||typeof data.inputs!=='object'||Array.isArray(data.inputs))throw new Error('JSON 版本不符或缺少完整 inputs。');
      const c=data.inputs,out={},stockCode=String(data.stockCode??c.stockCode??'1155.KL').trim().toUpperCase();if(!/^[A-Z0-9][A-Z0-9^=-]{0,14}\.KL$/.test(stockCode))throw new Error('JSON 股票代码无效；请输入 Bursa Malaysia .KL 代码。');const selectedStockCode=String(data.selectedStockCode??stockCode).trim().toUpperCase();if(!/^[A-Z0-9][A-Z0-9^=-]{0,14}\.KL$/.test(selectedStockCode))throw new Error('JSON 选中的股票代码无效。');const prices=importedMarketRows(data, priceRows, stockCode),legacyFees=!['brokerageMinimum','stampDutyRate','clearingFeeRate','sstRate'].every(k=>Object.hasOwn(c,k));
      for(const id of ids){let v=c[id];if(v===undefined){if(id==='lotSize')v=100;else if(['cashBudget','brokerageMinimum','stampDutyRate','clearingFeeRate','sstRate'].includes(id))v=legacyFees?(id==='cashBudget'?undefined:0):defaults[id];}
        if(v===undefined){if(id==='cashBudget'&&Number.isFinite(c.ownShares)&&Number.isFinite(c.financedShares))continue;throw new Error(`JSON 缺少参数：${id}。`);}
        if(id==='startDate'||id==='endDate'){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v+'T00:00:00Z'))||new Date(v+'T00:00:00Z').toISOString().slice(0,10)!==v||!prices.some(x=>x.date===v))throw new Error(`JSON 日期无效或超出收盘价范围：${id}。`);out[id]=v;}
        else if(id==='callStrategy'){if(!['cash','sell'].includes(v))throw new Error('JSON 追缴策略无效。');out[id]=v;}
        else if(id==='forceSellLsr'&&v===null)out[id]=null;
        else{if(typeof v!=='number'||!Number.isFinite(v))throw new Error(`JSON 参数必须是有限数字：${id}。`);if(id==='lotSize'&&(!Number.isInteger(v)||v<1))throw new Error('JSON 每手股数无效。');out[id]=v;}}
      if(out.endDate<out.startDate)throw new Error('JSON 结束日期不能早于开始日期。');

      const source=data.marketDataSource;if(source&&(source.startDate!==prices[0].date||source.endDate!==prices.at(-1).date||source.rowCount!==prices.length))throw new Error('JSON 行情来源与收盘价数据不匹配。');if(source?.marketCalendar)validateYahooMarketCalendar(source.marketCalendar);if(data.marketData&&!source)throw new Error('JSON 收盘价数据缺少来源信息。');
      const manualPriceDates=data.marketOverrides?.manualPriceDates??[];if(!Array.isArray(manualPriceDates)||new Set(manualPriceDates).size!==manualPriceDates.length||manualPriceDates.some(d=>typeof d!=='string'||!prices.some(r=>r.date===d)))throw new Error('JSON 人工修正价格日期无效。');if(['user-csv-confirmed','yahoo-chart-confirmed'].includes(source?.type)&&(new Set(source.manualDates).size!==source.manualDates.length||source.manualDates.some(d=>!prices.some(r=>r.date===d))||source.manualDates.length!==manualPriceDates.length||source.manualDates.some(d=>!manualPriceDates.includes(d))))throw new Error('JSON 行情来源与人工修正日期记录不一致。');const raw=data.marketOverrides?.dividendEvents;if(!Array.isArray(raw))throw new Error('JSON 缺少股息事件数组。');const events=raw.map((x,i)=>{if(!x||typeof x!=='object'||typeof x.date!=='string'||typeof x.perShare!=='number'||!Number.isFinite(x.perShare))throw new Error(`JSON 股息事件 ${i+1} 格式无效。`);return normalizeDividend(x);});validateDividendEvents(events);
      const rawPaymentApprovals=data.marketOverrides?.paymentDateApprovals??[];if(!Array.isArray(rawPaymentApprovals)||rawPaymentApprovals.length>2000)throw new Error('JSON Payment Date 确认记录无效。');const paymentDateApprovals=rawPaymentApprovals.map((x,i)=>{const sourceUrl=String(x?.sourceUrl||'');let parsed;try{parsed=new URL(sourceUrl);}catch{}if(!x||x.ticker!==stockCode||x.source!=='klsescreener-user-approved'||x.paymentDateApproved!==true||x.dateType!=='third-party-payment-date-user-approved'||!/^\d{4}-\d{2}-\d{2}$/.test(x.exDate||'')||!/^\d{4}-\d{2}-\d{2}$/.test(x.paymentDate||'')||x.date!==x.paymentDate||!Number.isFinite(x.perShare)||x.perShare<=0||!parsed||parsed.protocol!=='https:'||parsed.hostname!=='www.klsescreener.com'||!new RegExp(`^/v2/stocks/view/${stockCode.slice(0,-3)}(?:/|$)`).test(parsed.pathname)||x.targetSourceRow!==null&&(!Number.isInteger(x.targetSourceRow)||x.targetSourceRow<3||x.targetSourceRow>10000)||x.targetSourceRow!==null&&(!/^\d{4}-\d{2}-\d{2}$/.test(x.targetDateAtApproval||'')||!Number.isFinite(x.targetAmountAtApproval)||x.targetAmountAtApproval!==x.perShare))throw new Error(`JSON Payment Date 确认记录 ${i+1} 无效。`);return{...x,sourceUrl:parsed.toString()};});if(new Set(paymentDateApprovals.map(x=>`${x.ticker}|${x.exDate}|${x.perShare}`)).size!==paymentDateApprovals.length)throw new Error('JSON Payment Date 确认记录重复。');
      const feeFieldCount=['brokerageMinimum','stampDutyRate','clearingFeeRate','sstRate'].filter(k=>Object.hasOwn(c,k)).length;
      if(feeFieldCount!==0&&feeFieldCount!==4)throw new Error('JSON 交易费用字段不完整。');
      const legacy = data.allocationMode === 'legacy-shares' || (c.cashBudget === undefined && legacyFees);
      const feeModel = data.feeModel ?? (legacyFees ? 'legacy-flat' : 'schedule');
      if (!['legacy-flat','schedule'].includes(feeModel) || (data.allocationMode !== undefined && !['legacy-shares','cash-budget'].includes(data.allocationMode))) throw new Error('JSON 配股或费用模式无效。');
      if (out.startPrice !== prices.find(x=>x.date===out.startDate).close) throw new Error('JSON 开始日价格与收盘价行情不一致。');
      const chargeInitialFees = data.chargeInitialFees ?? !legacy;
      if (!legacy && chargeInitialFees !== true) throw new Error('现金自动配股配置必须计入初始建仓费用。');
      if (typeof chargeInitialFees !== 'boolean') throw new Error('JSON 初始费用设置无效。');
      const feeConfig=feeModel==='legacy-flat'?{feeRate:out.feeRate/100,feeModel}:{feeRate:out.feeRate/100,brokerageMinimum:out.brokerageMinimum,stampDutyRate:out.stampDutyRate/100,stampDutyCap:1000,clearingFeeRate:out.clearingFeeRate/100,clearingFeeCap:1000,sstRate:out.sstRate/100,feeModel};
      if (legacy) {
        if (![out.ownShares,out.financedShares].every(x=>Number.isSafeInteger(x)&&x>=0) || out.ownShares+out.financedShares<=0) throw new Error('旧 JSON 初始持股无效。');
        const required=out.ownShares*out.startPrice+(chargeInitialFees?transactionFees(feeConfig,(out.ownShares+out.financedShares)*out.startPrice).total:0);
        if (out.cashBudget===undefined) out.cashBudget=required;
        if (out.cashBudget<required || !Number.isFinite(out.cashBudget)) throw new Error('JSON 现金预算不足以覆盖原持仓。');
      } else {
        const allocation=calculateInitialAllocation({cashBudget:out.cashBudget,startPrice:out.startPrice,targetLsr:out.targetLsr/100,lotSize:100,...feeConfig});
        if(allocation.totalShares===0)throw new Error('JSON 可用现金不足以买入一手股票及支付费用。');
        if(out.ownShares!==allocation.ownShares||out.financedShares!==allocation.financedShares)throw new Error('JSON 自有/融资股数与可用现金、目标 LSR 或费用参数不匹配。');
      }
      const f=x=>x==null?null:x/100,probe={ownShares:out.ownShares,financedShares:out.financedShares,startPrice:out.startPrice,annualRate:f(out.annualRate),targetLsr:f(out.targetLsr),refinanceTrigger:f(out.refinanceTrigger),marginCallLsr:f(out.marginCallLsr),forceSellLsr:f(out.forceSellLsr),callStrategy:out.callStrategy,safeGap:f(out.safeGap),...feeConfig,lotSize:100,chargeInitialFees};runBacktest(probe,[{date:out.startDate,price:out.startPrice,dividendPerShare:0}]);return{inputs:{...out,lotSize:100},stockCode,selectedStockCode,events,prices,manualPriceDates,paymentDateApprovals,marketDataSource:source,legacyLotSize:c.lotSize??100,allocationMode:legacy?'legacy-shares':'cash-budget',feeModel,chargeInitialFees};
    }
