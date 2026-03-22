const MapProto = Map.prototype as any;
if (!MapProto.getOrInsertComputed) {
  MapProto.getOrInsertComputed = function (key: any, cb: (key: any) => any) {
    if (this.has(key)) return this.get(key);
    const value = cb(key);
    this.set(key, value);
    return value;
  };
}
