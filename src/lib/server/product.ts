import 'server-only';
/** The sole sellable product. All checkout amounts originate here, never from a request. */
export const PRODUCT=Object.freeze({
 id:'destiny-code-complete-reading',name:'Destiny Code — Complete Personal Reading',currency:'USD' as const,amount:1290,
 entitlementType:'complete_reading' as const,paymentType:'one_time' as const,
 features:Object.freeze(['Your complete personal Destiny Matrix','Personalized chapters and calculation reference','Full online report and return access','Light & Dark PDF editions','Personalized reflection exercises']),
});
export const PRODUCT_PRICE=new Intl.NumberFormat('en-US',{style:'currency',currency:PRODUCT.currency,minimumFractionDigits:2,maximumFractionDigits:2}).format(PRODUCT.amount/100);
