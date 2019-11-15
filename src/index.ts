let routersArray = {}
function routersDes(path) {
    return function routers(target: any, propertyName: string) {
        console.log(path)
        console.log(target)
        console.log(propertyName)
        routersArray[path] = {
            target: this,
            funcName: propertyName
        }
    }
}

class Employee {
    @routersDes("/")
    index() {
        console.log('index')
    }
}

const e = new Employee()

routersArray['/']