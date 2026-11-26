// Small, dependency-free ZIP writer using stored (uncompressed) entries.
export function zipFiles(files){
 const enc=new TextEncoder(),parts=[],central=[];let offset=0;
 const crc=bytes=>{let c=0xffffffff;for(const byte of bytes){c^=byte;for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;};
 const header=(size,signature)=>{const a=new Uint8Array(size),v=new DataView(a.buffer);v.setUint32(0,signature,true);return {a,v};};
 for(const [path,value]of Object.entries(files)){
  const name=enc.encode(path),data=enc.encode(value),checksum=crc(data),h=header(30,0x04034b50);
  h.v.setUint16(4,20,true);h.v.setUint16(6,0x800,true);h.v.setUint32(14,checksum,true);h.v.setUint32(18,data.length,true);h.v.setUint32(22,data.length,true);h.v.setUint16(26,name.length,true);
  parts.push(h.a,name,data);const c=header(46,0x02014b50);c.v.setUint16(4,20,true);c.v.setUint16(6,20,true);c.v.setUint16(8,0x800,true);c.v.setUint32(16,checksum,true);c.v.setUint32(20,data.length,true);c.v.setUint32(24,data.length,true);c.v.setUint16(28,name.length,true);c.v.setUint32(42,offset,true);central.push(c.a,name);offset+=30+name.length+data.length;
 }
 const centralSize=central.reduce((n,a)=>n+a.length,0),end=header(22,0x06054b50),count=Object.keys(files).length;
 end.v.setUint16(8,count,true);end.v.setUint16(10,count,true);end.v.setUint32(12,centralSize,true);end.v.setUint32(16,offset,true);
 return new Blob([...parts,...central,end.a],{type:'application/zip'});
}
