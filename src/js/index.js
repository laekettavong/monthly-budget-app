
const Constants = {
    inputType: '.add__type',
    inputDescription: '.add__description',
    inputValue: '.add__value',
    btnAdd: '.add__btn',
    incomeContainer: '.income__list',
    expensesContainer: '.expenses__list',
    budgetLabel: '.budget__value',
    incomeLabel: '.budget__income--value',
    expensesLabel: '.budget__expenses--value',
    expensesPercentageLabel: '.item__percentage',
    percentageLabel: '.budget__expenses--percentage',
    dateLabel: '.budget__title--month',
    container: '.container',
    income: 'inc',
    expense: 'exp',
    enterKey: 13,
    click: 'click',
    change: 'change',
    keypress: 'keypress'
}

class DOMHelper {
    static isIncome(type) {
        return type === Constants.income
    }

    static isExpense(type) {
        return type === Constants.expense
    }
}

class DOMSelector {
    static getElement(id) {
        return document.querySelector(id)
    }

    static getElementById(id) {
        return document.getElementById(id)
    }

    static getAllElements(ids) {
        return document.querySelectorAll(ids)
    }

    static getItemNodeId(event, type) {
        let nodeIdPrefix;
        if (DOMHelper.isIncome(type)) {
            nodeIdPrefix = `${Constants.income}-`
        } else if (DOMHelper.isExpense(type)) {
            nodeIdPrefix = `${Constants.expense}-`
        }

        return DOMSelector.getParentNodeId(event, nodeIdPrefix)
    }

    static getItemParentNodeId(target) {
        const node = DOMSelector.getNodeWithPrefix(target, `${Constants.income}-`, `${Constants.expense}-`)
        return node ? node.id : null
    }

    static getNodeWithPrefix(target, idPrefix1, idPrefix2) {
        let node = target ? target.parentNode : null
        while (node) {
            if (node.id && (node.id.startsWith(idPrefix1) || node.id.startsWith(idPrefix2))) {
                return node
            }
            node = node.parentNode
        }

        return null
    }
}

class EventBinder {
    static getDOMElement(id) {
        return DOMSelector.getElement(id)
    }

    static bind(id, type, callback) {
        this.getDOMElement(id).addEventListener(type, callback)
    }

    static bindClick(id, callback) {
        this.bind(id, Constants.click, callback)
    }

    static documentBindKey(type, callback) {
        document.addEventListener(type, callback)
    }

    static bindKeyPress(callback) {
        this.documentBindKey(Constants.keypress, callback)
    }

    static bindStateChange(id, callback) {
        this.bind(id, Constants.click, callback)
    }
}


