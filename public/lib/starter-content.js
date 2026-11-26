// Adapted starter copy from the user-supplied "outling beginnings" outline.
// Planning questions and internal leadership instructions are intentionally excluded.
export function addOutlineStarter(project){
 const p=structuredClone(project),page=id=>p.pages.find(x=>x.id===id),block=(id,bid)=>page(id)?.blocks.find(x=>x.id===bid);
 p.logo||='https://editor.barnabasroadministries.org/brand/barnabas-logo.jpeg';
 p.tagline||='Encouraging men in their walk with Jesus.';
 Object.assign(block('home','home-intro'),{title:'Encouraging men in their walk with Jesus',text:'Barnabas Road brings men together to know Jesus, follow Jesus, and serve Jesus. We share life, encourage one another, and grow in faith through fellowship.',button:'About Barnabas Road',href:'/about/'});
 Object.assign(block('about','about-intro'),{title:'About Barnabas Road',text:'For men who want to know Jesus and grow in their walk with Him.'});
 Object.assign(block('about','about-text'),{title:'Discipleship through fellowship',text:"We study God's Word, put it into practice, and share what God has done in our lives. We encourage men to put God first and lead their families as they follow Jesus."});
 page('about').blocks.push({id:'culture-essentials',type:'list',title:'Our five culture essentials',items:[{title:'Grace : we are loved unconditionally.'},{title:'Walk together : we are not alone; we are brothers in Christ.'},{title:'Full surrender : put God first, followed by family and work.'},{title:'Others over me : serve others and die to self daily.'},{title:'Room for one more : be a friend, make a friend, and lead a friend to Christ.'}]});
 Object.assign(block('programs','programs-intro'),{text:'Knowing Jesus, following Jesus, and serving Jesus.'});
 Object.assign(block('programs','programs-list'),{title:'Growing in faith',items:[{title:'Knowing Jesus',text:"Get to know Jesus through God's Word and the life experiences of other men."},{title:'Following Jesus',text:'Study Scripture, act on it, and devote your life to God.'},{title:'Serving Jesus',text:'Put others first and help a friend grow closer to Christ.'}]});
 page('programs').blocks.push({id:'monthly-gatherings',type:'text',title:'Meetings and retreats',text:'We meet once a month, indoors or outdoors, with spring and fall retreats. Meetings last about 90 minutes and include fellowship, teaching, and personal testimonies.'},{id:'relationships',type:'list',title:'Three areas of discipleship',items:[{title:'Inward : our relationship with ourselves.'},{title:'Upward : our relationship with God.'},{title:'Outward : our relationship with the world.'}]});
 Object.assign(block('donate','donate-intro'),{text:'Contributions help with food costs for our meetings and future spring and fall retreats.'});
 Object.assign(block('contact','contact-intro'),{text:'Gatherings take place at local churches and community spaces. Meeting dates and locations will be shared here.'});
 Object.assign(block('team','team-intro'),{text:'Brian and Kelly lead the meetings.'});
 for(const page of p.pages)for(const block of page.blocks)for(const item of block.items||[])item.text??='';
 return p;
}
