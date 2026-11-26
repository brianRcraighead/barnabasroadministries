import {newCanvas} from './canvas.js';import {presetCanvas} from './presets.js';
const entry=(id,name,category,create)=>({id,name,category,description:'',create});
export const sectionLibrary=[
entry('photo','Photo','Photos',()=>({type:'image',title:'',image:'',alt:'',caption:''})),
entry('gallery','Photo gallery','Photos',()=>({type:'gallery',title:'',items:[]})),
entry('document','Document link','Information',()=>({type:'download',title:'',button:'Open document',href:''})),
entry('supply-list','List','Information',()=>({type:'list',title:'',items:[]})),
entry('schedule-table','Table','Information',()=>({type:'table',title:'',rows:[['',''],['','']]})),
entry('quotation','Quote','About',()=>({type:'quote',title:'',text:'',attribution:''})),
entry('resources','Resource links','Information',()=>({type:'links',title:'',items:[]})),
entry('text-columns','Text columns','Layout',()=>({type:'columns',title:'',columns:2,items:[{title:'',text:''},{title:'',text:''}]})),
entry('mission-hero','Introduction and photo','Welcome',()=>({type:'hero',variant:'feature',title:'',text:'',image:'',alt:'',button:'Contact',href:'/contact/'})),
entry('page-intro','Page heading','Welcome',()=>({type:'hero',variant:'compact',title:'Heading'})),
entry('pantry-notice','Hours and location','Ministries',()=>({type:'notice',title:'Hours and location',text:''})),
entry('program-cards','Ministries list','Ministries',()=>({type:'programs',title:'Ministries',items:[]})),
entry('program-detail','Ministry details','Ministries',()=>({type:'service',title:'Ministry',text:'',items:[],button:'Contact',href:'/contact/'})),
entry('story-photo','Text and photo','About',()=>({type:'split',title:'',text:'',image:'',alt:''})),
entry('donation-appeal','Donation invitation','Giving',()=>({type:'donate',title:'Donate',text:'',button:'Donate'})),
entry('volunteer-invitation','Volunteer invitation','Giving',()=>({type:'volunteer',title:'Volunteer',text:'',button:'Contact',href:'/contact/'})),
entry('ways-to-help','Ways to help','Giving',()=>({type:'programs',title:'Ways to help',items:[]})),
entry('impact-year','Dated results','About',()=>({type:'impact',title:'',items:[]})),
entry('faq','Questions and answers','Information',()=>({type:'faq',title:'Questions and answers',items:[]})),
entry('contact-cards','Contact details','Information',()=>({type:'contact',title:'Contact details',items:[]})),
entry('social-updates','Social media','Information',()=>({type:'social',title:'Social media'})),
entry('partner-list','Partners','People',()=>({type:'partners',title:'Partners',items:[]})),
entry('team-profiles','Team profiles','People',()=>({type:'team',title:'Team',items:[]})),
entry('canva-together','Introduction canvas','Freeform',()=>presetCanvas('together')),
entry('canva-care','Photo canvas','Freeform',()=>presetCanvas('care-kits')),
entry('canva-giving','Donation canvas','Freeform',()=>presetCanvas('giving')),
entry('blank-canvas','Blank canvas','Freeform',()=>newCanvas({title:'Freeform design',background:'#ffffff'}))];
export function libraryBlock(id){const item=sectionLibrary.find(s=>s.id===id);if(!item)throw Error('Unknown section template.');return {...structuredClone(item.create()),id:crypto.randomUUID()};}
export function placeSection(blocks,source,target){if(source===target||source+1===target)return false;if(!Number.isInteger(source)||!Number.isInteger(target)||source<0||source>=blocks.length||target<0||target>blocks.length)return false;const [block]=blocks.splice(source,1);blocks.splice(target>source?target-1:target,0,block);return true;}
export function copySection(block){const copy=structuredClone(block);copy.id=crypto.randomUUID();if(copy.type==='canvas')copy.layers.forEach(l=>l.id=crypto.randomUUID());return copy;}
