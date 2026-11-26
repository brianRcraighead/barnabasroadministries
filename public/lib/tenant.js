export const tenant={name:'Barnabas Road Ministries',repository:'brianRcraighead/barnabasroadministries',studioUrl:'https://editor.barnabasroadministries.org',publicUrl:'https://barnabasroadministries.org'};
export function tenantProject(){return {name:tenant.name,tagline:'',theme:'blue',layout:'header',logo:'',domain:tenant.publicUrl,footer:'',socials:[],donation:{provider:'paypal',url:''},pages:[
{id:'home',title:'Home',path:'/',blocks:[{id:'home-intro',type:'hero',variant:'compact',title:tenant.name}]},
{id:'about',title:'About',path:'/about/',blocks:[{id:'about-intro',type:'hero',variant:'compact',title:'About'},{id:'about-text',type:'text',text:''}]},
{id:'programs',title:'Ministries',path:'/programs/',blocks:[{id:'programs-intro',type:'hero',variant:'compact',title:'Ministries'},{id:'programs-list',type:'programs',items:[]}]},
{id:'donate',title:'Donate',path:'/donate/',blocks:[{id:'donate-intro',type:'donate',title:'Donate',button:'Donate'}]},
{id:'contact',title:'Contact',path:'/contact/',blocks:[{id:'contact-intro',type:'hero',variant:'compact',title:'Contact'},{id:'contact-details',type:'contact',items:[]}]},
{id:'team',title:'Team',path:'/team/',blocks:[{id:'team-intro',type:'hero',variant:'compact',title:'Team'},{id:'team-profiles',type:'team',items:[]}]},
{id:'partners',title:'Partners',path:'/partners/',blocks:[{id:'partners-intro',type:'hero',variant:'compact',title:'Partners'},{id:'partner-list',type:'partners',items:[]}]}]};}