const BudgetController = (() => {
    /*
    const privateMap = new WeakMap()
    const privateLookup = (key) => {
        if (!privateMap.has(key)) privateMap.set(key, {})
        return privateMap.get(key)
    }

    return class Controller {
        constructor(value) {
            privateLookup(this).value = value
        }

        getValue() {
            return privateLookup(this).value
        }

        setValue(value) {
            privateLookup(this).value = value
        }
    }*/

    class Income {
        constructor(id, description, value) {
            this.id = id
            this.description = description
            this.value = value
        }
    }

    class Expense extends Income {
        constructor(id, description, value) {
            super(id, description, value)
            this.percentage = -1
        }

        getPercentage() {
            return this.percentage
        }

        calculatePercentage(totalIncome) {
            this.percentage = -1
            if (totalIncome > 0) {
                this.percentage = Math.round((this.value / totalIncome) * 100)
            }
        }
    }

    class Controller {
        constructor() {
            this.data = {
                allItems: {
                    exp: [],
                    inc: []
                },
                totals: {
                    exp: 0,
                    inc: 0
                },
                budget: 0,
                percentage: -1
            }
        }

        addItem({ type, description, value }) {
            let newItem;
            let id = 1;
            const itemsArr = this.data.allItems[type]
            if (itemsArr.length > 0) {
                const indx = itemsArr.length - 1
                id = itemsArr[indx].id + 1
            }
            if (DOMHelper.isExpense(type)) {
                newItem = new Expense(id, description, value)
            } else if (DOMHelper.isIncome(type)) {
                newItem = new Income(id, description, value)
            }

            this.data.allItems[type].push(newItem)
            return newItem
        }

        calculateTotal(type) {
            let total = 0
            for (let obj of this.data.allItems[type]) {
                total += obj.value
            }
            this.data.totals[type] = total
        }

        calculateBudget() {
            this.calculateTotal(Constants.income)
            this.calculateTotal(Constants.expense)
            this.data.budget = this.data.totals.inc - this.data.totals.exp
            if (this.data.totals.inc > 0) {
                this.data.percentage = Math.round((this.data.totals.exp / this.data.totals.inc) * 100)
            } else {
                this.data.percentage = -1
            }

        }

        calculatePercentages() {
            const totalIncome = this.data.totals.inc
            for (let item of this.data.allItems.exp) {
                item.calculatePercentage(totalIncome)
            }
        }

        getPercentages() {
            return this.data.allItems.exp.map(item => item.getPercentage())
        }

        getBudget() {
            return {
                budget: this.data.budget,
                totalIncome: this.data.totals.inc,
                totalExpense: this.data.totals.exp,
                percentage: this.data.percentage
            }
        }

        deleteItem(type, itemId) {
            this.data.allItems[type] = this.data.allItems[type].filter(item => +item.id !== +itemId)
        }

        echo() {
            console.log('Data: ', this.data)
        }
    }

    return new Controller()
})()


const UIController = (() => {
    const privateMap = new WeakMap()
    const privateLookup = (key) => {
        if (!privateMap.has(key)) privateLookup.set(key, {})
        return privateMap.get(key)
    }

    return class Controller {
        static getInput() {
            return {
                type: DOMSelector.getElement(Constants.inputType).value, //either 'inc' or 'exp'
                description: DOMSelector.getElement(Constants.inputDescription).value,
                value: +DOMSelector.getElement(Constants.inputValue).value
            }
        }

        static addListItem(obj, type) {
            let html, element;
            if (DOMHelper.isIncome(type)) {
                element = Constants.incomeContainer
                html =
                    `<div class="item clearfix" id="inc-${obj.id}">
                    <div class="item__description">${obj.description}</div>
                    <div class="right clearfix">
                        <div class="item__value">${Controller.formatNumber(obj.value)}</div>
                        <div class="item__delete">
                            <button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button>
                        </div>
                    </div>
                </div>`
            } else if (DOMHelper.isExpense(type)) {
                element = Constants.expensesContainer
                html =
                    `<div class="item clearfix" id="exp-${obj.id}">
                    <div class="item__description">${obj.description}</div>
                    <div class="right clearfix">
                        <div class="item__value">${Controller.formatNumber(obj.value)}</div>
                        <div class="item__percentage">21%</div>
                        <div class="item__delete">
                            <button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button>
                        </div>
                    </div>
                </div>`
            }
            DOMSelector.getElement(element).insertAdjacentHTML('beforeend', html)
        }

        static clearFields() {
            let fields = DOMSelector.getAllElements(`${Constants.inputDescription}, ${Constants.inputValue}`)
            fields = [...fields]
            for (let field of fields) {
                field.value = ''
            }
            fields[0].focus()
        }

        static displayBudget(obj) {
            const type = obj.budget > 0 ? Constants.income : Constants.expense
            DOMSelector.getElement(Constants.budgetLabel).textContent = Controller.formatNumber(obj.budget, type)
            DOMSelector.getElement(Constants.incomeLabel).textContent = Controller.formatNumber(obj.totalIncome, Constants.income)
            DOMSelector.getElement(Constants.expensesLabel).textContent = Controller.formatNumber(obj.totalExpense, Constants.expense)
            let percent = '---'
            if (obj.percentage > 0) {
                percent = obj.percentage + '%'
            }
            DOMSelector.getElement(Constants.percentageLabel).textContent = percent
        }

        static deleteListItem(id) {
            const targetNode = DOMSelector.getElementById(id)
            const parentNode = targetNode.parentNode
            parentNode.removeChild(targetNode)
        }

        static displayPercentages(percentages) {
            let nodeList = DOMSelector.getAllElements(Constants.expensesPercentageLabel)
            nodeList = [...nodeList]
            for (let indx in nodeList) {
                let text = '---'
                const percent = percentages[indx]
                if (percent > 0) {
                    text = percent + '%'
                }
                nodeList[indx].textContent = text
            }
        }

        static displayDate() {
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
            const now = new Date()
            const year = now.getFullYear()
            const monthIndex = now.getMonth()
            DOMSelector.getElement(Constants.dateLabel).textContent = `${months[monthIndex]} ${year}`
        }

        static changedType() {
            let fields = DOMSelector.getAllElements(`${Constants.inputType}, ${Constants.inputDescription}, ${Constants.inputValue}`)
            console.log('STATE CHANGED')
            fields = [...fields]
            for (let field of fields) {
                field.classList.toggle('red-focus')
            }

            DOMSelector.getElement(Constants.btnAdd).classList.toggle('red')

        }

        static formatNumber(num, type) {
            num = Math.abs(num).toFixed(2)
            const splitNum = num.split('.')
            let leftNum = splitNum[0]
            const rightNum = splitNum[1]
            const numArray = []
            leftNum = [...leftNum].reverse()
            leftNum.forEach((num, indx) => {
                numArray.push(num)
                if ((indx + 1) % 3 === 0 && indx !== leftNum.length - 1) {
                    numArray.push(',')
                }
            })

            const value = `${numArray.reverse().join('')}.${rightNum}`
            type = DOMHelper.isExpense(type) ? '-' : '+'
            return `${type} ${value}`
        }
    }
})()

