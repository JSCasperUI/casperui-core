function int2VarInt(value) {
    if (value >= 127) {
        return Buffer.from(
            [(value >> 8) | 0x80,
                value & 0xFF])
    } else {
        return Buffer.from([value])
    }
}
module.exports.int2VarInt = int2VarInt