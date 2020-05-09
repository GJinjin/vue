// 定义Vue构造函数
class Vue {
    constructor(options) {
        // 保存选项
        this.$options = options;
        // 传入data
        this.$data = options.data;
        // 响应化处理
        this.observe(this.$data);

        new Compile(options.el, this);

        options.created && options.created.call(this);
    }

    observe(value) {
        if(!value || typeof value !== 'object') {
            return;
        }

        // 遍历value
        Object.keys(value).forEach(key => {
            // 响应式处理
            this.defineReactive(value, key, value[key]);
            // 定义属性data中的数据
            this.proxyData(key);
        })
    }

    defineReactive(obj, key, val) {
        // 递归遍历
        this.observe(val);

        // 定义Dep
        // 每个Dep实例和data中每个key是一对一关系
        const dep = new Dep();

        // obj每一个key定义数据拦截
        Object.defineProperty(obj, key, {
            get() {
                // 依赖收集
                Dep.target && dep.addDep(Dep.target);
                return val;
            },
            set(newVal) {
                if(newVal === val) {
                    return val;
                } else {
                    // console.log(key+'更新了');
                    val = newVal;
                    dep.notify();
                }
            }
        })
    }

    proxyData(key) {
        Object.defineProperty(this, key, {
            get() {
                return this.$data[key];
            },
            set(newVal) {
                this.$data[key] = newVal;
            }
        })
    }
}

// 创建dep：管理所有watcher
class Dep {
    constructor() {
        // 存储所有依赖
        this.deps = [];
    }

    addDep(dep) {
        this.deps.push(dep);
    }

    notify() {
        this.deps.forEach(dep => dep.update());
    }
}

// 创建Watcher：保存data中数值和页面中的挂钩关系
class Watcher {
    constructor(vm, key, cb) {
        // 创建实例时立刻将该实例指向Dep.target便于收集依赖
        this.vm = vm;
        this.key = key;
        this.cb = cb;

        Dep.target = this;
        this.vm[this.key]; // 触发依赖收集
        Dep.target = null;
    }

    // 更新
    update() {
        // console.log(this.key + '更新了！');
        this.cb.call(this.vm, this.vm[this.key]);
    }
}