const AppController = ((BudgetCtrl, UICtrl) => {
    return class Controller {
        static init() {
            console.log('Application has started.');
            const initBudget = {
                budget: 0,
                totalIncome: 0,
                totalExpense: 0,
                percentage: 0
            }
            UICtrl.displayBudget(initBudget)
            UICtrl.displayDate()
            EventBinder.bindClick(Constants.btnAdd, Controller.addItem)
            EventBinder.bindClick(Constants.container, Controller.deleteItem)
            EventBinder.bindKeyPress(Controller.handleEnterKey)
            EventBinder.bindStateChange(Constants.inputType, UICtrl.changedType)
        }

        static updateBudget() {
            BudgetCtrl.calculateBudget()
            const budget = BudgetCtrl.getBudget()
            UICtrl.displayBudget(budget)
        }

        static updatePercentages() {
            BudgetCtrl.calculatePercentages()
            const percentages = BudgetCtrl.getPercentages()
            UICtrl.displayPercentages(percentages)
            // console.log("Percentages: ", percentages)
        }

        static addItem() {
            const input = UICtrl.getInput()
            if (input.description && input.value > 0) {
                const newItem = BudgetCtrl.addItem(input)
                UICtrl.addListItem(newItem, input.type)
                UICtrl.clearFields()
                Controller.updateBudget()
                Controller.updatePercentages()
                console.log(BudgetCtrl.echo())
            }
        }

        static deleteItem({ target }) {
            const nodeId = DOMSelector.getItemParentNodeId(target)
            if (nodeId) {
                const splitId = nodeId.split('-')
                const type = splitId[0]
                const id = splitId[1]
                BudgetCtrl.deleteItem(type, id)
                UICtrl.deleteListItem(nodeId)
                Controller.updateBudget()
                Controller.updatePercentages()
            }
        }

        static handleEnterKey(event) {
            if (event.keyCode === Constants.enterKey || event.which === Constants.enterKey) {
                Controller.addItem()
            }
        }
    }

    //Controller.init()

})(BudgetController, UIController).init()


/*


class EventHandler {

    static handleEnterKey(event, callback) {
        console.log(event.keyCode, event.which)
        if (event.keyCode === 13 || event.which === 13) {
            //console.log("ENTER was pressed")
            callback()
        }
    }

    static print() {
        console.log("Inside EventHandler")
    }


}


*/






