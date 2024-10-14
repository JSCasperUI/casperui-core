
class IDArray {
    /**
     * @param {string} name
     * @param {number} fieldId
     * @param {IDArray[]}child
     */
    constructor(name,fieldId = -1,child = []) {
        this.name = name;
        this.fieldId = fieldId;
        this.child = child;
    }

}

module.exports.IDArray = IDArray