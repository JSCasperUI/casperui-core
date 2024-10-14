class ResourceConstID {
    constructor() {
        this.listIdName = []
    }
    getIdByName(name) {
        let idx = this.listIdName.indexOf(name)
        if (idx >= 0) {
            return idx
        }
        this.listIdName.push(name)
        return this.listIdName.length -1
    }
}

module.exports.ResourceConstID = ResourceConstID