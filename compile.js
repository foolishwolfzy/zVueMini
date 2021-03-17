// 遍历dom结构，解析指令和插值表达式
class Compile {
  // el-带编译模板，vm-KVue实例
  constructor(el, vm) {
    this.$vm = vm;
    this.$el = document.querySelector(el);

    // 把模板中的内容移到片段操作
    // 创建一个游离于dom树之外的节点，在此节点上批量操作，最后插入dom树中，只触发一次重排
    this.$fragment = this.node2Fragment(this.$el);
    // 执行编译
    this.compile(this.$fragment);
    // 放回$el中
    this.$el.appendChild(this.$fragment);
  }

  //
  node2Fragment(el) {
    // 创建片段
    const fragment = document.createDocumentFragment();
    //
    let child;
    while ((child = el.firstChild)) {
      fragment.appendChild(child);
    }
    return fragment;
  }

  compile(el) {
    const childNodes = el.childNodes;
    Array.from(childNodes).forEach(node => {
      console.log('nodeName----',node.nodeName)
      console.log('nodeType----',node.nodeType)
      // if(isElement(node)){
      if (node.nodeType == 1) {
        // 元素
        // console.log('编译元素'+node.nodeName);
        this.compileElement(node);
      } else if (this.isInter(node)) {
        // 只关心{{xxx}}
        // console.log('编译插值文本'+node.textContent);
        this.compileText(node);
      }

      // 递归子节点
      if (node.children && node.childNodes.length > 0) {
        this.compile(node);
      }
    });
  }
  isInter(node) {
    console.log('node.textContent---',node.textContent);
    return node.nodeType == 3 && /\{\{(.*)\}\}/.test(node.textContent);
  }

  // 文本替换
  compileText(node) {
    console.log('compileText----')
    console.log(RegExp.$1);
    console.log(this.$vm[RegExp.$1]);//触发Object.defineProperty get

    // 表达式
    const exp = RegExp.$1;
    this.update(node, exp, "text"); // v-text
  }

  //相当于渲染dom
  update(node, exp, dir) {
    const updator = this[dir + "Updator"];
    updator && updator(node, this.$vm[exp]); // 首次初始化
    // 创建Watcher实例，依赖收集完成了
    new Watcher(this.$vm, exp, function(value) {
      updator && updator(node, value);
    });
  }

  textUpdator(node, value) {
    node.textContent = value;
  }
  htmlUpdator(node, value) {
    console.log('htmlUpdator');
    node.innerHTML = value;
  }

  compileElement(node) {
    // 关心属性
    const nodeAttrs = node.attributes;
    Array.from(nodeAttrs).forEach(attr => {
      // 规定：k-xxx="yyy"
      const attrName = attr.name; //k-xxx
      const exp = attr.value; //yyy
      if (attrName.indexOf("k-") == 0) {
        // 指令
        const dir = attrName.substring(2); //xxx
        // 执行
        this[dir] && this[dir](node, exp);
      }else if (attrName.indexOf("@") == 0){
        // 指令@
        const dir = attrName.substring(1); //xxx click等
        // 事件监听处理
        this.eventHandler(node,exp,dir,this.$vm)
        
        // this[dir] && this[dir](node, exp);
      }
    });
  }

  eventHandler(node, exp,dir,vm) {
    let fn = vm.$options.methods && vm.$options.methods[exp]
    if(dir && fn){
      node.addEventListener(dir,fn.bind(vm))
    }
    
  }


  text(node, exp) {
    this.update(node, exp, 'text')
  }
  html(node, exp) {
    this.update(node, exp, 'html')
  }
  
  isEvent(dir) {
    return dir.indexOf('@') === 0
  }
  model(node, exp){
    // 这里只是对input的双向绑定，还有其他更复杂的checkbox，radio等的双向绑定
    this.update(node, exp, 'model')
    node.addEventListener('input', e =>{
      this.$vm[exp] = e.target.value 
    })
  }
  modelUpdator(node,value){
    node.value = value
  }
}
