// 遍历dom结构,解析指令和插值表达式
class Compile {
    // el-带编译模版
    constructor(el, vm) {
        this.$vm = vm;
        this.$el = document.querySelector(el);

        // 把模版中内容移到片段操作
        this.$fragment = this.node2Fragment(this.$el);
        // 执行编译
        this.compile(this.$fragment);
        // 放回$el中
        this.$el.appendChild(this.$fragment);
    }

    node2Fragment(el) {

        const fragment = document.createDocumentFragment();
        let child;

        while(child = el.firstChild) {
            fragment.appendChild(child);
        }

        return fragment;
    }

    compile(el) {
        const childNodes = el.childNodes;
        Array.from(childNodes).forEach(node => {
            if(node.nodeType === 1) {
                // 元素
                console.log('编译元素'+node.nodeName)
                this.compileElement(node);
            }else if(this.isInter(node)) {
                // {{XXX}}
                this.compileText(node);
            }

            // 递归子节点
            if(node.children && node.childNodes.length) {
                this.compile(node);
            }
        })
    }

    isInter(node) {
       return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContent);
    }

    // 文本替换
    compileText(node) {
        const exp = RegExp.$1;
        this.update(node, exp, 'text');
    }

    compileElement(node) {
        const nodeAttrs = node.attributes;
        Array.from(nodeAttrs).forEach(attr => {
            const attrName = attr.name;
            const exp = attr.value;
            if(attrName.indexOf('k-') === 0) {
                const dir = attrName.substring(2);
                this[dir] && this[dir](node, exp);
            } else if(attrName.indexOf('@') === 0) {
                const dir = attrName.substring(1);
                // 事件监听处理
                this.eventHandler(node, this.$vm, exp, dir);
            }
        })
    }

    // v-text
    text(node, exp) {
        this.update(node, exp, 'text');
    }

    textUpdater(node, value) {
        node.textContent = value;
    }

    // v-html
    html(node, exp) {
        this.update(node, exp, 'html');
    }

    htmlUpdater(node, value) {
        node.innerHTML = value;
    }

    // v-model
    model(node, exp) {
        this.update(node, exp, 'model');

        node.addEventListener('input', e => {
            this.$vm[exp] = e.target.value;
        })
    }

    modelUpdater(node, value) {
        node.value = value;
    }

    update(node, exp, dir) {
        const updator = this[dir+'Updater'];

        updator && updator(node, this.$vm[exp]);

        new Watcher(this.$vm, exp, function(value) {
            updator && updator(node, value);
        });
    }

    // 通过vm.$options.methods[exp]可获得回调函数
    eventHandler(node, vm, exp, dir) {
        let fn = vm.$options.methods && vm.$options.methods[exp];
        if(dir && fn) {
            node.addEventListener(dir, fn.bind(vm));
        }
    }
}


