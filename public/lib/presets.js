import {newCanvas,newLayer} from './canvas.js';
const L=(kind,extra)=>newLayer(kind,extra);
export const presets=[
{id:'together',name:'Simple introduction',create:()=>newCanvas({title:'Introduction',background:'#ffffff',height:760,layers:[L('text',{text:'Heading',heading:1,x:7,y:10,w:86,h:18,fontSize:64}),L('text',{text:'',x:7,y:35,w:86,h:28,fontSize:28}),L('button',{text:'Contact',href:'/contact/',x:7,y:78,w:30,h:9,background:'#264d6b',color:'#ffffff'})]})},
{id:'save-the-date',name:'Announcement',create:()=>newCanvas({title:'Announcement',background:'#f3f5f7',height:760,layers:[L('text',{text:'Announcement',heading:1,x:7,y:10,w:86,h:20,fontSize:64}),L('text',{text:'',x:7,y:40,w:86,h:38,fontSize:30})]})},
{id:'care-kits',name:'Photo feature',create:()=>newCanvas({title:'Photo feature',background:'#202020',height:900,layers:[L('text',{text:'Heading',heading:1,x:6,y:6,w:88,h:15,fontSize:58,color:'#ffffff'}),L('image',{x:6,y:26,w:88,h:45,alt:'Add a photo'}),L('text',{text:'',x:6,y:77,w:88,h:16,fontSize:28,color:'#ffffff'})]})},
{id:'giving',name:'Donation invitation',create:()=>newCanvas({title:'Donate',background:'#ffffff',height:760,layers:[L('text',{text:'Donate',heading:1,x:7,y:15,w:86,h:20,fontSize:64}),L('button',{text:'Donate',action:'donate',x:7,y:64,w:40,h:12,background:'#264d6b',color:'#ffffff',fontSize:28})]})}];
export function presetCanvas(id){const preset=presets.find(p=>p.id===id);if(!preset)throw Error('Unknown preset');return preset.create();}
export function samplePages(){return presets.map(p=>({id:'sample-'+p.id,title:p.name,path:'/samples/'+p.id+'/',hidden:true,blocks:[presetCanvas(p.id)]}));}
