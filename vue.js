// create Vue constructor
class Vue{
    constructor(options) {
        this.$options = options

        this.$data = options.data

        // data responsiveness
        observe(this.$data)

        // proxy data
        proxy(this, '$data')

        // compile template
        new Compile('#app', this)
    }
}

class Compile {
    constructor(el, vm) {
        this.$el = document.querySelector(el)
        this.$vm = vm

        if(this.$el) {
            this.compile(this.$el)
        }
    }

    compile(el) {
        el.childNodes.forEach(node => {
            // element
            if(node.nodeType === 1) {
                this.compileElement(node)

            // text
            } else if(this.isInter(node)) {
                this.compileText(node)
            }

            if(node.childNodes && node.childNodes.length > 0) {
                this.compile(node)
            }
        })
    }

    compileElement(node) {
        const nodeAttrs = node.attributes

        Array.from(nodeAttrs).forEach(attr => {
            const name = attr.name
            const exp = attr.value

            if(name.indexOf('k-') === 0) {
                const dir = name.slice(2)

                this[dir] && this[dir](node, exp)
            }

            if(name.indexOf('@') === 0) {
                const dir = name.slice(1)

                this.eventHandler(node, dir, exp)
            }
        })
    }

    compileText(node) {
        console.log(node, RegExp.$1)
        this.update(node, RegExp.$1, 'text')
    }

    isInter(node) {
        return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContent)
    }

    html(node, exp) {
        this.update(node, exp, 'html')
    }

    htmlUpdater(node, val) {
        node.innerHTML = val
    }

    text(node, exp) {
        this.update(node, exp, 'text')
    }

    textUpdater(node, val) {
        node.textContent = val
    }

    model(node, exp) {
        this.update(node, exp, 'model')

        node.addEventListener('input', e => {
            console.log(e.target.value)
            this.$vm[exp] = e.target.value
        })
    }

    modelUpdater(node, val) {
        node.value = val
    }

    update(node, exp, dir) {
        const fn = this[dir + 'Updater']

        fn && fn(node, this.$vm[exp])

        new Watch(this.$vm, exp, function(exp) {
            fn && fn(node, exp)
        })
    }

    eventHandler(node, dir, exp) {
        const fn = this.$vm.$options.methods && this.$vm.$options.methods[exp]
        node.addEventListener(dir, fn.bind(this.$vm))
    }
}

class Observer{
    constructor(value) {
        this.value = value

        this.walk(value)
    }

    walk(obj) {
        Object.keys(obj).forEach(key => {
            defineReative(obj, key, obj[key])
        })
    }
}

class Dep {
    constructor() {
        this.deps = []
    }

    addDep(watcher) {
        this.deps.push(watcher)
    }

    notify() {
        this.deps.forEach(watcher => watcher.update())
    }
}

class Watch {
    constructor(vm, key, updateFn) {
        this.vm = vm
        this.key = key
        this.updateFn = updateFn

        Dep.target = this
        this.vm[this.key] // 读取Key值触发依赖收集
        Dep.target = null // 释放全局变量，防止和下一变量冲突

    }

    update() {
        this.updateFn.call(this.vm, this.vm[this.key])
    }
}

// 替换数组原型中7个方法
const orginalProto = Array.prototype
// 备份一份修改备份
const arrayProto = Object.create(orginalProto);

['push', 'pop', 'shift', 'unshift'].forEach(method => {
    arrayProto[method] = function() {
        // 原始操作
        orginalProto[method].apply(this, arguments)
        // 覆盖操作：通知更新
        console.log('数组执行 '+ method + '操作')
    }
})

function observe(obj) {
    if(typeof obj !== 'object' || obj === null) {
        return
    }

    if(Array.isArray(obj)) {
        // 覆盖原型，替换7个变更操作
        obj.__proto__ = arrayProto
        // 对数组内部元素执行响应化
        const keys = Object.keys(obj)
        for(let i = 0; i < obj.length; i++) {
            observe(obj[i])
        }
    } else {
        new Observer(obj)
    }
}

function defineReative(obj, key, val) {
    observe(val)

    const dep = new Dep()

    Object.defineProperty(obj, key, {
        get() {
            console.log(val)
            Dep.target && dep.addDep(Dep.target)
            return val
        },
        set(newVal) {
            console.log(key, newVal)
            if(val === newVal) {
                return;
            } else {
                val = newVal
            }

            dep.notify()
        }
    })
}

function proxy(vm, key) {
    Object.keys(vm[key]).forEach(k => {
        Object.defineProperty(vm, k, {
            get() {
                return vm[key][k]
            },
            set(val) {
                vm[key][k] = val
            }
        })
    })
}