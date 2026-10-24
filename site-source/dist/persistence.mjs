export function saveSnapshot(storage,key,snapshot,validate=()=>{}){
  validate(snapshot);
  const serialized=JSON.stringify(snapshot);
  storage.setItem(key,serialized);
  return snapshot;
}

export function loadSnapshot(storage,key,validate=()=>{}){
  const serialized=storage.getItem(key);
  if(serialized==null)return null;
  const snapshot=JSON.parse(serialized);
  validate(snapshot);
  return snapshot;
}

export function clearSnapshot(storage,key){
  storage.removeItem(key);
}
