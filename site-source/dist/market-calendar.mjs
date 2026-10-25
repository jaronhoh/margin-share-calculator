// Bursa Securities closure evidence is stored per date. No public-holiday inference is used.
export const MARKET_HOLIDAYS = Object.freeze([
  {date:'2015-02-02',status:'confirmed-market-holiday',source:'bursa-cny-closure-circular-2015',url:'https://www.bursamalaysia.com/sites/5bb54be15f36ca0af339077a/assets/5bb55aa65f36ca0c3028d89b/Closure_of_The_Exchange_for_Chinese_New_Year.pdf'},
  {date:'2022-12-26',status:'confirmed-market-holiday',source:'bursa-christmas-new-year-2022',url:'https://www.bursamalaysia.com/bm/about_bursa/media_centre/closure-of-bursa-malaysia-in-conjunction-with-the-christmas-and-new-year-holidays'},
  {date:'2023-01-02',status:'confirmed-market-holiday',source:'bursa-christmas-new-year-2022',url:'https://www.bursamalaysia.com/bm/about_bursa/media_centre/closure-of-bursa-malaysia-in-conjunction-with-the-christmas-and-new-year-holidays'},
  {date:'2024-09-16',status:'confirmed-market-holiday',source:'bursa-prophet-birthday-malaysia-day-2024',url:'https://www.bursamalaysia.com/bm/about_bursa/media_centre/closure-of-bursa-malaysia-in-conjunction-with-prophet-muhammads-birthday-and-malaysia-day-trading-resumes-on-17-september-2024'},
  {date:'2025-01-29',status:'confirmed-market-holiday',source:'bursa-chinese-new-year-2025',url:'https://www.bursamalaysia.com/bm/about_bursa/media_centre/closure-of-bursa-malaysia-in-conjunction-with-the-chinese-new-year-public-holiday'},
  {date:'2025-01-30',status:'confirmed-market-holiday',source:'bursa-chinese-new-year-2025',url:'https://www.bursamalaysia.com/bm/about_bursa/media_centre/closure-of-bursa-malaysia-in-conjunction-with-the-chinese-new-year-public-holiday'}
].map(Object.freeze));
export const MARKET_CALENDAR_COVERAGE=Object.freeze({
  '2015':'BLOCKED','2016':'BLOCKED','2017':'BLOCKED','2018':'BLOCKED','2019':'BLOCKED','2020':'BLOCKED','2021':'BLOCKED',
  '2022':'PARTIAL','2023':'PARTIAL','2024':'PARTIAL','2025':'PARTIAL','2026':'PARTIAL'
});
const holidayByDate=new Map(MARKET_HOLIDAYS.map(day=>[day.date,day]));
export function classifyMarketDate(date,{hasObservedPrice=false}={}){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T00:00:00Z'))||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)throw new Error('市场日期无效。');
  const weekday=new Date(date+'T00:00:00Z').getUTCDay();
  if(weekday===0||weekday===6)return{status:'weekend',tradeAllowed:false};
  const closure=holidayByDate.get(date);
  if(closure)return{...closure,tradeAllowed:false};
  if(hasObservedPrice)return{status:'normal-trading-day',tradeAllowed:true};
  return{status:'unconfirmed-weekday',tradeAllowed:false};
}
export function confirmedMarketHoliday(date){return holidayByDate.get(date)??null;}

