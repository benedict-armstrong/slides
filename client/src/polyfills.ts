if (!Map.prototype.getOrInsertComputed) {
  Map.prototype.getOrInsertComputed = function <K, V>(key: K, callbackInsert: (key: K) => V): V {
    if (this.has(key)) return this.get(key)!;
    const value = callbackInsert(key);
    this.set(key, value);
    return value;
  };
}
